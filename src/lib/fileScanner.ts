import fs from "fs";
import path from "path";
import { store, type AnimeFile } from "./store";

export class FileScanner {
  async scan(directory: string): Promise<AnimeFile[]> {
    const files: AnimeFile[] = [];
    const allowedFormats = store.getState().config.allowedFormats;

    store.addLog("info", `Scanning directory: ${directory}`);

    const walk = (dir: string) => {
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          walk(filePath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (allowedFormats.includes(ext)) {
            files.push({
              id: Math.random().toString(36).substring(7),
              path: filePath,
              name: file,
              status: "pending",
              size: stat.size,
              format: ext,
            });
          }
        }
      });
    };

    try {
      walk(directory);
      store.addLog("success", `Found ${files.length} video files.`);
    } catch (error) {
      store.addLog("error", `Scan error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return files;
  }

  normalizeName(name: string): string {
    // Remove fansub tags, extra symbols, etc.
    return name
      .replace(/\[.*?\]/g, "") // Remove [Fansub]
      .replace(/\(.*?\)/g, "") // Remove (1080p)
      .replace(/_|-/g, " ")     // Replace _ and - with space
      .replace(/\.[^/.]+$/, "") // Remove extension
      .trim();
  }

  detectSubtitles(videoPath: string): string[] {
    const dir = path.dirname(videoPath);
    const baseName = path.basename(videoPath, path.extname(videoPath));
    const subs: string[] = [];

    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        if (file.startsWith(baseName) && file.endsWith(".srt")) {
          subs.push(path.join(dir, file));
        }
      });
    }
    return subs;
  }
}

export const fileScanner = new FileScanner();
