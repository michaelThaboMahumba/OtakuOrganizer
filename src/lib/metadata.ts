import { store } from "./store";

export class MetadataParser {
  parse(fileName: string) {
    // Improved regex for various patterns.
    // We use word boundaries and specific sequences to avoid matching resolution tags (e.g. 720x480)

    // Standard S01E01 or Season 1 Episode 1
    const stdMatch = fileName.match(/\bS(\d{1,2})E(\d{1,3})\b/i) ||
                     fileName.match(/\bSeason\s*(\d{1,2})\s*Episode\s*(\d{1,3})\b/i);

    // 1x05 format - we ensure it's not part of a resolution like 1280x720
    const xMatch = fileName.match(/\b(\d{1,2})x(\d{1,3})\b/i);

    // Fallback matches
    const seasonFallback = fileName.match(/\bS(\d{1,2})/i) || fileName.match(/\bSeason\s*(\d{1,2})\b/i);
    const episodeFallback = fileName.match(/\bE(\d{1,3})\b/i) ||
                            fileName.match(/\b(?:Episode|Ep)\s*(\d{1,3})\b/i) ||
                            fileName.match(/\s-\s(\d{1,3})(?:\s|\[|$)/i);

    let season: number | undefined;
    let episode: number | undefined;
    let matchStr: string | undefined;

    if (stdMatch) {
      season = parseInt(stdMatch[1]!, 10);
      episode = parseInt(stdMatch[2]!, 10);
      matchStr = stdMatch[0];
    } else if (xMatch) {
      season = parseInt(xMatch[1]!, 10);
      episode = parseInt(xMatch[2]!, 10);
      matchStr = xMatch[0];
    } else {
      if (seasonFallback) {
        season = parseInt(seasonFallback[1]!, 10);
        matchStr = seasonFallback[0];
      }
      if (episodeFallback) {
        episode = parseInt(episodeFallback[1]!, 10);
        matchStr = matchStr || episodeFallback[0];
      }
      // If we only have episode, default season to 1
      if (episode !== undefined && season === undefined) {
        season = 1;
      }
    }

    // Attempt to extract title by removing everything after season/episode/tags
    let title = fileName;
    if (matchStr) {
      const index = title.indexOf(matchStr);
      if (index !== -1) {
        title = title.substring(0, index);
      }
    }

    title = title
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/_|-/g, " ")
      .replace(/\.[^/.]+$/, "") // Remove extension
      .trim();

    return { title, season, episode };
  }

  async fetchOnlineMetadata(title: string) {
    // Mock KO API
    store.addLog("info", `Fetching online metadata for: ${title}`);
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      description: `Detailed information about ${title}. This is a popular anime series.`,
      tags: ["Action", "Adventure", "Fantasy"],
    };
  }
}

export const metadataParser = new MetadataParser();
