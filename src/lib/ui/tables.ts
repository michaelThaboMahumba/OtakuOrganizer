import { Box, Text, ScrollBox, TextAttributes } from "@opentui/core";
import { store } from "../store";

/**
 * Render a scrollable, column-aligned table of files from application state.
 *
 * The table includes columns for ID, Name, Series, S/E (season/episode), and Status.
 * Series displays "Unknown" when missing. Season defaults to 1 when null or undefined;
 * episode displays "?" when missing. Status text is uppercased and color-coded:
 * completed -> "#4CAF50", failed -> "#CF6679", otherwise -> "#FFB74D".
 *
 * @returns A vertical Box containing the header row, a single-line separator, and a ScrollBox with one row per file
 */
export function FileTable() {
  const state = store.getState();
  const files = state.files;

  const header = Box(
    { flexDirection: "row", gap: 2, paddingLeft: 1, paddingRight: 1 },
    Text({ content: "ID", width: 8, attributes: TextAttributes.BOLD }),
    Text({ content: "Name", flexGrow: 1, attributes: TextAttributes.BOLD }),
    Text({ content: "Series", width: 20, attributes: TextAttributes.BOLD }),
    Text({ content: "S/E", width: 10, attributes: TextAttributes.BOLD }),
    Text({ content: "Status", width: 12, attributes: TextAttributes.BOLD })
  );

  const rows = files.map((file) =>
    Box(
      { flexDirection: "row", gap: 2, paddingLeft: 1, paddingRight: 1 },
      Text({ content: file.id, width: 8, fg: "#BB86FC" }),
      Text({ content: file.name, flexGrow: 1 }),
      Text({ content: file.series || "Unknown", width: 20, fg: "#03DAC6" }),
      Text({
        content: `S${file.season ?? 1} E${file.episode ?? "?"}`,
        width: 10,
      }),
      Text({
        content: file.status.toUpperCase(),
        width: 12,
        fg: file.status === "completed" ? "#4CAF50" : file.status === "failed" ? "#CF6679" : "#FFB74D",
      })
    )
  );

  return Box(
    { flexDirection: "column", flexGrow: 1 },
    header,
    Box({ height: 1, borderStyle: "single", border: ["top"] }),
    ScrollBox(
      { flexGrow: 1 },
      ...rows
    )
  );
}