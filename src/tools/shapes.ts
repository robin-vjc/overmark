import type Konva from "konva";

import { createArrow, createEllipse, createRect } from "../canvas/shapes";
import { AddCommand } from "../history/commands";
import type { Point, Tool, ToolContext } from "./tool";

/** Shapes smaller than this (e.g. an accidental click) are discarded. */
const MIN_SIZE = 3;

/**
 * Tools that create a shape by dragging from one point to another.
 * Hold Shift for a square, circle, or 45°-snapped arrow.
 */
abstract class DragShapeTool<T extends Konva.Shape> implements Tool {
  private shape: T | undefined;
  private start: Point | undefined;

  constructor(private readonly ctx: ToolContext) {}

  protected abstract create(color: string, width: number, start: Point): T;
  protected abstract update(shape: T, start: Point, end: Point): void;

  down(p: Point): void {
    const { color, strokeWidth } = this.ctx.settings.current;
    this.start = p;
    this.shape = this.create(color, strokeWidth, p);
    this.ctx.annotations.add(this.shape);
  }

  move(p: Point, event: PointerEvent): void {
    if (!this.shape || !this.start) return;
    this.update(this.shape, this.start, event.shiftKey ? this.constrain(this.start, p) : p);
  }

  up(p: Point, event: PointerEvent): void {
    const { shape, start } = this;
    this.shape = undefined;
    this.start = undefined;
    if (!shape || !start) return;
    this.update(shape, start, event.shiftKey ? this.constrain(start, p) : p);
    if (Math.max(Math.abs(p.x - start.x), Math.abs(p.y - start.y)) < MIN_SIZE) {
      shape.destroy();
      return;
    }
    this.ctx.history.record(new AddCommand(this.ctx.annotations, [shape]));
  }

  /** Default constraint: equal width and height. */
  protected constrain(start: Point, p: Point): Point {
    const size = Math.max(Math.abs(p.x - start.x), Math.abs(p.y - start.y));
    return {
      x: start.x + size * Math.sign(p.x - start.x || 1),
      y: start.y + size * Math.sign(p.y - start.y || 1),
    };
  }
}

export class RectTool extends DragShapeTool<Konva.Rect> {
  protected create(color: string, width: number, p: Point): Konva.Rect {
    return createRect(color, width, p.x, p.y);
  }

  protected update(rect: Konva.Rect, start: Point, end: Point): void {
    rect.setAttrs({
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    });
  }
}

export class EllipseTool extends DragShapeTool<Konva.Ellipse> {
  protected create(color: string, width: number, p: Point): Konva.Ellipse {
    return createEllipse(color, width, p.x, p.y);
  }

  protected update(ellipse: Konva.Ellipse, start: Point, end: Point): void {
    ellipse.setAttrs({
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
      radiusX: Math.abs(end.x - start.x) / 2,
      radiusY: Math.abs(end.y - start.y) / 2,
    });
  }
}

export class ArrowTool extends DragShapeTool<Konva.Arrow> {
  protected create(color: string, width: number, p: Point): Konva.Arrow {
    return createArrow(color, width, p.x, p.y);
  }

  protected update(arrow: Konva.Arrow, start: Point, end: Point): void {
    arrow.points([start.x, start.y, end.x, end.y]);
  }

  protected constrain(start: Point, p: Point): Point {
    const step = Math.PI / 4;
    const angle = Math.round(Math.atan2(p.y - start.y, p.x - start.x) / step) * step;
    const length = Math.hypot(p.x - start.x, p.y - start.y);
    return { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
  }
}
