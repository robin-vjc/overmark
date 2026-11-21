import type Konva from "konva";

import type { History } from "../history/history";
import type { SettingsSync } from "../settings";

export interface Point {
  x: number;
  y: number;
}

export interface ToolContext {
  annotations: Konva.Layer;
  history: History;
  settings: SettingsSync;
}

/** A drawing tool. Receives pointer events in stage coordinates while it is active. */
export interface Tool {
  down(point: Point, event: PointerEvent): void;
  move(point: Point, event: PointerEvent): void;
  up(point: Point, event: PointerEvent): void;
}
