import { Box, Text, TextAttributes } from "@opentui/core";
import { store } from "../store";

/**
 * Render a horizontal progress bar UI reflecting the current progress state.
 *
 * If no progress state is available, returns an empty Box with height 0.
 *
 * The visual bar is delivered at a fixed width of 40 character cells and the
 * computed percentage is constrained to the range 0–100. The returned Box
 * contains the progress label and a row showing the bar with percentage,
 * current speed (files/sec), and ETA (seconds).
 *
 * @returns A Box element containing the progress UI, or an empty Box (height 0) when progress is absent.
 */
export function ProgressBar() {
  const state = store.getState();
  const progress = state.progress;

  if (!progress) return Box({ height: 0 });

  const percent = progress.total > 0 ? Math.max(0, Math.min(100, Math.floor((progress.current / progress.total) * 100))) : 0;
  const width = 40;
  const filledWidth = Math.max(0, Math.min(width, Math.floor((percent / 100) * width)));
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