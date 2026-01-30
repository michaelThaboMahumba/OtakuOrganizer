import { Box, Text, Input, TextAttributes } from "@opentui/core";
import { store } from "../store";
import { aiService } from "../../../features/ai/aiService";
import { getGlobalRenderer } from "../globals";

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
      const input = renderer.root.find("ai-key-input");
      if (input && "value" in input) {
        const value = String(input.value);
        await aiService.setup(value);
        store.setState({ view: "main" });
      }
    }),
    Box({ height: 1 }),
    Text({ content: "Press [ESC] to cancel", attributes: TextAttributes.DIM })
  );
}
