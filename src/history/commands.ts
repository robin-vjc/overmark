import type Konva from "konva";

import type { Command } from "./history";

type Attrs = Record<string, unknown>;

/** Adds shapes that were just drawn. */
export class AddCommand implements Command {
  constructor(
    private readonly layer: Konva.Layer,
    private readonly nodes: Konva.Shape[],
  ) {}

  undo(): void {
    for (const node of this.nodes) node.remove();
  }

  redo(): void {
    for (const node of this.nodes) this.layer.add(node);
  }
}

/** Removes shapes and restores them at their original stacking order on undo. */
export class RemoveCommand implements Command {
  private readonly entries: { node: Konva.Shape; index: number }[];

  constructor(
    private readonly layer: Konva.Layer,
    nodes: Konva.Shape[],
  ) {
    this.entries = nodes
      .map((node) => ({ node, index: node.zIndex() }))
      .sort((a, b) => a.index - b.index);
  }

  undo(): void {
    for (const { node, index } of this.entries) {
      this.layer.add(node);
      node.zIndex(index);
    }
  }

  redo(): void {
    for (const { node } of this.entries) node.remove();
  }
}

/** Changes attributes (position, size, color, text...) of existing shapes. */
export class AttrsCommand implements Command {
  private constructor(
    private readonly changes: { node: Konva.Node; before: Attrs; after: Attrs }[],
  ) {}

  /** Snapshots `keys` of each node now; `finish()` snapshots them again and builds the command. */
  static begin(
    nodes: Konva.Node[],
    keys: (node: Konva.Node) => string[],
  ): { finish(): AttrsCommand } {
    const before = nodes.map((node) => read(node, keys(node)));
    return {
      finish: () =>
        new AttrsCommand(
          nodes.map((node, i) => ({ node, before: before[i], after: read(node, keys(node)) })),
        ),
    };
  }

  /** Snapshots `keys` of each node, runs `change`, and snapshots them again. */
  static capture(
    nodes: Konva.Node[],
    keys: (node: Konva.Node) => string[],
    change: () => void,
  ): AttrsCommand {
    const pending = AttrsCommand.begin(nodes, keys);
    change();
    return pending.finish();
  }

  get changed(): boolean {
    return this.changes.some(({ before, after }) =>
      Object.keys(after).some((key) => !sameValue(before[key], after[key])),
    );
  }

  undo(): void {
    for (const { node, before } of this.changes) node.setAttrs(before);
  }

  redo(): void {
    for (const { node, after } of this.changes) node.setAttrs(after);
  }

  merge(next: Command): boolean {
    if (!(next instanceof AttrsCommand) || next.changes.length !== this.changes.length) {
      return false;
    }
    if (!next.changes.every((change, i) => change.node === this.changes[i].node)) return false;
    next.changes.forEach((change, i) => {
      this.changes[i].after = { ...this.changes[i].after, ...change.after };
    });
    return true;
  }
}

function read(node: Konva.Node, keys: string[]): Attrs {
  const getters = node as unknown as Record<string, () => unknown>;
  return Object.fromEntries(keys.map((key) => [key, structuredClone(getters[key]())]));
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
