import Konva from "konva";

import type { Selection } from "../canvas/selection";
import { isAnnotation } from "../canvas/shapes";
import type { TextEditor } from "./text";

/**
 * Select tool: click a shape to select it (Shift+click to add or remove),
 * drag to move, double-click text to edit it. Clicks on empty space never
 * reach the overlay in this mode; they pass through to the app below.
 */
export function bindSelectTool(
  stage: Konva.Stage,
  selection: Selection,
  editor: TextEditor,
  isActive: () => boolean,
): void {
  stage.on("pointerdown", (event) => {
    if (!isActive()) return;
    const target = event.target;
    if (target === stage) {
      selection.clear();
      return;
    }
    if (!isAnnotation(target)) return; // e.g. a resize handle
    if (event.evt.shiftKey) {
      selection.toggle(target);
    } else if (!selection.nodes.includes(target)) {
      selection.set([target]);
    }
  });

  stage.on("dblclick dbltap", (event) => {
    if (!isActive() || !(event.target instanceof Konva.Text) || !isAnnotation(event.target)) {
      return;
    }
    selection.clear();
    editor.start(event.target, false);
  });
}
