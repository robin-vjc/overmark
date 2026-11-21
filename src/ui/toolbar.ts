import type { Actions, SizeKind } from "../input/shortcuts";
import {
  FONT_SIZE,
  PALETTE,
  type Settings,
  type SettingsSync,
  STROKE_WIDTH,
  type ToolId,
} from "../settings";
import { icons } from "./icons";
import "./toolbar.css";

const isMac = navigator.userAgent.includes("Mac");
const MOD = isMac ? "Cmd" : "Ctrl";

const TOOLS: { id: ToolId; label: string; key: string }[] = [
  { id: "select", label: "Select / click through", key: "V" },
  { id: "pen", label: "Pen", key: "P" },
  { id: "rect", label: "Rectangle", key: "R" },
  { id: "ellipse", label: "Ellipse", key: "E" },
  { id: "arrow", label: "Arrow", key: "A" },
  { id: "text", label: "Text", key: "T" },
];

const MARGIN = 8;

/** Draggable toolbar shown on the primary monitor's overlay. */
export class Toolbar {
  readonly element: HTMLDivElement;
  private readonly sizePopover: SizePopover;

  constructor(
    private readonly settings: SettingsSync,
    actions: Actions,
  ) {
    this.element = document.createElement("div");
    this.element.className = "toolbar";
    this.element.setAttribute("role", "toolbar");
    this.element.innerHTML = this.template();
    document.body.append(this.element);

    this.element.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button) return;
      const { tool, color, action } = button.dataset;
      if (tool) actions.setTool(tool as ToolId);
      else if (color) actions.setColor(color);
      else if (action === "size") this.sizePopover.toggle();
      else if (action) runAction(actions, action);
    });
    this.sizePopover = new SizePopover(this.element, actions);
    this.element.addEventListener(
      "wheel",
      (event) => {
        if (event.deltaY === 0) return;
        event.preventDefault();
        actions.resize(event.deltaY < 0 ? 1 : -1);
      },
      { passive: false },
    );

    this.bindDragging();
    settings.onChange((next, previous) => {
      this.render(next);
      if (next.tool !== previous.tool) this.sizePopover.sync();
    });
    window.addEventListener("resize", () => this.place(settings.current.toolbar));
    this.render(settings.current);
    this.place(settings.current.toolbar);
  }

  /** Elements that must capture the mouse in Select mode. */
  interactiveElements(): HTMLElement[] {
    return this.sizePopover.isOpen ? [this.element, this.sizePopover.element] : [this.element];
  }

  private template(): string {
    const tools = TOOLS.map(
      ({ id, label, key }) =>
        `<button data-tool="${id}" title="${label} (${key})" aria-label="${label}">${icons[id]}</button>`,
    ).join("");
    const colors = PALETTE.map(
      ({ name, value, key }) =>
        `<button class="swatch" data-color="${value}" style="--swatch:${value}" title="${name}${key ? ` (${key})` : ""}" aria-label="${name}"></button>`,
    ).join("");
    const action = (name: keyof typeof icons, label: string) =>
      `<button data-action="${name}" title="${label}" aria-label="${label.replace(/ \(.*/, "")}">${icons[name]}</button>`;

    return `
      <div class="grip" title="Drag to move">${icons.grip}</div>
      <div class="group">${tools}</div>
      <div class="separator"></div>
      <div class="group colors">${colors}</div>
      <button class="size" data-action="size" title="Size (click to adjust, or ${MOD}+Scroll)" aria-label="Size" aria-haspopup="true" aria-expanded="false"><span class="size-dot"></span><span class="size-value"></span></button>
      <div class="size-popover" hidden>
        <span class="size-popover-value"></span>
        <input class="size-slider" type="range" step="1" aria-label="Size" />
      </div>
      <div class="separator"></div>
      <div class="group">
        ${action("undo", `Undo (${MOD}+Z)`)}
        ${action("redo", `Redo (${MOD}+Y)`)}
        ${action("clear", `Clear all (${MOD}+Shift+X)`)}
      </div>
      <div class="separator"></div>
      <div class="group">
        ${action("hide", `Hide (${MOD}+Shift+D to show again)`)}
        ${action("quit", "Quit Overmark")}
      </div>`;
  }

  private render(settings: Settings): void {
    for (const button of this.element.querySelectorAll<HTMLButtonElement>("[data-tool]")) {
      button.classList.toggle("active", button.dataset.tool === settings.tool);
    }
    for (const button of this.element.querySelectorAll<HTMLButtonElement>("[data-color]")) {
      button.classList.toggle("active", button.dataset.color === settings.color);
    }
    const isText = settings.tool === "text";
    const size = isText ? settings.fontSize : settings.strokeWidth;
    const dot = this.element.querySelector<HTMLElement>(".size-dot")!;
    dot.style.background = settings.color;
    dot.style.width = dot.style.height = `${Math.min(18, Math.max(3, isText ? size / 4 : size))}px`;
    this.element.querySelector(".size-value")!.textContent = isText ? `${size}pt` : `${size}px`;
  }

  /** Positions the toolbar, keeping it fully on screen. `null` centers it at the top. */
  private place(position: Settings["toolbar"]): void {
    const { width, height } = this.element.getBoundingClientRect();
    const x = position?.x ?? (window.innerWidth - width) / 2;
    const y = position?.y ?? 16;
    this.element.style.left = `${clampTo(x, window.innerWidth - width - MARGIN)}px`;
    this.element.style.top = `${clampTo(y, window.innerHeight - height - MARGIN)}px`;
  }

  private bindDragging(): void {
    const grip = this.element.querySelector<HTMLElement>(".grip")!;
    let offset: { x: number; y: number } | undefined;

    grip.addEventListener("pointerdown", (event) => {
      const rect = this.element.getBoundingClientRect();
      offset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      grip.setPointerCapture(event.pointerId);
    });
    grip.addEventListener("pointermove", (event) => {
      if (offset) this.place({ x: event.clientX - offset.x, y: event.clientY - offset.y });
    });
    grip.addEventListener("pointerup", () => {
      if (!offset) return;
      offset = undefined;
      const rect = this.element.getBoundingClientRect();
      this.settings.update({ toolbar: { x: rect.left, y: rect.top } });
    });
  }
}

