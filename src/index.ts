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
import { getDashboardHTML } from "./ui";

interface GenerationRecord {
  id: string;
  title: string;
  status: "pending" | "generating" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
  htmlUrl?: string; // R2 URL
}

// Recommended OpenRouter provider: Cerberas. Very high throughput!
const DEFAULT_PROVIDER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_REQUIREMENT_ANALYSIS_MODEL = "qwen/qwen3-235b-a22b-2507";
const DEFAULT_WEB_DSL_MODEL = "qwen/qwen3-235b-a22b-2507";
const DEFAULT_EVALUATION_MODEL = "qwen/qwen3-235b-a22b-2507";
const DEFAULT_VALIDATION_MODEL = "qwen/qwen3-235b-a22b-thinking-2507";
const DEFAULT_CODING_MODEL = "qwen/qwen3-coder";

type State = {
  config: {
    models: {
      requirementAnalysis: string;
      webDSL: string;
      coding: string;
      evaluation: string;
      validation: string;
    };
    providerUrl: string;
  };
  generations: {
    [id: string]: GenerationRecord;
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
    providerUrl: DEFAULT_PROVIDER_BASE_URL,
  },
  generations: {},
};

export class GenUIAgent extends Agent<Env, State> {
  initialState = INITIAL_STATE;
  openai: OpenAI;

  // Set the OpenAI-like client
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    console.log("🚀 Initializing GenUIAgent...");
    this.openai = new OpenAI({
      baseURL: this.state.config.providerUrl ?? DEFAULT_PROVIDER_BASE_URL,
      apiKey: env.OPENROUTER_API_KEY,
    });
  }

  private async saveGenerationRecord(record: GenerationRecord): Promise<void> {
    this.setState({
      ...this.state,
      generations: { ...this.state.generations, [record.id]: record },
    });
  }

  private async getGenerationRecord(
    id: string
  ): Promise<GenerationRecord | null> {
    const data = this.state.generations[id];
    return data ? data : null;
  }

  private async getAllGenerations(): Promise<GenerationRecord[]> {
    return Object.values(this.state.generations);
  }

  private async saveHtmlToR2(id: string, html: string): Promise<string> {
    const bucket = this.env.BUCKET;
    const key = `${this.ctx.id.toString()}/generations/${id}.html`;
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

    // TODO: most of these + web search
    const reflections = "";
    const recentArtifact = "";
    const artifactContent = "";
    const evaluationResults = "";
    const updateMetaPrompt = "";

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
    console.log(`🎉 HTML generation process completed successfully!`);
    console.log(`🕒 Total time taken: ${Date.now() - startTime}ms`);
    return bestHtml;
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
        temperature: 0.0,
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
        { temperature: 0.0 }
      );
      const refinedHtml = unfence(refinedHtmlRaw);
      console.log(
        `✅ Refinement candidate generated, evaluating vs current best...`
      );

      // evaluate each candidate individually against the current best
      let currentBestHtml = bestHtml;
      let currentBestScore = bestScore;
      let currentBestEvaluation = evaluation;

      const articlesContent = asArticlesJson([
        { id: "candidate", title: "Candidate", html: refinedHtml },
      ]);

      const evalPrompt = interpolate(EVALUATION_PROMPT, {
        requirementsContext: JSON.stringify(requirements, null, 2),
        reflectionsContext: reflections,
        evaluationMetrics: JSON.stringify(metrics, null, 2),
        articlesContent,
      });

      const candidateEval = await callJson(
        this.openai,
        this.state.config.models.evaluation,
        [{ role: "system", content: evalPrompt }],
        UI_EVALUATION_SCHEMA,
        { temperature: 0.2 }
      );

      // pull a robust score from the schema (either path is fine)
      const candidateScore =
        candidateEval?.bestArticle?.totalScore ??
        candidateEval?.articleComparison?.[0]?.overall?.totalScore ??
        0;

      // compare against the saved best; update if improved
      if (candidateScore > currentBestScore) {
        const improvement = candidateScore - currentBestScore;
        console.log(
          `✅ Candidate improves score to ${candidateScore.toFixed(
            1
          )} (+${improvement.toFixed(1)})`
        );
        currentBestHtml = refinedHtml;
        currentBestScore = candidateScore;
        currentBestEvaluation = candidateEval;
      } else {
        console.log(
          `📊 Candidate scored ${candidateScore.toFixed(
            1
          )} — keeping previous best ${currentBestScore.toFixed(1)}`
        );
      }

      // final results for this iteration
      const finalImprovement = currentBestScore - bestScore;
      if (finalImprovement > 0) {
        console.log(
          `🎉 Iteration ${iter} complete - New best found! Score: ${currentBestScore.toFixed(
            1
          )} (improvement: +${finalImprovement.toFixed(1)})`
        );
      } else {
        console.log(
          `📊 Iteration ${iter} complete - Previous best retained with score: ${currentBestScore.toFixed(
            1
          )}`
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

    if (request.method === "GET" && url.pathname === "/api/ws") {
      return agent.fetch(request);
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
