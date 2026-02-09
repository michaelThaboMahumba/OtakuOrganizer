import { Box, Text, ScrollBox, TextAttributes } from "@opentui/core";
import { store } from "../store";

export function OperationQueue() {
  const state = store.getState();
  const queue = state.queue;

  if (queue.length === 0) return null;

  const items = queue.map((item) =>
    Box(
      { flexDirection: "row", gap: 2 },
      Text({ content: item.id, width: 8, attributes: TextAttributes.DIM }),
      Text({ content: item.targetPath, flexGrow: 1 }),
      Text({
        content: item.status.toUpperCase(),
        width: 10,
        fg: item.status === "completed" ? "#4CAF50" : "#FFB74D",
      })
    )
  );

  return Box(
    {
      height: 10,
      borderStyle: "single",
      border: ["top"],
      flexDirection: "column",
      padding: 1,
    },
    Text({ content: "BATCH QUEUE", attributes: TextAttributes.BOLD }),
    ScrollBox({ flexGrow: 1 }, ...items)
  );
}
