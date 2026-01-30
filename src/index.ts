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
let lastView: string | null = null;

function render() {
  const state = store.getState();

  // Only full re-render if the view changes
  if (state.view !== lastView) {
    if (currentRoot) {
      renderer.root.remove(currentRoot.id);
    }
    const layoutVNode = Layout();
    currentRoot = instantiate(renderer, layoutVNode);
    renderer.root.add(currentRoot);
    lastView = state.view;
  } else {
    // For property updates, OpenTUI components usually need manual updates
    // In a production-grade app, we'd have a diffing engine.
    // Here we'll do a partial refresh if needed or just request a render.
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

// Typing effect for the welcome message
const welcomeMsg = "Welcome back, Commander. Ready to organize?";
let currentPos = 0;
const interval = setInterval(() => {
  if (currentPos >= welcomeMsg.length) {
    clearInterval(interval);
    return;
  }
  const partial = welcomeMsg.slice(0, currentPos + 1);
  // We can't easily "update" a log entry once added without an ID,
  // so we'll just add it once it's done or add it and update the state.
  currentPos++;
}, 50);

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
    commandHandler.undo();
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
