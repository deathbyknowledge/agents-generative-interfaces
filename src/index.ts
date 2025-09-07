import { Agent, getAgentByName, type AgentNamespace } from "agents";
import { env } from "cloudflare:workers";
import { OpenAI } from "openai";
import {
  REQUIREMENTS_ANALYSIS_PROMPT,
  WEB_DSL_PROMPT,
  UPDATE_ENTIRE_ARTIFACT_PROMPT,
  EVALUATION_METRICS_PROMPT,
  EVALUATION_PROMPT,
  VALIDATION_HTML_PROMPT,
} from "./prompts";
import {
  REQUIREMENTS_ANALYSIS_SCHEMA,
  webDSLSchema,
  DYNAMIC_EVALUATION_METRICS_SCHEMA,
  UI_EVALUATION_SCHEMA,
} from "./schemas";
import { callJson, callText, interpolate } from "./utils";
import { zodToJsonSchema } from "openai/_vendor/zod-to-json-schema/zodToJsonSchema.mjs";

interface GenerationRecord {
  id: string;
  title: string;
  status: "pending" | "generating" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
  htmlUrl?: string; // R2 URL
}

const PROVIDER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_REQUIREMENT_ANALYSIS_MODEL = "qwen/qwen3-235b-a22b-2507";
const DEFAULT_WEB_DSL_MODEL = "qwen/qwen3-235b-a22b-2507";
const DEFAULT_EVALUATION_MODEL = "qwen/qwen3-235b-a22b-2507";
const DEFAULT_VALIDATION_MODEL = "qwen/qwen3-235b-a22b-thinking-2507";
const DEFAULT_CODING_MODEL = "qwen/qwen3-235b-a22b-thinking-2507";

type State = {
  config: {
    models: {
      requirementAnalysis: string;
      webDSL: string;
      coding: string;
      evaluation: string;
      validation: string;
    };
  };
};

const INITIAL_STATE: State = {
  config: {
    models: {
      requirementAnalysis: DEFAULT_REQUIREMENT_ANALYSIS_MODEL,
      webDSL: DEFAULT_WEB_DSL_MODEL,
      coding: DEFAULT_CODING_MODEL,
      evaluation: DEFAULT_EVALUATION_MODEL,
      validation: DEFAULT_VALIDATION_MODEL,
    },
  },
};

export class GenUIAgent extends Agent<Env, State> {
  initialState = INITIAL_STATE;
  openai: OpenAI;

