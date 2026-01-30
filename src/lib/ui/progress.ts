import { Box, Text, TextAttributes } from "@opentui/core";
import { store } from "../store";

export function ProgressBar() {
  const state = store.getState();
  const progress = state.progress;

  if (!progress) return Box({ height: 0 });

  const percent = Math.floor((progress.current / progress.total) * 100);
  const width = 40;
  const filledWidth = Math.floor((percent / 100) * width);
  const bar = "█".repeat(filledWidth) + "░".repeat(width - filledWidth);

  return Box(
    { flexDirection: "column", paddingTop: 1, paddingBottom: 1 },
    Text({ content: progress.label, attributes: TextAttributes.BOLD }),
    Box(
      { flexDirection: "row", gap: 2 },
      Text({ content: `[${bar}] ${percent}%`, fg: "#03DAC6" }),
      Text({ content: `${progress.speed.toFixed(1)} files/sec`, attributes: TextAttributes.DIM }),
      Text({ content: `ETA: ${progress.eta.toFixed(0)}s`, attributes: TextAttributes.DIM })
    )
  );
}
