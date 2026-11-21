import Konva from "konva";

export interface Surface {
  stage: Konva.Stage;
  /** Holds the annotations only. */
  annotations: Konva.Layer;
  /** Holds selection handles and other UI drawn on the canvas. */
  ui: Konva.Layer;
}

export function createSurface(container: HTMLDivElement): Surface {
  const stage = new Konva.Stage({
    container,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const annotations = new Konva.Layer();
  const ui = new Konva.Layer();
  stage.add(annotations, ui);

  window.addEventListener("resize", () => {
    stage.size({ width: window.innerWidth, height: window.innerHeight });
  });

  return { stage, annotations, ui };
}
