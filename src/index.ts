import {
  ASCIIFont,
  Box,
  createCliRenderer,
  Text,
  TextAttributes,
} from "@opentui/core";

const LOGO_LINES = [
  " ██████╗ ████████╗ █████╗ ██╗  ██╗██╗   ██╗",
  "██╔═══██╗╚══██╔══╝██╔══██╗██║ ██╔╝██║   ██║",
  "██║   ██║   ██║   ███████║█████╔╝ ██║   ██║",
  "██║   ██║   ██╔══██║██╔═██╗ ██║   ██║",
  "╚██████╔╝   ██║   ██║  ██║██║  ██╗╚██████╔╝",
  " ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝",
];

const renderer = await createCliRenderer({ exitOnCtrlC: true });

renderer.root.add(
  Box(
    {
      alignItems: "center",
      justifyContent: "center",
      flexGrow: 1,
      flexDirection: "column",
      gap: 1,
    },
    Text({
      content: "✶ Welcome to Otakurganizer",
      attributes: { fg: "#FF6F61", bold: true },
    }),
    ...LOGO_LINES.map((line) =>
      Text({ content: line, attributes: { fg: "#FF6F61" } })
    ),
    Text({
      content: "engine: bun (latest) | theme: dark | ui: opentui",
      attributes: TextAttributes.DIM,
    })
  )
);
