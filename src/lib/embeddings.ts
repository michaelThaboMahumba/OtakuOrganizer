import { pipeline } from "@xenova/transformers";
import { store } from "./store";

class EmbeddingService {
  private extractor: any = null;
  private initializing: boolean = false;

  async init() {
    if (this.extractor || this.initializing) return;
    this.initializing = true;
    try {
      store.addLog("info", "Loading embedding model (MiniLM-L6-v2)...");
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      store.addLog("success", "Embedding model loaded.");
    } catch (error) {
      store.addLog("error", `Failed to load embedding model: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.initializing = false;
    }
  }

  async generate(text: string): Promise<number[]> {
    await this.init();
    if (!this.extractor) {
      // Fallback to a simple hash-based vector if model fails to load
      return new Array(384).fill(0).map((_, i) => (text.charCodeAt(i % text.length) || 0) / 255);
    }
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

export const embeddingService = new EmbeddingService();
