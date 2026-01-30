import fs from "fs";
import path from "path";
import { store, type AnimeFile } from "./store";

interface MoveOperation {
  from: string;
  to: string;
}

export class Organizer {
  private history: MoveOperation[] = [];

  async organize(file: AnimeFile, targetRoot: string, dryRun: boolean = false) {
    if (!file.series) {
      store.addLog("warning", `Skipping ${file.name}: No series name detected.`);
      return;
    }

    const targetDir = path.join(
      targetRoot,
      file.series,
      `Season ${file.season || 1}`,
      `Episode ${file.episode || "Extras"}`
    );

    const targetPath = path.join(targetDir, file.name);

    if (dryRun) {
      store.addLog("info", `[Dry-run] Would move ${file.name} to ${targetDir}`);
      return;
    }

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      if (fs.existsSync(targetPath)) {
        store.addLog("warning", `Duplicate found: ${file.name} already exists in target.`);
        // Could handle renaming here
        return;
      }

      this.safeMove(file.path, targetPath);
      this.history.push({ from: file.path, to: targetPath });

      // Also move subtitles if any
      if (file.subtitles) {
        for (const sub of file.subtitles) {
          const subTarget = path.join(targetDir, path.basename(sub));
          this.safeMove(sub, subTarget);
          this.history.push({ from: sub, to: subTarget });
        }
      }

      store.addLog("success", `Moved ${file.name} successfully.`);
    } catch (error) {
      store.addLog("error", `Failed to move ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private safeMove(from: string, to: string) {
    try {
      fs.renameSync(from, to);
    } catch (error) {
      // Fallback for cross-device moves
      fs.copyFileSync(from, to);
      fs.unlinkSync(from);
    }
  }

  undo() {
    if (this.history.length === 0) {
      store.addLog("warning", "Nothing to undo.");
      return;
    }

    store.addLog("info", "Undoing last operations...");
    while (this.history.length > 0) {
      const op = this.history.pop()!;
      try {
        if (fs.existsSync(op.to)) {
          const dir = path.dirname(op.from);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.renameSync(op.to, op.from);
        }
      } catch (error) {
        store.addLog("error", `Undo failed for ${op.to}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    store.addLog("success", "Undo completed.");
  }
}

export const organizer = new Organizer();
