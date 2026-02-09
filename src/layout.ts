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

/**
 * Builds the application's top-level UI container (header, main content, and footer) using the current application state.
 *
 * The header renders the ASCII logo and title; the main content is chosen from onboarding, summary, AI setup, or the default two-pane file view depending on `state.view`; the footer shows file count, mode indication, and key hints. Visuals such as colors and background are derived from the current state (theme, AI enabled, pulse).
 *
 * @returns A top-level `Box` element containing the assembled layout components configured from the current application state.
 */
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
    Text({
      content: `Mode: ${state.config.ai.enabled ? "AI-POWERED" : "SEMANTIC-ONLY"}`,
      fg: state.config.ai.enabled ? "#03DAC6" : "#FFB74D",
    }),
    Text({ content: "F1: Scan | F2: Group | F3: Sync | F4: AI | F5: Setup | F10: Undo", attributes: TextAttributes.DIM })
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