function runAction(actions: Actions, action: string): void {
  switch (action) {
    case "undo":
      return actions.undo();
    case "redo":
      return actions.redo();
    case "clear":
      return actions.clearAll();
    case "hide":
      return actions.hide();
    case "quit":
      return actions.quit();
  }
}

function clampTo(value: number, max: number): number {
  return Math.max(MARGIN, Math.min(max, value));
}

const SLIDER_RANGE: Record<SizeKind, { min: number; max: number }> = {
  stroke: STROKE_WIDTH,
  font: FONT_SIZE,
};
/** Height of the popover, used to decide whether it fits below the toolbar. */
const POPOVER_SPACE = 200;

/** Vertical slider under the size button, like a volume control. */
class SizePopover {
  readonly element: HTMLDivElement;
  private readonly button: HTMLButtonElement;
  private readonly slider: HTMLInputElement;
  private readonly label: HTMLElement;
  private kind: SizeKind = "stroke";

  constructor(
    private readonly toolbar: HTMLElement,
    private readonly actions: Actions,
  ) {
    this.element = toolbar.querySelector(".size-popover")!;
    this.button = toolbar.querySelector(".size")!;
    this.slider = this.element.querySelector(".size-slider")!;
    this.label = this.element.querySelector(".size-popover-value")!;

    this.slider.addEventListener("input", () => this.commit(Number(this.slider.value)));
    this.element.addEventListener(
      "wheel",
      (event) => {
        if (event.deltaY === 0) return;
        event.preventDefault();
        event.stopPropagation();
        const range = SLIDER_RANGE[this.kind];
        const value = Number(this.slider.value) + (event.deltaY < 0 ? 1 : -1);
        if (value < range.min || value > range.max) return;
        this.slider.value = String(value);
        this.commit(value);
      },
      { passive: false },
    );
    // Close on clicks elsewhere, on Escape, and when the user clicks through to another app.
    window.addEventListener(
      "pointerdown",
      (event) => {
        const target = event.target as Node;
        if (this.isOpen && !this.element.contains(target) && !this.button.contains(target)) {
          this.close();
        }
      },
      true,
    );
    window.addEventListener(
      "keydown",
      (event) => {
        if (this.isOpen && event.key === "Escape") {
          event.stopImmediatePropagation();
          this.close();
        }
      },
      true,
    );
    window.addEventListener("blur", () => this.close());
  }

  get isOpen(): boolean {
    return !this.element.hidden;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
      return;
    }
    this.element.hidden = false;
    this.button.setAttribute("aria-expanded", "true");
    const below = this.toolbar.getBoundingClientRect().bottom + POPOVER_SPACE < window.innerHeight;
    this.element.classList.toggle("above", !below);
    this.element.style.left = `${this.button.offsetLeft + this.button.offsetWidth / 2}px`;
    this.sync();
    this.slider.focus();
  }

  /** Refreshes the slider from the current selection or tool. */
  sync(): void {
    if (!this.isOpen) return;
    const { kind, value } = this.actions.sizeTarget();
    this.kind = kind;
    const range = SLIDER_RANGE[kind];
    this.slider.min = String(range.min);
    this.slider.max = String(range.max);
    this.slider.value = String(value);
    this.showValue(value);
  }

  private close(): void {
    if (!this.isOpen) return;
    this.element.hidden = true;
    this.button.setAttribute("aria-expanded", "false");
  }

  private commit(value: number): void {
    this.showValue(value);
    this.actions.setSize(this.kind, value);
  }

  private showValue(value: number): void {
    this.label.textContent = this.kind === "font" ? `${value}pt` : `${value}px`;
  }
}
