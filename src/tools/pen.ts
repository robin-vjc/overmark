import type Konva from "konva";

import { createPen } from "../canvas/shapes";
import { AddCommand } from "../history/commands";
import type { Point, Tool, ToolContext } from "./tool";

/** Points closer than this to the previous one are skipped while drawing. */
const MIN_POINT_DISTANCE = 1.5;
/** Max deviation in px allowed when simplifying a finished stroke. */
const SIMPLIFY_TOLERANCE = 0.75;

export class PenTool implements Tool {
  private line: Konva.Line | undefined;
  private last: Point | undefined;

  constructor(private readonly ctx: ToolContext) {}

  down(p: Point): void {
    const { color, strokeWidth } = this.ctx.settings.current;
    this.line = createPen(color, strokeWidth, p.x, p.y);
    this.last = p;
    this.ctx.annotations.add(this.line);
  }

  move(p: Point): void {
    if (!this.line || !this.last) return;
    if (Math.hypot(p.x - this.last.x, p.y - this.last.y) < MIN_POINT_DISTANCE) return;
    this.line.points(this.line.points().concat(p.x, p.y));
    this.last = p;
  }

  up(): void {
    const line = this.line;
    this.line = undefined;
    this.last = undefined;
    if (!line) return;
    line.points(simplify(line.points(), SIMPLIFY_TOLERANCE));
    this.ctx.history.record(new AddCommand(this.ctx.annotations, [line]));
  }
}

/** Ramer–Douglas–Peucker on a flat `[x0, y0, x1, y1, ...]` array. */
export function simplify(points: number[], tolerance: number): number[] {
  const count = points.length / 2;
  if (count <= 2) return points;
  const keep = new Uint8Array(count);
  keep[0] = keep[count - 1] = 1;
  const stack: [number, number][] = [[0, count - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let maxDistance = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = distanceToSegment(points, i, first, last);
      if (d > maxDistance) {
        maxDistance = d;
        index = i;
      }
    }
    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    if (keep[i]) result.push(points[i * 2], points[i * 2 + 1]);
  }
  return result;
}

function distanceToSegment(p: number[], i: number, a: number, b: number): number {
  const [x, y] = [p[i * 2], p[i * 2 + 1]];
  const [x1, y1, x2, y2] = [p[a * 2], p[a * 2 + 1], p[b * 2], p[b * 2 + 1]];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}
