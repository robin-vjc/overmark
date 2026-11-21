import type { Point, Tool } from "../tools/tool";

/**
 * Routes pointer events on the canvas to the active drawing tool. The pointer
 * is captured so a stroke continues even if it leaves the window.
 */
export function bindDrawingInput(container: HTMLElement, activeTool: () => Tool | undefined): void {
  let drawingWith: Tool | undefined;
  const point = (event: PointerEvent): Point => ({ x: event.clientX, y: event.clientY });

  container.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    drawingWith = activeTool();
    if (!drawingWith) return;
    container.setPointerCapture(event.pointerId);
    drawingWith.down(point(event), event);
  });

  container.addEventListener("pointermove", (event) => {
    drawingWith?.move(point(event), event);
  });

  const finish = (event: PointerEvent) => {
    const tool = drawingWith;
    drawingWith = undefined;
    tool?.up(point(event), event);
  };
  container.addEventListener("pointerup", finish);
  container.addEventListener("pointercancel", finish);
}
