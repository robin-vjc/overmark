import { PALETTE, type ToolId } from "../settings";

export type SizeKind = "stroke" | "font";

/** Everything the toolbar and keyboard shortcuts can trigger. */
export interface Actions {
  setTool(tool: ToolId): void;
  setColor(color: string): void;
  /** Grows (`+1`) or shrinks (`-1`) the selection, or the current tool's width/font size. */
  resize(direction: 1 | -1): void;
  /** What the size slider controls right now: the selection, or the current tool. */
  sizeTarget(): { kind: SizeKind; value: number };
  /** Sets a stroke width or font size for new shapes and for matching selected shapes. */
  setSize(kind: SizeKind, value: number): void;
  deleteSelection(): void;
  undo(): void;
  redo(): void;
  clearAll(): void;
  /** Finishes text editing, else deselects, else switches back to Select. */
  escape(): void;
  hide(): void;
  quit(): void;
}

export const TOOL_KEYS: Record<string, ToolId> = {
  v: "select",
  p: "pen",
  r: "rect",
  e: "ellipse",
  a: "arrow",
  t: "text",
};

/** Shortcuts that work while this overlay has keyboard focus. */
export function bindShortcuts(actions: Actions, isEditingText: () => boolean): void {
  window.addEventListener("keydown", (event) => {
    if (isEditingText() || event.repeat) return;
    const key = event.key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;

    if (mod) {
      if (key === "z" && !event.shiftKey) actions.undo();
      else if (key === "y" || (key === "z" && event.shiftKey)) actions.redo();
      else if (key === "x" && event.shiftKey) actions.clearAll();
      else return;
    } else if (event.altKey) {
      return;
    } else if (key in TOOL_KEYS) {
      actions.setTool(TOOL_KEYS[key]);
    } else if (key === "delete" || key === "backspace") {
      actions.deleteSelection();
    } else if (key === "escape") {
      actions.escape();
    } else {
      const color = PALETTE.find((c) => c.key === key);
      if (!color) return;
      actions.setColor(color.value);
    }
    event.preventDefault();
  });
}

/** Ctrl+Scroll (Cmd+Scroll on macOS) changes width or font size. */
export function bindResizeWheel(container: HTMLElement, actions: Actions): void {
  container.addEventListener(
    "wheel",
    (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.deltaY === 0) return;
      event.preventDefault();
      actions.resize(event.deltaY < 0 ? 1 : -1);
    },
    { passive: false },
  );
}
