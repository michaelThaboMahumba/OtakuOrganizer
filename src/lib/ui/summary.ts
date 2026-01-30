import { Box, Text, TextAttributes } from "@opentui/core";
import { store } from "../store";

export function SummaryScreen() {
  const state = store.getState();
  const stats = state.indexStats;

  return Box(
    {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flexGrow: 1,
      gap: 1,
    },
    Text({ content: "✔ OPERATION COMPLETE", attributes: TextAttributes.BOLD, fg: "#4CAF50" }),
    Box({ height: 1 }),
    Text({ content: `Total Files Processed: ${state.files.length}` }),
    Text({ content: `Folders Created: ${stats.foldersCreated}` }),
    Text({ content: `Subtitles Matched: ${state.files.filter(f => f.subtitles?.length).length}` }),
    Box({ height: 1 }),
    Text({ content: "Press [ESC] to return to main view", attributes: TextAttributes.DIM })
  );
}
