import { z } from "zod";

// --- Schemas ---

export const LogLevelSchema = z.enum(["success", "warning", "error", "info"]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LogSchema = z.object({
  id: z.string(),
  level: LogLevelSchema,
  message: z.string(),
  timestamp: z.date(),
});
export type LogEntry = z.infer<typeof LogSchema>;

export const FileStatusSchema = z.enum(["pending", "processing", "completed", "failed", "duplicate"]);
export type FileStatus = z.infer<typeof FileStatusSchema>;

export const AnimeFileSchema = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  series: z.string().optional(),
  season: z.number().optional(),
  episode: z.number().optional(),
  subtitles: z.array(z.string()).optional(),
  description: z.string().optional(),
  status: FileStatusSchema,
  size: z.number(),
  format: z.string(),
});
export type AnimeFile = z.infer<typeof AnimeFileSchema>;

export const ProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  label: z.string(),
  startTime: z.number(),
  speed: z.number(), // files/sec
  eta: z.number(), // seconds remaining
});
export type Progress = z.infer<typeof ProgressSchema>;

export const AIConfigSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  model: z.string().default("openai/gpt-3.5-turbo"),
  rateLimitRequests: z.number().default(10),
  rateLimitWindowMs: z.number().default(60000),
});
export type AIConfig = z.infer<typeof AIConfigSchema>;

export const AppConfigSchema = z.object({
  theme: z.enum(["dark", "light"]),
  scanDirectories: z.array(z.string()),
  allowedFormats: z.array(z.string()),
  autoDetectSeason: z.boolean(),
  includeSubtitles: z.boolean(),
  ai: AIConfigSchema,
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

export const AppViewSchema = z.enum(["onboarding", "main", "ai-setup", "summary"]);
export type AppView = z.infer<typeof AppViewSchema>;

export const AppStateSchema = z.object({
  view: AppViewSchema,
  config: AppConfigSchema,
  files: z.array(AnimeFileSchema),
  logs: z.array(LogSchema),
  progress: ProgressSchema.optional(),
  queue: z.array(z.object({
    id: z.string(),
    fileId: z.string(),
    targetPath: z.string(),
    status: FileStatusSchema,
  })),
  pulse: z.number().default(0),
  indexStats: z.object({
    totalFiles: z.number(),
    foldersCreated: z.number(),
    lastScan: z.date().optional(),
  }),
});
export type AppState = z.infer<typeof AppStateSchema>;

// --- Store Implementation ---

type Listener = (state: AppState) => void;

class JulesStore {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor(initialState: AppState) {
    this.state = initialState;
  }

  getState(): AppState {
    return this.state;
  }

  setState(partialState: Partial<AppState> | ((state: AppState) => Partial<AppState>)) {
    const nextState = typeof partialState === "function" ? partialState(this.state) : partialState;
    this.state = { ...this.state, ...nextState };
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      l(this.state);
    });
  }

  // --- Helpers ---

  addLog(level: LogLevel, message: string) {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      level,
      message,
      timestamp: new Date(),
    };
    this.setState((s) => ({
      logs: [newLog, ...s.logs].slice(0, 100), // Keep last 100 logs
    }));
  }

  updateProgress(current: number, total: number, label: string) {
    const startTime = this.state.progress?.startTime || Date.now();
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = elapsed > 0 ? current / elapsed : 0;
    const remaining = total - current;
    const eta = speed > 0 ? remaining / speed : 0;

    this.setState({
      progress: {
        current,
        total,
        label,
        startTime,
        speed,
        eta,
      },
    });
  }

  clearProgress() {
    this.setState({ progress: undefined });
  }
}

export const initialState: AppState = {
  view: "onboarding",
  config: {
    theme: "dark",
    scanDirectories: [],
    allowedFormats: [".mkv", ".mp4", ".avi"],
    autoDetectSeason: true,
    includeSubtitles: true,
    ai: {
      enabled: false,
      model: "anthropic/claude-3-haiku",
      rateLimitRequests: 10,
      rateLimitWindowMs: 60000,
    },
  },
  files: [],
  logs: [],
  queue: [],
  pulse: 0,
  indexStats: {
    totalFiles: 0,
    foldersCreated: 0,
  },
};

export const store = new JulesStore(initialState);
