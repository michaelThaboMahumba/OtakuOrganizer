import { type CliRenderer } from "@opentui/core";

let renderer: CliRenderer | null = null;

export function setGlobalRenderer(r: CliRenderer) {
  renderer = r;
}

export function getGlobalRenderer(): CliRenderer {
  if (!renderer) throw new Error("Renderer not initialized");
  return renderer;
}
