import { emit, listen } from "@tauri-apps/api/event";
import { load, type Store } from "@tauri-apps/plugin-store";

export type ToolId = "select" | "pen" | "rect" | "ellipse" | "arrow" | "text";

export interface PaletteColor {
  name: string;
  value: string;
  /** Keyboard shortcut, only for the main colors. */
  key?: string;
}

export const PALETTE: readonly PaletteColor[] = [
  { name: "Red", value: "#ef4444", key: "1" },
  { name: "Yellow", value: "#facc15", key: "2" },
  { name: "Green", value: "#22c55e", key: "3" },
  { name: "Blue", value: "#3b82f6", key: "4" },
  { name: "Orange", value: "#f97316" },
  { name: "Purple", value: "#a855f7" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#111111" },
];

export const STROKE_WIDTH = { min: 1, max: 40 };
export const FONT_SIZE = { min: 10, max: 160 };

export interface Settings {
  tool: ToolId;
  color: string;
  strokeWidth: number;
  fontSize: number;
  /** Toolbar position in CSS pixels; `null` means centered at the top. */
  toolbar: { x: number; y: number } | null;
}

const DEFAULTS: Settings = {
  tool: "select",
  color: PALETTE[0].value,
  strokeWidth: 4,
  fontSize: 32,
  toolbar: null,
};

const STORE_FILE = "settings.json";
const STORE_KEY = "settings";
const CHANGED_EVENT = "settings:changed";
const SAVE_DELAY_MS = 500;

type Listener = (next: Settings, previous: Settings) => void;

/**
 * Settings shared by all overlay windows. Every change is broadcast as an
 * event and applied when received, so all windows stay in sync.
 */
export class SettingsSync {
  private readonly listeners: Listener[] = [];
  private saveTimer: number | undefined;

  private constructor(
    private value: Settings,
    private readonly store: Store | null,
  ) {}

  /** Pass `persist` from exactly one window to avoid concurrent writes. */
  static async init(persist: boolean): Promise<SettingsSync> {
    let store: Store | null = null;
    let saved: Partial<Settings> = {};
    try {
      store = await load(STORE_FILE, { autoSave: false });
      saved = (await store.get<Partial<Settings>>(STORE_KEY)) ?? {};
    } catch (err) {
      console.warn("Could not load settings, using defaults", err);
    }
    // Always start in Select mode so a fresh launch never blocks the screen.
    const initial = sanitize({ ...DEFAULTS, ...saved, tool: "select" });
    const sync = new SettingsSync(initial, persist ? store : null);
    await listen<Settings>(CHANGED_EVENT, (event) => sync.apply(event.payload));
    return sync;
  }

  get current(): Settings {
    return this.value;
  }

  onChange(listener: Listener): void {
    this.listeners.push(listener);
  }

  update(patch: Partial<Settings>): void {
    void emit(CHANGED_EVENT, sanitize({ ...this.value, ...patch }));
  }

  private apply(next: Settings): void {
    const previous = this.value;
    this.value = next;
    for (const listener of this.listeners) listener(next, previous);
    this.scheduleSave();
  }

  private scheduleSave(): void {
    const store = this.store;
    if (!store) return;
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      const { color, strokeWidth, fontSize, toolbar } = this.value;
      void store
        .set(STORE_KEY, { color, strokeWidth, fontSize, toolbar })
        .then(() => store.save())
        .catch((err: unknown) => console.warn("Could not save settings", err));
    }, SAVE_DELAY_MS);
  }
}

export function clamp(value: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

function sanitize(s: Settings): Settings {
  return {
    tool: s.tool,
    color: PALETTE.some((c) => c.value === s.color) ? s.color : DEFAULTS.color,
    strokeWidth: clamp(Number(s.strokeWidth) || DEFAULTS.strokeWidth, STROKE_WIDTH),
    fontSize: clamp(Number(s.fontSize) || DEFAULTS.fontSize, FONT_SIZE),
    toolbar:
      s.toolbar && Number.isFinite(s.toolbar.x) && Number.isFinite(s.toolbar.y) ? s.toolbar : null,
  };
}
