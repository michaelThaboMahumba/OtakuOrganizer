import { store } from "./store";

export class MetadataParser {
  parse(fileName: string) {
    // Improved regex for various patterns
    const seasonMatch = fileName.match(/(?:S|Season\s*)(\d+)/i) || fileName.match(/(\d+)x/i);
    const episodeMatch = fileName.match(/(?:E|Episode|Ep\s*)(\d+)/i) || fileName.match(/x(\d+)/i) || fileName.match(/\s-\s(\d+)(?:\s|\[)/i);

    const season = seasonMatch ? parseInt(seasonMatch[1]!) : 1;
    const episode = episodeMatch ? parseInt(episodeMatch[1]!) : undefined;

    // Attempt to extract title by removing everything after season/episode/tags
    let title = fileName;
    const splitMatch = seasonMatch || episodeMatch;
    if (splitMatch) {
      title = title.substring(0, title.indexOf(splitMatch[0]));
    }

    title = title
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/_|-/g, " ")
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
