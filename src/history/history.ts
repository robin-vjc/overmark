export interface Command {
  undo(): void;
  redo(): void;
  /** Absorbs a follow-up command of the same kind, e.g. repeated Ctrl+Scroll steps. */
  merge?(next: Command): boolean;
}

const MERGE_WINDOW_MS = 800;

/**
 * Undo/redo stack for this overlay's annotations.
 *
 * Commands are recorded *after* they've been applied. The order of changes
 * across monitors is kept by the backend, which tells each overlay when to
 * undo or redo (see `src-tauri/src/history.rs`).
 */
export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private lastMerge: { key: string; time: number } | undefined;

  constructor(
    /** Called once per new undo step, so the backend can track the global order. */
    private readonly onRecord: () => void,
    private readonly onChange: () => void,
  ) {}

  record(command: Command, mergeKey?: string): void {
    const now = performance.now();
    const top = this.undoStack.at(-1);
    const canMerge =
      mergeKey !== undefined &&
      this.lastMerge?.key === mergeKey &&
      now - this.lastMerge.time < MERGE_WINDOW_MS;

    if (canMerge && top?.merge?.(command)) {
      this.lastMerge = { key: mergeKey, time: now };
    } else {
      this.recordLocal(command);
      this.lastMerge = mergeKey === undefined ? undefined : { key: mergeKey, time: now };
      this.onRecord();
    }
    this.onChange();
  }

  /** Records a step the backend already knows about (e.g. "clear all"). */
  recordLocal(command: Command): void {
    this.undoStack.push(command);
    this.redoStack = [];
    this.lastMerge = undefined;
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
    this.lastMerge = undefined;
    this.onChange();
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.redo();
    this.undoStack.push(command);
    this.lastMerge = undefined;
    this.onChange();
  }
}
