import { Database } from "bun:sqlite";
import { VectorStore } from "./vectorStore";
import path from "path";
import fs from "fs";
import { type AnimeFile } from "./store";

const DB_PATH = "otaku_archive.db";

export class Indexer {
  private db: Database;
  private voy: VectorStore;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initDb();
    this.voy = new VectorStore();
  }

  private initDb() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        series TEXT,
        season INTEGER,
        episode INTEGER,
        status TEXT,
        size INTEGER,
        format TEXT,
        description TEXT,
        metadata JSON
      );
      CREATE INDEX IF NOT EXISTS idx_name ON files(name);
      CREATE INDEX IF NOT EXISTS idx_series ON files(series);
    `);
  }

  async indexFiles(files: AnimeFile[]) {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO files (id, path, name, series, season, episode, status, size, format, description)
      VALUES ($id, $path, $name, $series, $season, $episode, $status, $size, $format, $description)
    `);

    const transaction = this.db.transaction((files: AnimeFile[]) => {
      for (const file of files) {
        insert.run({
          $id: file.id,
          $path: file.path,
          $name: file.name,
          $series: file.series ?? null,
          $season: file.season ?? null,
          $episode: file.episode ?? null,
          $status: file.status,
          $size: file.size,
          $format: file.format,
          $description: file.description ?? null
        });
      }
    });

    transaction(files);

    // Update Voy for semantic search
    const resource = {
      embeddings: files.map((f) => ({
        id: f.id,
        title: f.name,
        url: f.path,
        // Simulate embeddings (Voy expects 768 or 1536 depending on model, we'll use a simple approach)
        embeddings: this.generateMockEmbedding(f.name + " " + (f.series || "")),
      })),
    };
    this.voy.add(resource);
  }

  private generateMockEmbedding(text: string): number[] {
    // Deterministic mock embeddings for simulation
    const arr = new Array(768).fill(0);
    for (let i = 0; i < text.length; i++) {
      arr[i % 768] += text.charCodeAt(i) / 255;
    }
    return arr;
  }

  search(query: string, semantic: boolean = false): AnimeFile[] {
    if (semantic) {
      const queryEmbedding = new Float32Array(this.generateMockEmbedding(query));
      const results = this.voy.search(queryEmbedding, 10);
      const ids = results.neighbors.map((n) => n.id);
      if (ids.length === 0) return [];

      const placeholders = ids.map(() => "?").join(",");
      return this.db.prepare(`SELECT * FROM files WHERE id IN (${placeholders})`).all(...ids) as unknown as AnimeFile[];
    }

    const results = this.db.query(`
      SELECT * FROM files
      WHERE name LIKE ? OR series LIKE ? OR description LIKE ?
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);

    return results as unknown as AnimeFile[];
  }

  getStats() {
    const count = this.db.query("SELECT COUNT(*) as total FROM files").get() as { total: number };
    return {
      totalFiles: count.total,
    };
  }

  clearIndex() {
    this.db.prepare("DELETE FROM files").run();
  }
}

export const indexer = new Indexer();
