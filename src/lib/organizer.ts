import fs from "fs";
import path from "path";
import { store, type AnimeFile } from "./store";

interface MoveOperation {
  from: string;
  to: string;
}

export class Organizer {
  private history: MoveOperation[] = [];

  private sanitizeSegment(value: string | number): string {
    return String(value)
      .replace(/[\\/]/g, "_")
      .replace(/\.\.+/g, "_")
      .trim();
  }

  async organize(file: AnimeFile, targetRoot: string, dryRun: boolean = false) {
    if (!file.series) {
      store.addLog("warning", `Skipping ${file.name}: No series name detected.`);
      return;
    }

    const targetDir = path.join(
      targetRoot,
      this.sanitizeSegment(file.series),
      this.sanitizeSegment(`Season ${file.season ?? 1}`),
      this.sanitizeSegment(`Episode ${file.episode ?? "Extras"}`)
    );

    const resolvedRoot = path.resolve(targetRoot);
    const resolvedTarget = path.resolve(targetDir);

    if (!resolvedTarget.startsWith(resolvedRoot + path.sep) && resolvedTarget !== resolvedRoot) {
      store.addLog("error", `Refusing to move outside target root: ${resolvedTarget}`);
      return;
    }

    const targetPath = path.join(targetDir, this.sanitizeSegment(file.name));

    if (dryRun) {
      store.addLog("info", `[Dry-run] Would move ${file.name} to ${targetDir}`);
      return;
    }

    try {
      try {
        await fs.promises.access(targetDir);
      } catch {
        await fs.promises.mkdir(targetDir, { recursive: true });
      }

      try {
        await fs.promises.access(targetPath);
        store.addLog("warning", `Duplicate found: ${file.name} already exists in target.`);
        return;
      } catch {
        // Path doesn't exist, proceed
      }

      await this.safeMove(file.path, targetPath);
      this.history.push({ from: file.path, to: targetPath });

      // Also move subtitles if any
      if (file.subtitles) {
        for (const sub of file.subtitles) {
          const subTarget = path.join(targetDir, path.basename(sub));
          await this.safeMove(sub, subTarget);
          this.history.push({ from: sub, to: subTarget });
        }
      }

      store.addLog("success", `Moved ${file.name} successfully.`);
    } catch (error) {
      store.addLog("error", `Failed to move ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async safeMove(from: string, to: string) {
    try {
      await fs.promises.rename(from, to);
    } catch (error: any) {
      if (error.code === 'EXDEV') {
        // Fallback for cross-device moves
        await fs.promises.copyFile(from, to);
        try {
          await fs.promises.unlink(from);
        } catch (unlinkError) {
          // If unlink fails, attempt to remove the copied file to stay consistent
          try {
            await fs.promises.unlink(to);
          } catch {}
          throw new Error(`Failed to remove source after cross-device copy: ${unlinkError instanceof Error ? unlinkError.message : String(unlinkError)}`);
        }
      } else {
        throw error;
      }
    }
  }

  async undo() {
    if (this.history.length === 0) {
      store.addLog("warning", "Nothing to undo.");
      return;
    }

    store.addLog("info", "Undoing last operations...");
    while (this.history.length > 0) {
      const op = this.history.pop()!;
      try {
        await fs.promises.access(op.to);
        const dir = path.dirname(op.from);
        try {
          await fs.promises.access(dir);
        } catch {
          await fs.promises.mkdir(dir, { recursive: true });
        }
        await this.safeMove(op.to, op.from);
      } catch (error) {
        store.addLog("error", `Undo failed for ${op.to}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    store.addLog("success", "Undo completed.");
  }
}

export const organizer = new Organizer();
