import type Konva from "konva";

import { createText } from "../canvas/shapes";
import { AddCommand, AttrsCommand, RemoveCommand } from "../history/commands";
import type { History } from "../history/history";
import type { Point, Tool, ToolContext } from "./tool";

/**
 * Edits text in a `<textarea>` placed over the canvas, then writes the result
 * back to the Konva text node as one undoable step.
 */
export class TextEditor {
  private session: { node: Konva.Text; isNew: boolean; textarea: HTMLTextAreaElement } | undefined;

  constructor(
    private readonly annotations: Konva.Layer,
    private readonly history: History,
    private readonly onEditingChange: (editing: boolean) => void,
  ) {}

  get isEditing(): boolean {
    return this.session !== undefined;
  }

  /** Starts editing `node`. New nodes are added to the canvas only once they contain text. */
  start(node: Konva.Text, isNew: boolean): void {
    this.commit();
    const textarea = document.createElement("textarea");
    textarea.className = "text-editor";
    textarea.value = node.text();
    textarea.spellcheck = false;
    textarea.wrap = "off";
    this.session = { node, isNew, textarea };
    this.style();

    textarea.addEventListener("input", () => this.style());
    textarea.addEventListener("blur", () => this.commit());
    textarea.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape" || (event.key === "Enter" && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        this.commit();
      }
    });

    node.hide();
    document.body.append(textarea);
    textarea.focus();
    this.onEditingChange(true);
  }

  setFontSize(size: number): void {
    if (!this.session) return;
    this.session.node.fontSize(size);
    this.style();
  }

  commit(): void {
    const session = this.session;
    if (!session) return;
    this.session = undefined;
    const { node, isNew, textarea } = session;
    const text = textarea.value.replace(/\s+$/, "");
    textarea.remove();
    node.show();

    if (isNew) {
      if (text) {
        node.text(text);
        this.annotations.add(node);
        this.history.record(new AddCommand(this.annotations, [node]));
      } else {
        node.destroy();
      }
    } else if (!text) {
      const command = new RemoveCommand(this.annotations, [node]);
      command.redo();
      this.history.record(command);
    } else if (text !== node.text()) {
      this.history.record(
        AttrsCommand.capture(
          [node],
          () => ["text"],
          () => node.text(text),
        ),
      );
    }
    this.onEditingChange(false);
  }

  private style(): void {
    if (!this.session) return;
    const { node, textarea } = this.session;
    const position = node.absolutePosition();
    const scale = node.getAbsoluteScale();
    const fontSize = node.fontSize() * scale.y;
    Object.assign(textarea.style, {
      left: `${position.x}px`,
      top: `${position.y}px`,
      fontSize: `${fontSize}px`,
      fontFamily: node.fontFamily(),
      lineHeight: String(node.lineHeight()),
      color: String(node.fill()),
      caretColor: String(node.fill()),
      transform: `rotate(${node.getAbsoluteRotation()}deg)`,
    });
    // Grow to fit the content; `wrap="off"` keeps lines from wrapping.
    textarea.style.width = "0";
    textarea.style.height = "0";
    textarea.style.width = `${textarea.scrollWidth + fontSize * 0.5}px`;
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}

export class TextTool implements Tool {
  constructor(
    private readonly ctx: ToolContext,
    private readonly editor: TextEditor,
  ) {}

  down(p: Point): void {
    // A click outside the text box being edited finishes it instead of starting a new one.
    if (this.editor.isEditing) {
      this.editor.commit();
      return;
    }
    const { color, fontSize } = this.ctx.settings.current;
    // Center the first line on the cursor.
    const node = createText(color, fontSize, p.x, p.y - (fontSize * 1.2) / 2);
    this.editor.start(node, true);
  }

  move(): void {}

  up(): void {}
}
