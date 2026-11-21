import { invoke } from "@tauri-apps/api/core";
import type { EventCallback } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const currentWindow = getCurrentWebviewWindow();

/** The overlay on the primary monitor hosts the toolbar and saves settings. */
export const isPrimaryWindow = currentWindow.label === "overlay-0";

/** Listens to events the backend sends to this overlay only (`emit_to`). */
export function onWindowEvent<T>(event: string, handler: EventCallback<T>): void {
  void currentWindow.listen<T>(event, handler);
}

/** Typed wrappers for the Rust commands in `src-tauri/src`. */
export const backend = {
  setDrawMode: (draw: boolean) => invoke<void>("set_draw_mode", { draw }),
  setHit: (hit: boolean) => invoke<void>("set_hit", { hit }),
  refreshHit: () => invoke<void>("refresh_hit"),
  hideOverlays: () => invoke<void>("hide_overlays"),
  quit: () => invoke<void>("quit"),
  historyPush: () => invoke<void>("history_push"),
  undo: () => invoke<void>("history_undo"),
  redo: () => invoke<void>("history_redo"),
  clearAll: () => invoke<void>("clear_all"),
};
