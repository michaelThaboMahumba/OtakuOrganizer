import { store, type AnimeFile } from "./store";
import { fileScanner } from "./fileScanner";
import { metadataParser } from "./metadata";
import { organizer } from "./organizer";
import { indexer } from "./indexer";
import { aiService } from "../../features/ai/aiService";

export class CommandHandler {
  async scan(folder: string) {
    store.addLog("info", `Scanning: ${folder}`);
    const files = await fileScanner.scan(folder);

    const enrichedFiles: AnimeFile[] = files.map(f => {
      const meta = metadataParser.parse(f.name);
      return {
        ...f,
        series: meta.title,
        season: meta.season,
        episode: meta.episode,
        subtitles: fileScanner.detectSubtitles(f.path),
      };
    });

    store.setState({ files: enrichedFiles });
    await indexer.indexFiles(enrichedFiles);
    store.addLog("success", `Scanned and indexed ${enrichedFiles.length} files.`);
  }

  async groupAll() {
    const files = store.getState().files;
    const newFiles: AnimeFile[] = [];
    store.addLog("info", `Grouping ${files.length} files (Semantic Mode)...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      store.updateProgress(i + 1, files.length, `Analyzing: ${file.name}`);

      let updatedFile = { ...file };

      // Use Semantic Search to improve metadata if AI is disabled
      if (!store.getState().config.ai.enabled && (!updatedFile.series || updatedFile.series === "Unknown")) {
        const matches = await indexer.search(updatedFile.name, true);
        if (matches.length > 0 && matches[0]!.series) {
          updatedFile.series = matches[0]!.series;
          store.addLog("info", `Semantic match for ${updatedFile.name}: ${updatedFile.series}`);
        }
      }

      // Fetch fallback online metadata
      if (!updatedFile.description) {
        const extra = await metadataParser.fetchOnlineMetadata(updatedFile.series || updatedFile.name);
        updatedFile.description = extra.description;
      }

      updatedFile.status = "completed";
      newFiles.push(updatedFile);
    }

    store.setState({ files: newFiles });
    store.clearProgress();
    store.addLog("success", "Grouping complete.");
  }

  async sync(targetRoot: string, dryRun: boolean = false) {
    const files = store.getState().files;
    store.addLog("info", `Syncing to ${targetRoot}...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      store.updateProgress(i + 1, files.length, `Syncing: ${file.name}`);
      await organizer.organize(file, targetRoot, dryRun);
    }

    store.clearProgress();
    store.addLog("success", "Sync complete.");
  }

  async search(query: string) {
    store.addLog("info", `Searching for: ${query}`);
    const results = await indexer.search(query);
    store.addLog("info", `Found ${results.length} matches.`);
    return results;
  }

  async aiSetup(apiKey: string) {
    await aiService.setup(apiKey);
  }

  async aiOrganize() {
    const files = store.getState().files;
    if (!store.getState().config.ai.enabled) {
      store.addLog("error", "AI is not enabled. Run ai-setup first.");
      return;
    }

    store.addLog("info", "Starting AI organization...");
    const newFiles: AnimeFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        store.updateProgress(i + 1, files.length, `AI Analyzing: ${file.name}`);

        let updatedFile = { ...file };
        try {
          const suggestion = await aiService.suggestGrouping(file.name);
          if (suggestion) {
            updatedFile.series = suggestion.series;
            updatedFile.season = suggestion.season;
            updatedFile.episode = suggestion.episode;
            updatedFile.status = "completed";
          }
        } catch (error) {
          store.addLog("error", `AI Error for ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
        newFiles.push(updatedFile);
      }

      store.setState({ files: newFiles });
      store.addLog("success", "AI Organization complete.");
    } finally {
      store.clearProgress();
    }
  }

  async undo() {
    await organizer.undo();
  }
}

export const commandHandler = new CommandHandler();
