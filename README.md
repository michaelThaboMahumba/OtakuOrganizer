# core

To install dependencies:

```bash
bun install
```

To run:

```bash
bun dev
```

This project was created using `bun create tui`. [create-tui](https://git.new/create-tui) is the easiest way to get started with OpenTUI.
This CLI is a terminal-based tool built with OpenTUI and TypeScript that lets you interact with your local filesystem through a structured, keyboard-driven interface instead of a graphical file explorer. Its purpose is to scan, filter, and organize files directly from the terminal, using explicit user input like keywords or rules, then perform deterministic actions such as listing, copying, or grouping files into folders. It runs entirely in a Node.js environment, operates on the current working directory by default, and is designed to scale from simple tasks like organizing media files to more complex workflows like project audits or bulk file operations. No magic, no background automation, no guessing. You tell it what to look for, it shows you what exists, and it executes exactly what you approve.