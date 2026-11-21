// Simulates the Tauri backend so the overlay UI can run in a normal browser.
// Used only by the demo page (`src/demo/index.html`), to preview the UI and take README screenshots.

type Callback = (event: { event: string; id: number; payload: unknown }) => void;

const callbacks = new Map<number, Callback>();
const listeners: { event: string; handler: number }[] = [];
let nextId = 1;

function dispatch(event: string, payload: unknown): void {
  for (const listener of listeners) {
    if (listener.event === event) callbacks.get(listener.handler)?.({ event, id: 0, payload });
  }
}

const commands: Record<string, (args: Record<string, unknown>) => unknown> = {
  "plugin:event|listen": (args) => {
    listeners.push({ event: String(args.event), handler: Number(args.handler) });
    return nextId++;
  },
  "plugin:event|emit": (args) => dispatch(String(args.event), args.payload),
  "plugin:store|load": () => 1,
  "plugin:store|get": () => [null, false],
  history_undo: () => dispatch("history:undo", null),
  history_redo: () => dispatch("history:redo", null),
  clear_all: () => dispatch("history:clear", null),
};

Object.assign(window, {
  __TAURI_INTERNALS__: {
    metadata: {
      currentWindow: { label: "overlay-0" },
      currentWebview: { windowLabel: "overlay-0", label: "overlay-0" },
    },
    transformCallback: (callback: Callback) => {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    unregisterCallback: (id: number) => callbacks.delete(id),
    invoke: async (cmd: string, args: Record<string, unknown> = {}) =>
      commands[cmd]?.(args) ?? null,
  },
});
