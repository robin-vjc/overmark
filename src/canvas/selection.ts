import Konva from "konva";

import { AttrsCommand, RemoveCommand } from "../history/commands";
import type { History } from "../history/history";
import { geometryKeys, isAnnotation, kindOf } from "./shapes";

const HANDLE_COLOR = "#3b82f6";
const ALL_ANCHORS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-right",
  "middle-left",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];
const CORNER_ANCHORS = ["top-left", "top-right", "bottom-left", "bottom-right"];

/**
 * PowerPoint-style selection: resize/rotate handles, drag to move, delete.
 * Moves and resizes are recorded in the undo history.
 */
export class Selection {
  private readonly transformer: Konva.Transformer;
  private readonly listeners: (() => void)[] = [];
  /** Geometry snapshot taken when a drag or resize starts. */
  private pending: { finish(): AttrsCommand } | undefined;

  constructor(
    ui: Konva.Layer,
    private readonly annotations: Konva.Layer,
    private readonly history: History,
  ) {
    this.transformer = new Konva.Transformer({
      rotateEnabled: true,
      flipEnabled: false,
      ignoreStroke: true,
      padding: 4,
      anchorSize: 9,
      anchorCornerRadius: 2,
      anchorStroke: HANDLE_COLOR,
      borderStroke: HANDLE_COLOR,
    });
    ui.add(this.transformer);

    this.transformer.on("transformstart", () => this.begin());
    this.transformer.on("transformend", () => {
      this.bakeTextScale();
      this.end();
    });
    annotations.on("dragstart", () => this.begin());
    annotations.on("dragend", () => this.end());
  }

  get nodes(): Konva.Shape[] {
    return this.transformer.nodes().filter(isAnnotation);
  }

  get isEmpty(): boolean {
    return this.transformer.nodes().length === 0;
  }

  onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  set(nodes: Konva.Shape[]): void {
    const onlyText = nodes.length > 0 && nodes.every((n) => kindOf(n) === "text");
    // Text scales from the corners only, keeping its proportions; the scale becomes the font size.
    this.transformer.enabledAnchors(onlyText ? CORNER_ANCHORS : ALL_ANCHORS);
    this.transformer.keepRatio(onlyText);
    this.transformer.nodes(nodes);
    for (const listener of this.listeners) listener();
  }

  toggle(node: Konva.Shape): void {
    const nodes = this.nodes;
    this.set(nodes.includes(node) ? nodes.filter((n) => n !== node) : [...nodes, node]);
  }

  clear(): void {
    if (!this.isEmpty) this.set([]);
  }

  /** Drops nodes that are no longer on the canvas, e.g. after an undo. */
  prune(): void {
    const nodes = this.nodes;
    const attached = nodes.filter((n) => n.getLayer() === this.annotations);
    if (attached.length !== nodes.length) this.set(attached);
  }

  deleteSelected(): void {
    const nodes = this.nodes;
    if (nodes.length === 0) return;
    this.clear();
    const command = new RemoveCommand(this.annotations, nodes);
    command.redo();
    this.history.record(command);
  }

  private begin(): void {
    this.pending = AttrsCommand.begin(this.nodes, geometryKeys);
  }

  private end(): void {
    const command = this.pending?.finish();
    this.pending = undefined;
    if (command?.changed) this.history.record(command);
  }

  private bakeTextScale(): void {
    for (const node of this.nodes) {
      if (!(node instanceof Konva.Text)) continue;
      const scale = node.scaleY();
      node.setAttrs({ fontSize: Math.round(node.fontSize() * scale), scaleX: 1, scaleY: 1 });
    }
    this.transformer.forceUpdate();
  }
}
