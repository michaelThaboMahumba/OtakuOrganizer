import { Box, Text, Input, TextAttributes } from "@opentui/core";
import { store } from "../store";
import { getGlobalRenderer } from "../globals";

export function Onboarding() {
  return Box(
    {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
      padding: 2,
    },
    Text({
      content: "✶ OTAKU ORGANIZER ONBOARDING ✶",
      attributes: TextAttributes.BOLD,
      fg: "#BB86FC",
    }),
    Text({
      content: "Let's set up your anime archive environment.",
      attributes: TextAttributes.DIM,
    }),
    Box({ height: 1 }),
    Text({ content: "Step 1: Enter your anime archive folder path" }),
    Input({
      id: "folder-input",
      placeholder: "/path/to/anime",
    }).on("enter", () => {
      const renderer = getGlobalRenderer();
      const input = renderer.root.find("folder-input");
      if (input && "value" in input) {
        const value = String(input.value);
        store.setState((s) => ({
          config: { ...s.config, scanDirectories: [value] },
          view: "main",
        }));
        store.addLog("success", `Archive folder set to: ${value}`);
      }
    }),
    Box({ height: 1 }),
    Text({
      content: "Press [Enter] to confirm or [ESC] to skip",
      attributes: TextAttributes.DIM,
    })
  );
}
