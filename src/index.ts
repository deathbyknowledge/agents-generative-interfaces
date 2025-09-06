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

export class GenUIAgent extends Agent<Env> {
  async generateHTML(userPrompt: string): Promise<string> {
    // Let's time the whole thing
    const startTime = Date.now();
    console.log("🚀 Starting HTML generation process...");
    console.log(
      "📝 User prompt:",
      userPrompt.substring(0, 100) + (userPrompt.length > 100 ? "..." : "")
    );

    // const model = "moonshotai/kimi-k2-instruct-0905"
    // const model = "gpt-5-2025-08-07";
    // const model = "gpt-4.1";
    const model = "qwen/qwen3-235b-a22b-2507";
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.OPENROUTER_API_KEY,
    });

    const reflections = ""; // e.g., user prefs/memories
    const recentArtifact = ""; // e.g., last HTML if you persist drafts
    const artifactContent = ""; // empty -> "generate new"
    const evaluationResults = ""; // empty for first pass
    const updateMetaPrompt = ""; // leave empty unless you pre-decide meta

    // 1. Generate requirements
    console.log("📋 Step 1: Analyzing requirements...");
    const reqAnalysisPrompt = interpolate(REQUIREMENTS_ANALYSIS_PROMPT, {
      reflections,
      recentArtifact,
    });

    const requirements = await callJson(
      openai,
      model,
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

    // 2. Generate Web DSL from requirements
    console.log("🏗️  Step 2: Generating Web DSL...");
    const webDslPrompt = interpolate(WEB_DSL_PROMPT, {
      requirementsAnalysis: JSON.stringify(requirements, null, 2),
      artifactContent,
      reflections,
    });

    const webDSL = await callJson(
      openai,
      model,
      [{ role: "system", content: webDslPrompt }],
      webDSLSchema,
      {
        adhereToSchema: false,
        max_completion_tokens: 32000,
        temperature: 0.15,
      }
    );
    console.log("✅ Web DSL generation completed");

    // 3.1 Generate first attempt of the HTML
    console.log("🎨 Step 3: Generating initial HTML and evaluation metrics...");
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
      openai,
      model,
      [{ role: "user", content: genHtmlPromptV1 }],
      {
        max_completion_tokens: 20000,
        // temperature: 0.35,
      }
    );

    // 3.2 Taks-specific Metrics (JSON)
    const metricsPrompt = interpolate(EVALUATION_METRICS_PROMPT, {
      requirementsContext: JSON.stringify(requirements, null, 2),
    });
    const metricsPromise = await callJson(
      openai,
      model,
      [{ role: "system", content: metricsPrompt }],
      DYNAMIC_EVALUATION_METRICS_SCHEMA,
      {
        max_completion_tokens: 5000,
        // temperature: 0.2
      }
    );

    const [htmlV1Raw, metrics] = await Promise.all([
      htmlV1RawPromise,
      metricsPromise,
    ]);
    console.log("✅ Initial HTML and metrics generated");

    const MAX_ITERS = 5;
    const TARGET_SCORE = 92; // stop when best >= this
    const MIN_IMPROVEMENT = 1.5; // or when delta < this

    const unfence = (s: string) =>
      s
        .trim()
        .replace(/^\s*```(?:html)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    const asArticlesJson = (
      cands: Array<{ id: string; title: string; html: string }>
    ) => JSON.stringify(cands, null, 2);

    let bestHtml = unfence(htmlV1Raw);

    // evaluate v1
    console.log("📊 Evaluating initial version...");
    {
      const articlesContent = asArticlesJson([
        { id: "v1", title: "Candidate v1", html: bestHtml },
      ]);
      const evaluationPrompt = interpolate(EVALUATION_PROMPT, {
        requirementsContext: JSON.stringify(requirements, null, 2),
        reflectionsContext: reflections,
        evaluationMetrics: JSON.stringify(metrics, null, 2),
        articlesContent,
      });

      var evaluation = await callJson(
        openai,
        model,
        [{ role: "system", content: evaluationPrompt }],
        UI_EVALUATION_SCHEMA,
        {
          max_completion_tokens: 5000,
          // temperature: 0.2
        }
      );
    }

    let bestScore =
      evaluation.bestArticle.totalScore ??
      evaluation.articleComparison[0]?.overall.totalScore ??
      0;

    console.log(`✅ Initial evaluation completed - Score: ${bestScore}`);
    console.log(
      `🔄 Starting iterative refinement (max ${MAX_ITERS} iterations, target: ${TARGET_SCORE}, min improvement: ${MIN_IMPROVEMENT})...`
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
        openai,
        model,
        [{ role: "user", content: refinePrompt }],
        {
          max_completion_tokens: 20000,
          // temperature: 0.3
        }
      );
      const refinedHtml = unfence(refinedHtmlRaw);
      console.log(
        `✅ Refinement generated, evaluating against current best...`
      );

      // evaluate head-to-head: previous best vs. new refined candidate
      const articlesContent = asArticlesJson([
        { id: "prev", title: `Best so far (iter ${iter - 1})`, html: bestHtml },
        { id: "new", title: `Refined (iter ${iter})`, html: refinedHtml },
      ]);

      const evalPrompt = interpolate(EVALUATION_PROMPT, {
        requirementsContext: JSON.stringify(requirements, null, 2),
        reflectionsContext: reflections,
        evaluationMetrics: JSON.stringify(metrics, null, 2),
        articlesContent,
      });

      const headToHead = await callJson(
        openai,
        model,
        [{ role: "system", content: evalPrompt }],
        UI_EVALUATION_SCHEMA,
        {
          max_completion_tokens: 5000,
          // temperature: 0.2
        }
      );

      const newBestId = headToHead.bestArticle.articleId;
      const newBestScore = headToHead.bestArticle.totalScore;

      // pick winner
      const winnerHtml = newBestId === "new" ? refinedHtml : bestHtml;
      const improvement = newBestScore - bestScore;
      const winner = newBestId === "new" ? "refined version" : "previous best";

      console.log(
        `📊 Evaluation complete - Winner: ${winner} (Score: ${newBestScore}, Improvement: ${improvement.toFixed(
          1
        )})`
      );

      // update state for next round
      bestHtml = winnerHtml;
      bestScore = Math.max(bestScore, newBestScore);
      evaluation = headToHead;

      // stopping conditions
      if (bestScore >= TARGET_SCORE) {
        console.log(
          `🎯 Target score reached (${bestScore} >= ${TARGET_SCORE}), stopping refinement`
        );
        break;
      }
      if (improvement < MIN_IMPROVEMENT) {
        console.log(
          `📈 Minimal improvement (${improvement.toFixed(
            1
          )} < ${MIN_IMPROVEMENT}), stopping refinement`
        );
        break;
      }
    }

    console.log(`\n🔍 Step 4: Final validation and cleanup...`);
    const validatedPrompt = interpolate(VALIDATION_HTML_PROMPT, {
      reflections,
    });

    const validated = await callText(
      openai,
      model,
      [
        { role: "system", content: validatedPrompt },
        { role: "user", content: bestHtml },
      ],
      {
        max_completion_tokens: 20000,
        // temperature: 0.0
      }
    );

    const finalHTML = unfence(validated) || bestHtml;
    console.log(
      `✅ Validation completed - Final HTML ready (${finalHTML.length} characters)`
    );
    console.log(`🎉 HTML generation process completed successfully!`);
    console.log(`🕒 Total time taken: ${Date.now() - startTime}ms`);
    return finalHTML;
  }
}

// Worker
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    // URL safe parameter prompt example "Explain neural networks"
    if (request.method === "GET" && url.pathname === "/generate") {
      const prompt = url.searchParams.get("prompt");
      if (!prompt) return new Response("Prompt is required", { status: 400 });
      const agent = await getAgentByName(env.AGENT, "default");
      const html = await agent.generateHTML(prompt);
      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }
    return new Response("OK");
  },
};
