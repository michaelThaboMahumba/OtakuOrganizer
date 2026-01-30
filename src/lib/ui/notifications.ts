import { Box, Text, ScrollBox, TextAttributes } from "@opentui/core";
import { store, type LogLevel } from "../store";

const COLORS: Record<LogLevel, string> = {
  success: "#4CAF50",
  warning: "#FFB74D",
  error: "#CF6679",
  info: "#BB86FC",
};

export function SidebarLogs() {
  const state = store.getState();
  const logs = state.logs;

  const logElements = logs.map((log) =>
    Box(
      { flexDirection: "column", marginBottom: 1 },
      Text({
        content: `[${log.timestamp.toLocaleTimeString()}]`,
        attributes: TextAttributes.DIM,
      }),
      Text({
        content: log.message,
        fg: COLORS[log.level],
      })
    )
  );

  return Box(
    {
      width: 30,
      flexDirection: "column",
      borderStyle: "single",
      border: ["left"],
      paddingLeft: 1,
      paddingRight: 1,
    },
    Text({ content: "LIVE LOGS", attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE }),
    Box({ height: 1 }),
    ScrollBox(
      { flexGrow: 1 },
      ...logElements
    )
  );
}
