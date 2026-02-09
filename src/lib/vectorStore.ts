export interface EmbeddedResource {
  id: string;
  title: string;
  url: string;
  embeddings: number[];
}

export interface Resource {
  embeddings: EmbeddedResource[];
}

export interface Neighbor {
  id: string;
  title: string;
  url: string;
  score: number;
}

export interface SearchResult {
  neighbors: Neighbor[];
}

export class VectorStore {
  private items: EmbeddedResource[] = [];

  constructor(resource?: Resource) {
    if (resource) {
      this.items = resource.embeddings;
    }
  }

  add(resource: Resource) {
    this.items.push(...resource.embeddings);
  }

  search(queryEmbedding: number[] | Float32Array, k: number): SearchResult {
    const query = Array.from(queryEmbedding);

    const scored = this.items.map(item => {
      const score = this.cosineSimilarity(query, item.embeddings);
      return {
        id: item.id,
        title: item.title,
        url: item.url,
        score
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      neighbors: scored.slice(0, k)
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      const ai = a[i] ?? 0;
      const bi = b[i] ?? 0;
      dotProduct += ai * bi;
      normA += ai * ai;
      normB += bi * bi;
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  clear() {
    this.items = [];
  }

  size(): number {
    return this.items.length;
  }
}
