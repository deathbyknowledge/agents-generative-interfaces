import type OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ZodType } from "zod";

export function interpolate(
  template: string,
  vars: Record<string, unknown>
): string {
  return Object.entries(vars).reduce((acc, [k, v]) => {
    const val = typeof v === "string" ? v : JSON.stringify(v, null, 2);
    return acc.split(`{${k}}`).join(val);
  }, template);
}

export function stripCodeFences(s: string): string {
  // Remove ```html ... ``` or ``` ... ```
  const codeFence = /^```(?:html)?\s*([\s\S]*?)\s*```$/i;
  const m = s.trim().match(codeFence);
  return m ? m[1].trim() : s.trim();
}

export async function callJson<T>(
  openai: OpenAI,
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  schema: ZodType<T>,
  opts?: {
    adhereToSchema?: boolean;
    retries?: number;
    temperature?: number;
    max_tokens?: number;
    max_completion_tokens?: number;
    n?: number;
  }
): Promise<T> {
  let { retries, adhereToSchema, ...rest } = opts ?? {};
  adhereToSchema = adhereToSchema ?? true;
  let retry = 0;
  while (retry < (retries ?? 3)) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        ...rest,
        response_format: adhereToSchema
          ? zodResponseFormat(schema, "json_object")
          : { type: "json_object" },
        messages,
      });

      const content = completion.choices[0]?.message?.content?.trim() || "{}";
      const cleaned = content;
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.log("Failed", cleaned);
        // Last-ditch attempt: find first/last braces
        const first = cleaned.indexOf("{");
        const last = cleaned.lastIndexOf("}");
        if (first >= 0 && last > first) {
          parsed = JSON.parse(cleaned.slice(first, last + 1));
        } else {
          throw new Error("Model did not return valid JSON.");
        }
      }
      // console.log(parsed);
      if (!adhereToSchema) return parsed;
      const result = schema.safeParse(parsed);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(
          `Model did not return valid JSON. ${result.error.message}`
        );
      }
    } catch (e) {
      console.error("Retrying callJson", e);
      retry++;
    }
  }
  throw new Error("Model did not return valid JSON.");
}

export async function callText(
  openai: OpenAI,
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  opts?: {
    temperature?: number;
    max_tokens?: number;
    max_completion_tokens?: number;
    n?: number;
  },
  retries?: number
): Promise<string | string[]> {
  let { n, ...rest } = opts ?? {};
  n = n ?? 1;
  let retry = retries ?? 0;
  while (retry < 3) {
    try {
      const promises = [];
      for (let i = 0; i < n; i++) {
        promises.push(
          openai.chat.completions.create({
            model,
            messages,
            ...rest,
          })
        );
      }
      const completions = await Promise.all(promises);
      if (n === 1) {
        return completions[0]?.choices[0]?.message?.content?.trim() ?? "";
      }
      return completions.map(
        (c) => c.choices[0]?.message?.content?.trim() ?? ""
      );
    } catch (e) {
      console.error("Retrying callText", e);
      retry++;
    }
  }
  throw new Error("Model did not return valid text.");
}
