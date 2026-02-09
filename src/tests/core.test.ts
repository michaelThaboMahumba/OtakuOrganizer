import { expect, test, describe, beforeAll, afterAll, mock } from "bun:test";
import fs from "fs";
import path from "path";

// Mock problematic native modules for the test environment
mock.module("bun:sqlite", () => {
  return {
    Database: class Database {
      run() {}
      prepare() {
        return {
          run: () => {},
          all: () => [{ id: "test-id-1", series: "Naruto", name: "naruto.mkv" }],
          get: () => ({ total: 1 })
        };
      }
      query() {
        return {
          all: () => [{ id: "test-id-1", series: "Naruto", name: "naruto.mkv" }],
          get: () => ({ total: 1 })
        };
      }
      transaction(cb: any) {
        const wrapped = (...args: any[]) => cb(...args);
        return wrapped;
      }
    }
  };
});

mock.module("../lib/vectorStore", () => {
  return {
    VectorStore: class VectorStore {
      add() {}
      search() {
        return { neighbors: [{ id: "test-id-1" }] };
      }
    }
  };
});

mock.module("../lib/embeddings", () => {
  return {
    embeddingService: {
      generate: async () => new Array(384).fill(0).map(() => Math.random()),
      init: async () => {}
    }
  };
});

// Mock global fetch for Jikan API
// @ts-ignore
global.fetch = async () => ({
  ok: true,
  status: 200,
  json: async () => ({
    data: [{ synopsis: "Mock synopsis", genres: [{ name: "Action" }], mal_id: 123, score: 8.5 }]
  })
});

describe("Core Logic Suite", () => {
  let MetadataParser: any;
  let Indexer: any;
  let Organizer: any;
  let FileScanner: any;

  let metadata: any;
  let indexer: any;
  let organizer: any;
  let scanner: any;

  beforeAll(async () => {
    ({ MetadataParser } = await import("../lib/metadata"));
    ({ Indexer } = await import("../lib/indexer"));
    ({ Organizer } = await import("../lib/organizer"));
    ({ FileScanner } = await import("../lib/fileScanner"));

    metadata = new MetadataParser();
    indexer = new Indexer();
    organizer = new Organizer();
    scanner = new FileScanner();
  });

  describe("MetadataParser", () => {
    test("should parse Season and Episode with space", () => {
      const res = metadata.parse("Naruto Season 02 Episode 15.mkv");
      expect(res.title).toBe("Naruto");
      expect(res.season).toBe(2);
      expect(res.episode).toBe(15);
    });

    test("should parse S01E01 format", () => {
      const res = metadata.parse("[Fansub] One Piece S01E05 [1080p].mp4");
      expect(res.title).toBe("One Piece");
      expect(res.season).toBe(1);
      expect(res.episode).toBe(5);
    });

    test("should handle movies without season/episode", () => {
      const res = metadata.parse("Spirited Away.mp4");
      expect(res.title).toBe("Spirited Away");
      expect(res.season).toBeUndefined();
      expect(res.episode).toBeUndefined();
    });

    test("should not misclassify resolution tags", () => {
      const res = metadata.parse("Anime Movie 1280x720.mkv");
      expect(res.title).toBe("Anime Movie 1280x720");
      expect(res.season).toBeUndefined();
      expect(res.episode).toBeUndefined();

      const res2 = metadata.parse("Show 720x480.mkv");
      expect(res2.season).toBeUndefined();
      expect(res2.episode).toBeUndefined();
    });

    test("should correctly parse S/E with resolution tags present", () => {
      const res = metadata.parse("Naruto 720x480 S02E15.mkv");
      expect(res.season).toBe(2);
      expect(res.episode).toBe(15);
    });
  });

  describe("Indexer", () => {
    test("should index and search files", async () => {
      const mockFile = {
        id: "test-id-1",
        path: "/mock/path/naruto.mkv",
        name: "naruto.mkv",
        series: "Naruto",
        season: 1,
        episode: 1,
        status: "pending" as const,
        size: 1000,
        format: ".mkv"
      };

      await indexer.indexFiles([mockFile]);
      const results = await indexer.search("Naruto");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.series).toBe("Naruto");
    });

    test("should perform semantic search", async () => {
      // Indexer.search(..., true) uses voy
      const results = await indexer.search("Ninja anime", true);
      // Even if mock embeddings are simple, it should return results from the voy index
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("Organizer", () => {
    const testRoot = "./test_organize_root";
    const sourceFile = "./test_source.mkv";

    beforeAll(async () => {
      if (!fs.existsSync(testRoot)) await fs.promises.mkdir(testRoot);
      await fs.promises.writeFile(sourceFile, "dummy content");
    });

    afterAll(async () => {
      if (fs.existsSync(testRoot)) await fs.promises.rm(testRoot, { recursive: true, force: true });
      if (fs.existsSync(sourceFile)) await fs.promises.unlink(sourceFile);
    });

    test("should safely move file with sanitization", async () => {
      const file = {
        id: "mov-1",
        path: sourceFile,
        name: "test_source.mkv",
        series: "My Anime/Series", // Contains separator
        season: 1,
        episode: 5,
        status: "pending" as const,
        size: 13,
        format: ".mkv"
      };

      await organizer.organize(file, testRoot);

      // Sanitized path should exist
      // series "My Anime/Series" -> "My Anime_Series"
      const expectedPath = path.join(testRoot, "My Anime_Series", "Season 1", "Episode 5", "test_source.mkv");
      expect(fs.existsSync(expectedPath)).toBe(true);
    });
  });

  describe("FileScanner", () => {
    test("should handle non-existent directories gracefully", async () => {
      const results = await scanner.scan("/non/existent/path");
      expect(results).toEqual([]);
    });
  });
});
