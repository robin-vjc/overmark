import { emit, listen } from "@tauri-apps/api/event";
import type Konva from "konva";

import { Selection } from "./canvas/selection";
import { colorAttrs, colorKeys, sizeAttrs, sizeKeys, sizeOf } from "./canvas/shapes";
import { createSurface } from "./canvas/stage";
import { AttrsCommand, RemoveCommand } from "./history/commands";
import { History } from "./history/history";
import { bindHitTest } from "./input/hit-test";
import { bindDrawingInput } from "./input/pointer";
import { type Actions, bindResizeWheel, bindShortcuts } from "./input/shortcuts";
import { backend, isPrimaryWindow, onWindowEvent } from "./ipc";
import { clamp, FONT_SIZE, SettingsSync, STROKE_WIDTH, type ToolId } from "./settings";
import { PenTool } from "./tools/pen";
import { bindSelectTool } from "./tools/select";
import { ArrowTool, EllipseTool, RectTool } from "./tools/shapes";
import { TextEditor, TextTool } from "./tools/text";
import type { Tool } from "./tools/tool";
import { Toolbar } from "./ui/toolbar";
import "./styles.css";

/** Multiplier per Ctrl+Scroll step. */
const RESIZE_STEP = 1.15;
const APPLY_COLOR_EVENT = "selection:apply-color";

async function main(): Promise<void> {
  const settings = await SettingsSync.init(isPrimaryWindow);
  const container = document.querySelector<HTMLDivElement>("#stage")!;
  const { stage, annotations, ui } = createSurface(container);

  const history = new History(
    () => void backend.historyPush(),
    () => {
      selection.prune();
      void backend.refreshHit();
    },
  );
  const selection = new Selection(ui, annotations, history);
  selection.onChange(() => void backend.refreshHit());
  const editor = new TextEditor(annotations, history, () => void backend.refreshHit());

  const ctx = { annotations, history, settings };
  const tools: Record<Exclude<ToolId, "select">, Tool> = {
    pen: new PenTool(ctx),
    rect: new RectTool(ctx),
    ellipse: new EllipseTool(ctx),
    arrow: new ArrowTool(ctx),
    text: new TextTool(ctx, editor),
  };
  const currentTool = () => settings.current.tool;

  const applyToSelection = (
    keys: (node: Konva.Node) => string[],
    attrs: (node: Konva.Shape) => Record<string, unknown>,
    mergeKey?: string,
  ) => {
    const nodes = selection.nodes;
    if (nodes.length === 0) return;
    const command = AttrsCommand.capture(nodes, keys, () => {
      for (const node of nodes) node.setAttrs(attrs(node));
    });
    if (command.changed) history.record(command, mergeKey);
  };

  const actions: Actions = {
    setTool: (tool) => {
      editor.commit();
      settings.update({ tool });
    },
    setColor: (color) => {
      settings.update({ color });
      // Recolor selected shapes on every monitor, not just the focused one.
      void emit(APPLY_COLOR_EVENT, color);
    },
    resize: (direction) => {
      // Proportional steps, but always at least 1 so small sizes still change.
      const step = (value: number) =>
        direction > 0
          ? Math.max(value + 1, Math.round(value * RESIZE_STEP))
          : Math.min(value - 1, Math.round(value / RESIZE_STEP));

      if (editor.isEditing) {
        const fontSize = clamp(step(settings.current.fontSize), FONT_SIZE);
        settings.update({ fontSize });
        editor.setFontSize(fontSize);
      } else if (!selection.isEmpty) {
        applyToSelection(sizeKeys, (node) => sizeAttrs(node, step(sizeOf(node))), "resize");
      } else if (currentTool() === "text") {
        settings.update({ fontSize: clamp(step(settings.current.fontSize), FONT_SIZE) });
      } else {
        settings.update({ strokeWidth: clamp(step(settings.current.strokeWidth), STROKE_WIDTH) });
      }
    },
    deleteSelection: () => selection.deleteSelected(),
    undo: () => {
      editor.commit();
      void backend.undo();
    },
    redo: () => {
      editor.commit();
      void backend.redo();
    },
    clearAll: () => {
      editor.commit();
      void backend.clearAll();
    },
    escape: () => {
      if (!selection.isEmpty) selection.clear();
      else if (currentTool() !== "select") actions.setTool("select");
    },
    hide: () => void backend.hideOverlays(),
    quit: () => void backend.quit(),
  };

  onWindowEvent("history:undo", () => history.undo());
  onWindowEvent("history:redo", () => history.redo());
  onWindowEvent("history:clear", () => {
    selection.clear();
    // Always record a step, even if empty, so undo stays in step with the backend.
    const command = new RemoveCommand(annotations, annotations.find<Konva.Shape>(".annotation"));
    command.redo();
    history.recordLocal(command);
    void backend.refreshHit();
  });
  await listen<string>(APPLY_COLOR_EVENT, ({ payload: color }) =>
    applyToSelection(colorKeys, (node) => colorAttrs(node, color)),
  );

  const applyTool = (tool: ToolId) => {
    const selecting = tool === "select";
    document.body.dataset.tool = tool;
    // Shapes only react to the mouse in Select mode; drawing tools draw over them.
    annotations.listening(selecting);
    if (!selecting) selection.clear();
    if (isPrimaryWindow) void backend.setDrawMode(!selecting);
  };
  settings.onChange((next, previous) => {
    if (next.tool !== previous.tool) applyTool(next.tool);
  });
  applyTool(currentTool());

  const toolbar = isPrimaryWindow ? new Toolbar(settings, actions) : undefined;

  bindSelectTool(stage, selection, editor, () => currentTool() === "select");
  bindDrawingInput(container, () => {
    const tool = currentTool();
    return tool === "select" ? undefined : tools[tool];
  });
  bindShortcuts(actions, () => editor.isEditing);
  bindResizeWheel(container, actions);
  bindHitTest({
    stage,
    interactive: () => (toolbar ? [toolbar.element] : []),
    busy: () => editor.isEditing,
  });
}

void main();
