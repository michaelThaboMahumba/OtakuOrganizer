import { Database } from "bun:sqlite";
import { VectorStore } from "./vectorStore";
import { embeddingService } from "./embeddings";
import { store } from "./store";
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
    // Generate embeddings first using allSettled to handle individual failures
    const embeddingResults = await Promise.allSettled(
      files.map(async (f) => {
        const vector = await embeddingService.generate(f.name + " " + (f.series || ""));
        return {
          id: f.id,
          title: f.name,
          url: f.path,
          embeddings: vector,
          file: f
        };
      })
    );

    const successfulEmbeddings: any[] = [];
    const filesToDb: AnimeFile[] = [];

    for (const result of embeddingResults) {
      if (result.status === "fulfilled") {
        successfulEmbeddings.push({
          id: result.value.id,
          title: result.value.title,
          url: result.value.url,
          embeddings: result.value.embeddings
        });
        filesToDb.push(result.value.file);
      } else {
        store.addLog("error", `Failed to generate embedding for file: ${result.reason}`);
      }
    }

    if (filesToDb.length === 0) return;

    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO files (id, path, name, series, season, episode, status, size, format, description)
      VALUES ($id, $path, $name, $series, $season, $episode, $status, $size, $format, $description)
    `);

    const transaction = this.db.transaction((items: AnimeFile[]) => {
      for (const file of items) {
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

    try {
      transaction(filesToDb);
      this.voy.add({ embeddings: successfulEmbeddings });
    } catch (error) {
      store.addLog("error", `Failed to index files into database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async search(query: string, semantic: boolean = false): Promise<AnimeFile[]> {
    if (semantic) {
      const queryEmbedding = await embeddingService.generate(query);
      const results = this.voy.search(new Float32Array(queryEmbedding), 10);
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
