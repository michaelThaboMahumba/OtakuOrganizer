import { Box, Text, Input, TextAttributes } from "@opentui/core";
import { store } from "../store";
import { getGlobalRenderer } from "../globals";

/**
 * Renders the onboarding screen for configuring the anime archive folder and wires the Enter key behavior.
 *
 * When the user presses Enter in the folder input, the handler reads and trims the input value; if the trimmed value is empty it logs an error and aborts, otherwise it updates the store to set `config.scanDirectories` to an array containing the entered path, sets the view to `"main"`, and logs a success message.
 *
 * @returns The UI renderable (a Box) that contains the onboarding form and input handlers.
 */
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
      const input = renderer.root.getRenderable("folder-input");
      if (input && "value" in input) {
        const value = String(input.value).trim();
        if (value === "") {
          store.addLog("error", "Please enter a valid folder path.");
          return;
        }
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