  // Set the OpenAI-like client
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    console.log(JSON.stringify(zodToJsonSchema(webDSLSchema), null, 2));
    console.log("🚀 Initializing GenUIAgent...");
    this.openai = new OpenAI({
      baseURL: PROVIDER_BASE_URL,
      apiKey: env.OPENROUTER_API_KEY,
    });
  }

  private async saveGenerationRecord(record: GenerationRecord): Promise<void> {
    await this.ctx.storage.put(
      `generation:${record.id}`,
      JSON.stringify(record)
    );
  }

  private async getGenerationRecord(
    id: string
  ): Promise<GenerationRecord | null> {
    const data = await this.ctx.storage.get(`generation:${id}`);
    return data ? JSON.parse(data as string) : null;
  }

  private async getAllGenerations(): Promise<GenerationRecord[]> {
    const map = await this.ctx.storage.list({ prefix: "generation:" });
    const generations: GenerationRecord[] = [];
    for (const [, value] of map) {
      generations.push(JSON.parse(value as string));
    }
    return generations.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private async saveHtmlToR2(id: string, html: string): Promise<string> {
    const bucket = this.env.BUCKET;
    const key = `generations/${id}.html`;
    await bucket.put(key, html, {
      httpMetadata: { contentType: "text/html" },
    });
    return key;
  }

  async startGeneration(userPrompt: string): Promise<string> {
    const id = crypto.randomUUID();
    const record: GenerationRecord = {
      id,
      title: userPrompt,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await this.saveGenerationRecord(record);

    // Start background generation
    this.ctx.waitUntil(this.generateHTMLBackground(id, userPrompt));

    return id;
  }

  async getGenerationStatus(id: string): Promise<GenerationRecord | null> {
    return this.getGenerationRecord(id);
  }

  async listGenerations(): Promise<GenerationRecord[]> {
    return this.getAllGenerations();
  }

  async getGenerationHTML(id: string): Promise<string | null> {
    const record = await this.getGenerationRecord(id);
    if (!record || !record.htmlUrl) {
      return null;
    }

    const bucket = this.env.BUCKET;
    const object = await bucket.get(record.htmlUrl);
    return object ? await object.text() : null;
  }

  private async generateHTMLBackground(
    id: string,
    userPrompt: string
  ): Promise<void> {
    try {
      // Update status to generating
      const record = await this.getGenerationRecord(id);
      if (!record) return;

      record.status = "generating";
      await this.saveGenerationRecord(record);

      // Generate HTML
      const html = await this.generateHTML(userPrompt);

      // Save to R2
      const htmlUrl = await this.saveHtmlToR2(id, html);

      // Update record with completion
      record.status = "completed";
      record.completedAt = new Date().toISOString();
      record.htmlUrl = htmlUrl;
      await this.saveGenerationRecord(record);
    } catch (error) {
      // Update record with error
      const record = await this.getGenerationRecord(id);
      if (record) {
        record.status = "failed";
        record.error = error instanceof Error ? error.message : "Unknown error";
        record.completedAt = new Date().toISOString();
        await this.saveGenerationRecord(record);
      }
    }
  }

  async generateHTML(userPrompt: string): Promise<string> {
    // Let's time the whole thing
    const startTime = Date.now();
    console.log("🚀 Starting HTML generation process...");
    console.log(
      "📝 User prompt:",
      userPrompt.substring(0, 100) + (userPrompt.length > 100 ? "..." : "")
    );

    const reflections = ""; // e.g., user prefs/memories
    const recentArtifact = ""; // e.g., last HTML if you persist drafts
    const artifactContent = ""; // empty -> "generate new"
    const evaluationResults = ""; // empty for first pass
    const updateMetaPrompt = ""; // leave empty unless you pre-decide meta

    // 1. Generate requirements
    const requirements = await this.analyzeRequirements(
      userPrompt,
      reflections,
      recentArtifact
    );

    // 2. Generate Web DSL from requirements
    const webDSL = await this.generateWebDSL(
      requirements,
      artifactContent,
      reflections
    );

    // 3. Generate initial HTML and evaluation metrics
    const { html: initialHtml, metrics } = await this.generateInitialHTML(
      requirements,
      webDSL,
      artifactContent,
      evaluationResults,
      reflections,
      updateMetaPrompt
    );

    // 4. Evaluate initial HTML
    const { evaluation: initialEvaluation, bestScore: initialBestScore } =
      await this.evaluateInitialHTML(
        requirements,
        reflections,
        metrics,
        initialHtml
      );

    // 5. Perform iterative refinement
    const { bestHtml } = await this.performIterativeRefinement(
      requirements,
      webDSL,
      reflections,
      updateMetaPrompt,
      metrics,
      initialHtml,
      initialEvaluation,
      initialBestScore
    );

    // 6. Final validation and cleanup
    const finalHTML = await this.performFinalValidation(reflections, bestHtml);

    console.log(`🎉 HTML generation process completed successfully!`);
    console.log(`🕒 Total time taken: ${Date.now() - startTime}ms`);
    return finalHTML;
  }

  private async analyzeRequirements(
    userPrompt: string,
    reflections: string,
    recentArtifact: string
  ) {
    console.log("📋 Analyzing requirements...");
    const reqAnalysisPrompt = interpolate(REQUIREMENTS_ANALYSIS_PROMPT, {
      reflections,
      recentArtifact,
    });

    const requirements = await callJson(
      this.openai,
      this.state.config.models.requirementAnalysis,
      [
        {
          role: "system",
          content: reqAnalysisPrompt,
        },
        { role: "user", content: userPrompt },
      ],
      REQUIREMENTS_ANALYSIS_SCHEMA,
      { temperature: 0.2 }
    );
    console.log("✅ Requirements analysis completed");
    return requirements;
  }

  private async generateWebDSL(
    requirements: any,
    artifactContent: string,
    reflections: string
  ) {
    console.log("🏗️ Generating Web DSL...");
    const webDslPrompt = interpolate(WEB_DSL_PROMPT, {
      requirementsAnalysis: JSON.stringify(requirements, null, 2),
      artifactContent,
      reflections,
    });

    const webDSL = await callJson(
      this.openai,
      this.state.config.models.webDSL,
      [{ role: "system", content: webDslPrompt }],
      webDSLSchema,
      {
        adhereToSchema: false,
        temperature: 0.15,
      }
    );
    console.log("✅ Web DSL generation completed");
    return webDSL;
  }

  private async generateInitialHTML(
    requirements: any,
    webDSL: any,
    artifactContent: string,
    evaluationResults: string,
    reflections: string,
    updateMetaPrompt: string
  ) {
    console.log("🎨 Generating initial HTML and evaluation metrics...");
    const genHtmlPromptV1 = interpolate(UPDATE_ENTIRE_ARTIFACT_PROMPT, {
      requirementsAnalysis: JSON.stringify(requirements, null, 2),
      webDSL: JSON.stringify(webDSL, null, 2),
      artifactContent,
      evaluationResults,
      reflections,
      webSearchResults: "",
      updateMetaPrompt,
    });
    const htmlV1RawPromise = callText(
      this.openai,
      this.state.config.models.coding,
      [{ role: "system", content: genHtmlPromptV1 }],
      {
        temperature: 0.0,
      }
    );

    // Task-specific Metrics
    const metricsPrompt = interpolate(EVALUATION_METRICS_PROMPT, {
      requirementsContext: JSON.stringify(requirements, null, 2),
    });
    const metricsPromise = callJson(
      this.openai,
      this.state.config.models.evaluation,
      [{ role: "system", content: metricsPrompt }],
      DYNAMIC_EVALUATION_METRICS_SCHEMA,
      {
        temperature: 0.2,
      }
    );

    const [htmlV1Raw, metrics] = await Promise.all([
      htmlV1RawPromise,
      metricsPromise,
    ]);
    console.log("✅ Initial HTML and metrics generated");

    const unfence = (s: string) =>
      s
        .trim()
        .replace(/^\s*```(?:html)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    return {
      html: unfence(htmlV1Raw as string),
      metrics,
    };
  }

  private async evaluateInitialHTML(
    requirements: any,
    reflections: string,
    metrics: any,
    html: string
  ) {
    console.log("📊 Evaluating initial version...");
    const asArticlesJson = (
      cands: Array<{ id: string; title: string; html: string }>
    ) => JSON.stringify(cands, null, 2);

    const articlesContent = asArticlesJson([
      { id: "v1", title: "Candidate v1", html: html },
    ]);
    const evaluationPrompt = interpolate(EVALUATION_PROMPT, {
      requirementsContext: JSON.stringify(requirements, null, 2),
      reflectionsContext: reflections,
      evaluationMetrics: JSON.stringify(metrics, null, 2),
      articlesContent,
    });

    const evaluation = await callJson(
      this.openai,
      this.state.config.models.evaluation,
      [{ role: "system", content: evaluationPrompt }],
      UI_EVALUATION_SCHEMA,
      {
        temperature: 0.2,
      }
    );

    const bestScore =
      evaluation?.bestArticle?.totalScore ??
      evaluation?.articleComparison?.[0]?.overall?.totalScore ??
      0;

    console.log(`✅ Initial evaluation completed - Score: ${bestScore}`);
    return { evaluation, bestScore };
  }

  private async performIterativeRefinement(
    requirements: any,
    webDSL: any,
    reflections: string,
    updateMetaPrompt: string,
    metrics: any,
    initialHtml: string,
    initialEvaluation: any,
    initialBestScore: number
  ) {
    const MAX_ITERS = 5;
    const TARGET_SCORE = 90; // stop when best >= this

    const unfence = (s: string) =>
      s
        .trim()
        .replace(/^\s*```(?:html)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    const asArticlesJson = (
      cands: Array<{ id: string; title: string; html: string }>
    ) => JSON.stringify(cands, null, 2);

    let bestHtml = initialHtml;
    let bestScore = initialBestScore;
    let evaluation = initialEvaluation;

    console.log(
      `🔄 Starting iterative refinement (max ${MAX_ITERS} iterations, target: ${TARGET_SCORE})...`
    );

    for (let iter = 1; iter <= MAX_ITERS; iter++) {
      console.log(
        `\n🔄 Iteration ${iter}/${MAX_ITERS}: Generating refinement...`
      );
      // generate a refinement using the last evaluation
      const refinePrompt = interpolate(UPDATE_ENTIRE_ARTIFACT_PROMPT, {
        requirementsAnalysis: JSON.stringify(requirements, null, 2),
        webDSL: JSON.stringify(webDSL, null, 2),
        artifactContent: bestHtml, // refine the current best
        evaluationResults: JSON.stringify(evaluation, null, 2),
        reflections,
        webSearchResults: "",
        updateMetaPrompt,
      });

      const refinedHtmlRaw = await callText(
        this.openai,
        this.state.config.models.coding,
        [{ role: "system", content: refinePrompt }],
        { temperature: 0.0, n: 3 }
      ) as string[];
      const refinedHtmls = refinedHtmlRaw.map(unfence);
      console.log(
        `✅ ${refinedHtmls.length} refinement candidates generated, evaluating each vs current best...`
      );
      
      // evaluate each candidate individually against the current best
      let currentBestHtml = bestHtml;
      let currentBestScore = bestScore;
      let currentBestEvaluation = evaluation;
      
      for (let candidateIdx = 0; candidateIdx < refinedHtmls.length; candidateIdx++) {
        const candidateHtml = refinedHtmls[candidateIdx];
        console.log(`\n🔍 Evaluating candidate ${candidateIdx + 1}/${refinedHtmls.length}...`);
        
        // head-to-head comparison: current best vs this candidate
        const articlesContent = asArticlesJson([
          { id: "current_best", title: `Current best (score: ${currentBestScore.toFixed(1)})`, html: currentBestHtml },
          { id: "candidate", title: `Candidate ${candidateIdx + 1}`, html: candidateHtml },
        ]);

        const evalPrompt = interpolate(EVALUATION_PROMPT, {
          requirementsContext: JSON.stringify(requirements, null, 2),
          reflectionsContext: reflections,
          evaluationMetrics: JSON.stringify(metrics, null, 2),
          articlesContent,
        });

        const headToHeadEval = await callJson(
          this.openai,
          this.state.config.models.evaluation,
          [{ role: "system", content: evalPrompt }],
          UI_EVALUATION_SCHEMA,
          {
            temperature: 0.2,
          }
        );

        const winnerId = headToHeadEval.bestArticle.articleId;
        const winnerScore = headToHeadEval.bestArticle.totalScore;
        
        if (winnerId === "candidate") {
          // candidate wins, update current best
          const improvement = winnerScore - currentBestScore;
          console.log(`✅ Candidate ${candidateIdx + 1} wins! Score: ${winnerScore.toFixed(1)} (improvement: +${improvement.toFixed(1)})`);
          currentBestHtml = candidateHtml;
          currentBestScore = winnerScore;
          currentBestEvaluation = headToHeadEval;
        } else {
          // current best still wins
          console.log(`❌ Candidate ${candidateIdx + 1} loses. Current best remains with score: ${currentBestScore.toFixed(1)}`);
        }
      }

      // final results for this iteration
      const finalImprovement = currentBestScore - bestScore;
      if (finalImprovement > 0) {
        console.log(
          `🎉 Iteration ${iter} complete - New best found! Score: ${currentBestScore.toFixed(1)} (improvement: +${finalImprovement.toFixed(1)})`
        );
      } else {
        console.log(
          `📊 Iteration ${iter} complete - Previous best retained with score: ${currentBestScore.toFixed(1)}`
        );
      }

      // update state for next round
      bestHtml = currentBestHtml;
      bestScore = currentBestScore;
      evaluation = currentBestEvaluation;

      // stopping conditions
      if (bestScore >= TARGET_SCORE) {
        console.log(
          `🎯 Target score reached (${bestScore} >= ${TARGET_SCORE}), stopping refinement`
        );
        break;
      }
    }

    return { bestHtml, bestScore, evaluation };
  }

  private async performFinalValidation(reflections: string, bestHtml: string) {
    console.log(`\n🔍 Final validation and cleanup...`);
    const validatedPrompt = interpolate(VALIDATION_HTML_PROMPT, {
      reflections,
    });

    const validated = await callText(
      this.openai,
      this.state.config.models.validation,
      [
        { role: "system", content: validatedPrompt },
        { role: "user", content: bestHtml },
      ],
      {
        temperature: 0.0,
      }
    );

    const unfence = (s: string) =>
      s
        .trim()
        .replace(/^\s*```(?:html)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    // Handle case where validated could be string or string array
    const validatedHtml = Array.isArray(validated) ? validated[0] : validated;
    const finalHTML = unfence(validatedHtml) || bestHtml;
    console.log(
      `✅ Validation completed - Final HTML ready (${finalHTML.length} characters)`
    );

    return finalHTML;
  }
}

// Dashboard HTML
function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generative UI Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        async function startGeneration() {
            const prompt = document.getElementById('prompt').value.trim();
            if (!prompt) {
                alert('Please enter a prompt');
                return;
            }
            
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    document.getElementById('prompt').value = '';
                    showStatus('Generation started! ID: ' + result.id, 'success');
                    setTimeout(refreshGenerations, 1000);
                } else {
                    showStatus('Failed to start generation', 'error');
                }
            } catch (error) {
                showStatus('Error: ' + error.message, 'error');
            }
        }
        
        async function refreshGenerations() {
            try {
                const response = await fetch('/api/generations');
                const generations = await response.json();
                updateGenerationsList(generations);
            } catch (error) {
                console.error('Failed to refresh generations:', error);
            }
        }
        
        function updateGenerationsList(generations) {
            const container = document.getElementById('generations');
            container.innerHTML = generations.map(gen => 
                \`<div class="bg-white p-4 rounded-lg shadow border-l-4 \${getStatusColor(gen.status)}">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-semibold text-gray-800 flex-1 pr-4">\${escapeHtml(gen.title)}</h3>
                        <span class="px-2 py-1 text-xs rounded-full \${getStatusBadge(gen.status)}">\${gen.status}</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-2">
                        <div>Created: \${formatDate(gen.createdAt)}</div>
                        \${gen.completedAt ? \`<div>Completed: \${formatDate(gen.completedAt)}</div>\` : ''}
                        \${gen.error ? \`<div class="text-red-600">Error: \${escapeHtml(gen.error)}</div>\` : ''}
                    </div>
                    <div class="flex gap-2">
                        \${gen.status === 'completed' ? 
                            \`<a href="/api/view/\${gen.id}" target="_blank" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">View</a>\` :
                            \`<button class="bg-gray-300 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed">Generating...</button>\`
                        }
                        <button onclick="refreshGenerations()" class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">Refresh</button>
                    </div>
                </div>\`
            ).join('');
        }
        
        function getStatusColor(status) {
            switch(status) {
                case 'completed': return 'border-green-500';
                case 'generating': return 'border-blue-500';
                case 'failed': return 'border-red-500';
                default: return 'border-gray-500';
            }
        }
        
        function getStatusBadge(status) {
            switch(status) {
                case 'completed': return 'bg-green-100 text-green-800';
                case 'generating': return 'bg-blue-100 text-blue-800';
                case 'failed': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        }
        
        function formatDate(dateStr) {
            return new Date(dateStr).toLocaleString();
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.className = \`p-3 rounded mb-4 \${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`;
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';
            setTimeout(() => statusDiv.style.display = 'none', 5000);
        }
        
        // Auto-refresh every 10 seconds
        setInterval(refreshGenerations, 10000);
        
        // Load on page load
        window.onload = refreshGenerations;
    </script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Generative UI Dashboard</h1>
            <p class="text-gray-600">Create and manage your UI generations</p>
        </header>
        
        <div id="status" style="display: none;"></div>
        
        <div class="bg-white p-6 rounded-lg shadow mb-8">
            <h2 class="text-xl font-semibold mb-4">Start New Generation</h2>
            <div class="flex gap-4">
                <input 
                    type="text" 
                    id="prompt" 
                    placeholder="Enter your UI prompt..." 
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onkeypress="if(event.key==='Enter') startGeneration()"
                >
                <button 
                    onclick="startGeneration()" 
                    class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Generate
                </button>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Recent Generations</h2>
                <button 
                    onclick="refreshGenerations()" 
                    class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Refresh
                </button>
            </div>
            <div id="generations" class="space-y-4">
                <div class="text-center text-gray-500 py-8">Loading generations...</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Worker
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const agent = await getAgentByName(env.AGENT, "default");

    // Dashboard homepage
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(getDashboardHTML(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Start new generation (non-blocking)
    if (request.method === "POST" && url.pathname === "/api/generate") {
      try {
        const body = (await request.json()) as { prompt: string };
        if (!body.prompt) {
          return new Response(JSON.stringify({ error: "Prompt is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const id = await agent.startGeneration(body.prompt);
        return new Response(JSON.stringify({ id, status: "started" }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Get all generations
    if (request.method === "GET" && url.pathname === "/api/generations") {
      const generations = await agent.listGenerations();
      return new Response(JSON.stringify(generations), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get generation status
    if (request.method === "GET" && url.pathname.startsWith("/api/status/")) {
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const generation = await agent.getGenerationStatus(id);
      if (!generation) {
        return new Response(JSON.stringify({ error: "Generation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(generation), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // View generated HTML
    if (request.method === "GET" && url.pathname.startsWith("/api/view/")) {
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response("ID required", { status: 400 });
      }

      const html = await agent.getGenerationHTML(id);
      if (!html) {
        return new Response("Generation not found or not ready", {
          status: 404,
        });
      }

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Legacy endpoint for backward compatibility
    if (request.method === "GET" && url.pathname === "/generate") {
      const prompt = url.searchParams.get("prompt");
      if (!prompt) return new Response("Prompt is required", { status: 400 });
      const html = await agent.generateHTML(prompt);
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
