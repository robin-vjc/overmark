import Konva from "konva";

import { clamp, FONT_SIZE, STROKE_WIDTH } from "../settings";

export type ShapeKind = "pen" | "rect" | "ellipse" | "arrow" | "text";

/** Konva `name` shared by every annotation, used to tell them apart from UI nodes. */
export const ANNOTATION = "annotation";

const FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Thin strokes get a wider invisible hit area so they're easy to click. */
const MIN_HIT_WIDTH = 14;

export function kindOf(node: Konva.Node): ShapeKind {
  return node.getAttr("kind") as ShapeKind;
}

export function isAnnotation(node: Konva.Node): node is Konva.Shape {
  return node.hasName(ANNOTATION);
}

const base = (kind: ShapeKind) => ({
  name: ANNOTATION,
  kind,
  draggable: true,
  strokeScaleEnabled: false,
  perfectDrawEnabled: false,
});

export function createPen(color: string, width: number, x: number, y: number): Konva.Line {
  return new Konva.Line({
    ...base("pen"),
    ...widthAttrs("pen", width),
    points: [x, y, x, y],
    stroke: color,
    lineCap: "round",
    lineJoin: "round",
  });
}

export function createRect(color: string, width: number, x: number, y: number): Konva.Rect {
  return new Konva.Rect({
    ...base("rect"),
    ...widthAttrs("rect", width),
    x,
    y,
    stroke: color,
    // An invisible fill makes the inside clickable, like in PowerPoint.
    fill: "transparent",
  });
}

export function createEllipse(color: string, width: number, x: number, y: number): Konva.Ellipse {
  return new Konva.Ellipse({
    ...base("ellipse"),
    ...widthAttrs("ellipse", width),
    x,
    y,
    radiusX: 0,
    radiusY: 0,
    stroke: color,
    fill: "transparent",
  });
}

export function createArrow(color: string, width: number, x: number, y: number): Konva.Arrow {
  return new Konva.Arrow({
    ...base("arrow"),
    ...widthAttrs("arrow", width),
    points: [x, y, x, y],
    stroke: color,
    fill: color,
    lineCap: "round",
    lineJoin: "round",
  });
}

export function createText(color: string, fontSize: number, x: number, y: number): Konva.Text {
  return new Konva.Text({
    ...base("text"),
    x,
    y,
    text: "",
    fontSize,
    fontFamily: FONT_FAMILY,
    lineHeight: 1.2,
    fill: color,
  });
}

/** Current stroke width, or font size for text. */
export function sizeOf(node: Konva.Shape): number {
  return kindOf(node) === "text" ? (node as Konva.Text).fontSize() : node.strokeWidth();
}

/** Attributes that set the stroke width, or font size for text. */
export function sizeAttrs(node: Konva.Shape, size: number): Record<string, number> {
  const kind = kindOf(node);
  return kind === "text"
    ? { fontSize: clamp(size, FONT_SIZE) }
    : widthAttrs(kind, clamp(size, STROKE_WIDTH));
}

/** Names of the attributes `sizeAttrs` changes, for undo snapshots. */
export function sizeKeys(node: Konva.Node): string[] {
  const kind = kindOf(node);
  if (kind === "text") return ["fontSize"];
  if (kind === "arrow") return ["strokeWidth", "hitStrokeWidth", "pointerLength", "pointerWidth"];
  return ["strokeWidth", "hitStrokeWidth"];
}

export function colorAttrs(node: Konva.Node, color: string): Record<string, string> {
  switch (kindOf(node)) {
    case "text":
      return { fill: color };
    case "arrow":
      return { stroke: color, fill: color };
    default:
      return { stroke: color };
  }
}

export function colorKeys(node: Konva.Node): string[] {
  return Object.keys(colorAttrs(node, ""));
}

/** Position and transform, changed by dragging and the resize handles. */
export function geometryKeys(node: Konva.Node): string[] {
  const keys = ["x", "y", "scaleX", "scaleY", "rotation"];
  return kindOf(node) === "text" ? [...keys, "fontSize"] : keys;
}

function widthAttrs(kind: ShapeKind, width: number): Record<string, number> {
  const attrs: Record<string, number> = {
    strokeWidth: width,
    hitStrokeWidth: Math.max(width, MIN_HIT_WIDTH),
  };
  if (kind === "arrow") {
    attrs.pointerLength = width * 3 + 6;
    attrs.pointerWidth = width * 3 + 6;
  }
  return attrs;
}
