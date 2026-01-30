import { Box, Text, TextAttributes } from "@opentui/core";
import { store } from "./lib/store";
import { Onboarding } from "./lib/ui/onboarding";
import { FileTable } from "./lib/ui/tables";
import { SidebarLogs } from "./lib/ui/notifications";
import { ProgressBar } from "./lib/ui/progress";
import { SummaryScreen } from "./lib/ui/summary";
import { AISetup } from "./lib/ui/aiSetup";

const LOGO = [
  " ██████╗ ████████╗ █████╗ ██╗  ██╗██╗   ██╗",
  "██╔═══██╗╚══██╔══╝██╔══██╗██║ ██╔╝██║   ██║",
  "██║   ██║   ██║   ███████║█████╔╝ ██║   ██║",
  "██║   ██║   ██╔══██║██╔═██╗ ██║   ██║",
  "╚██████╔╝   ██║   ██║  ██║██║  ██╗╚██████╔╝",
];

export function Layout() {
  const state = store.getState();

  const Header = Box(
    {
      height: 7,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderStyle: "single",
      border: ["bottom"],
    },
    ...LOGO.map((line) =>
      Text({
        content: line,
        fg: state.pulse % 20 < 10 ? "#BB86FC" : "#D1B2FF",
      })
    ),
    Text({
      content: "OTAKU ORGANIZER v1.0.0 - Premium Anime Archivist",
      attributes: TextAttributes.BOLD,
      fg: "#03DAC6",
    })
  );

  const Footer = Box(
    {
      height: 3,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 2,
      paddingRight: 2,
      gap: 4,
      borderStyle: "single",
      border: ["top"],
    },
    Text({ content: `Files: ${state.files.length}`, fg: "#BB86FC" }),
    Text({ content: `AI: ${state.config.ai.enabled ? "ENABLED" : "DISABLED"}`, attributes: state.config.ai.enabled ? TextAttributes.NONE : TextAttributes.DIM }),
    Text({ content: "F1: Scan | F2: Group | F3: Sync | F4: AI | F10: Undo", attributes: TextAttributes.DIM })
  );

  const MainContent = state.view === "onboarding"
    ? Onboarding()
    : state.view === "summary"
    ? SummaryScreen()
    : state.view === "ai-setup"
    ? AISetup()
    : Box(
        { flexDirection: "row", flexGrow: 1 },
        Box(
          { flexDirection: "column", flexGrow: 1, padding: 1 },
          FileTable(),
          ProgressBar()
        ),
        SidebarLogs()
      );

  return Box(
    {
      flexDirection: "column",
      width: "100%",
      height: "100%",
      backgroundColor: state.config.theme === "dark" ? "#121212" : "#FFFFFF",
    },
    Header,
    MainContent,
    Footer
  );
}
