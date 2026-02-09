import {
  createCliRenderer,
  instantiate,
  type Renderable,
} from "@opentui/core";
import { store } from "./lib/store";
import { Layout } from "./layout";
import { commandHandler } from "./lib/commands";
import { setGlobalRenderer } from "./lib/globals";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
setGlobalRenderer(renderer);

let currentRoot: Renderable | null = null;
let lastUiSnapshot: string | null = null;

/**
 * Update the CLI UI by mounting a new layout when relevant UI state changes, otherwise request a re-render.
 *
 * Reads the current application state, builds a snapshot containing `view`, `filesCount`, `logsCount`, `progress`, `pulse`, `aiEnabled`, and `theme`, and compares it to the last rendered snapshot. If the snapshot differs, unmounts the previous root (if any), instantiates and mounts a new Layout root, and updates the stored snapshot; if the snapshot is identical, requests a renderer re-render without replacing the root.
 */
function render() {
  const state = store.getState();

  // Create a snapshot of UI-relevant state
  const currentSnapshot = JSON.stringify({
    view: state.view,
    filesCount: state.files.length,
    logsCount: state.logs.length,
    progress: state.progress,
    pulse: state.pulse,
    aiEnabled: state.config.ai.enabled,
    theme: state.config.theme,
  });

  if (currentSnapshot !== lastUiSnapshot) {
    if (currentRoot) {
      renderer.root.remove(currentRoot.id);
    }
    const layoutVNode = Layout();
    currentRoot = instantiate(renderer, layoutVNode);
    renderer.root.add(currentRoot);
    lastUiSnapshot = currentSnapshot;
  } else {
    renderer.requestRender();
  }
}

// Subscribe to store changes
store.subscribe(() => {
  render();
});

// Initial render
render();

store.addLog("success", "Otaku Organizer initialized.");

// Welcome message
const welcomeMsg = "Welcome back, Commander. Ready to organize?";
store.addLog("info", welcomeMsg);

// Keyboard Handlers
renderer.on("key", (data: Buffer) => {
  const key = data.toString();

  // F1: Scan
  if (key === "\u001bOP") {
    const dir = store.getState().config.scanDirectories[0] || "./";
    commandHandler.scan(dir);
  }

  // F2: Group
  if (key === "\u001bOQ") {
    commandHandler.groupAll();
  }

  // F3: Sync
  if (key === "\u001bOR") {
    commandHandler.sync("./Organized");
  }

  // F4: AI Organize
  if (key === "\u001bOS") {
    if (!store.getState().config.ai.enabled) {
      store.addLog("warning", "AI not enabled. Use F5 for AI Setup.");
    } else {
      commandHandler.aiOrganize();
    }
  }

  // F5: AI Setup (Escape [ 1 5 ~ )
  if (key === "\u001b[15~") {
    store.addLog("info", "AI SETUP: Enter your OpenRouter API key in the terminal (simulated)");
    // In a real TUI we'd switch view to an input field
    // For now we'll simulate it
    store.setState({ view: "ai-setup" });
  }

  // F10: Undo (Escape [ 2 1 ~ )
  if (key === "\u001b[21~") {
    commandHandler.undo().catch((error) => {
      store.addLog("error", `Undo error: ${error.message}`);
    });
  }

  // Ctrl+L: Toggle Theme
  if (key === "\u000c") {
    store.setState((s) => ({
      config: { ...s.config, theme: s.config.theme === "dark" ? "light" : "dark" },
    }));
  }
});

// Animation Loop (Pulse & Flicker)
setInterval(() => {
  store.setState((s) => ({
    pulse: (s.pulse + 1) % 100,
  }));
}, 100);

console.log("\x1b[?25l"); // Hide cursor