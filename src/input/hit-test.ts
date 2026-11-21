import type Konva from "konva";

import { backend, onWindowEvent } from "../ipc";

export interface HitTestOptions {
  stage: Konva.Stage;
  /** Elements that should always capture the mouse, e.g. the toolbar. */
  interactive: () => HTMLElement[];
  /** True while the overlay must keep the mouse, e.g. mid-drag or editing text. */
  busy: () => boolean;
}

/**
 * Answers the backend's `probe` events in Select mode: does the cursor point
 * at something on this overlay (a shape, a handle, the toolbar)? If not, the
 * backend lets clicks through to the app below.
 */
export function bindHitTest({ stage, interactive, busy }: HitTestOptions): void {
  let pointerDown = false;
  window.addEventListener("pointerdown", () => (pointerDown = true), true);
  window.addEventListener("pointerup", () => (pointerDown = false), true);
  window.addEventListener("pointercancel", () => (pointerDown = false), true);
  window.addEventListener("blur", () => (pointerDown = false));

  onWindowEvent<{ x: number; y: number }>("probe", ({ payload: point }) => {
    const hit =
      pointerDown ||
      busy() ||
      interactive().some((element) => contains(element, point)) ||
      stage.getIntersection(point) !== null;
    void backend.setHit(hit);
  });
}

function contains(element: HTMLElement, { x, y }: { x: number; y: number }): boolean {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}
