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

mock.module("voy-search", () => {
  return {
    Voy: class Voy {
      add() {}
      search() {
        return { neighbors: [{ id: "test-id-1" }] };
      }
    }
  };
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
      const results = indexer.search("Naruto");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.series).toBe("Naruto");
    });

    test("should perform semantic search", async () => {
      // Indexer.search(..., true) uses voy
      const results = indexer.search("Ninja anime", true);
      // Even if mock embeddings are simple, it should return results from the voy index
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("Organizer", () => {
    const testRoot = "./test_organize_root";
    const sourceFile = "./test_source.mkv";

    beforeAll(() => {
      if (!fs.existsSync(testRoot)) fs.mkdirSync(testRoot);
      fs.writeFileSync(sourceFile, "dummy content");
    });

    afterAll(() => {
      if (fs.existsSync(testRoot)) fs.rmSync(testRoot, { recursive: true, force: true });
      if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
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
});
