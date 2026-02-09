import { Box, Text, Input, TextAttributes } from "@opentui/core";
import { store } from "../store";
import { aiService } from "../../../features/ai/aiService";
import { getGlobalRenderer } from "../globals";

/**
 * Render the AI feature setup screen with an input for the OpenRouter API key.
 *
 * The UI includes guidelines, a labeled input (id "ai-key-input"), and prompts. When the input emits an "enter" event, the entered key is trimmed and validated; an empty value logs an error, a non-empty value is passed to the AI service setup call, and on success the app view is switched to "main". Setup failures are logged with the error message.
 *
 * @returns A renderable Box containing the AI setup UI.
 */
export function AISetup() {
  return Box(
    {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flexGrow: 1,
      gap: 1,
      padding: 2,
    },
    Text({ content: "🤖 AI FEATURE SETUP", attributes: TextAttributes.BOLD, fg: "#BB86FC" }),
    Text({ content: aiService.getGuidelines(), attributes: TextAttributes.DIM }),
    Box({ height: 1 }),
    Text({ content: "Enter OpenRouter API Key:" }),
    Input({
      id: "ai-key-input",
      placeholder: "sk-or-...",
    }).on("enter", async () => {
      const renderer = getGlobalRenderer();
      const input = renderer.root.getRenderable("ai-key-input");
      if (input && "value" in input) {
        const value = String(input.value).trim();
        if (value === "") {
          store.addLog("error", "Please enter a valid API key.");
          return;
        }
        try {
          await aiService.setup(value);
          store.setState({ view: "main" });
        } catch (error) {
          store.addLog("error", `AI setup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }),
    Box({ height: 1 }),
    Text({ content: "Press [ESC] to cancel", attributes: TextAttributes.DIM })
  );
}