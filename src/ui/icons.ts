/** 20×20 stroke icons, drawn with `currentColor`. */
const svg = (body: string) =>
  `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  grip: svg(
    '<circle cx="7" cy="5" r=".9" fill="currentColor"/><circle cx="13" cy="5" r=".9" fill="currentColor"/><circle cx="7" cy="10" r=".9" fill="currentColor"/><circle cx="13" cy="10" r=".9" fill="currentColor"/><circle cx="7" cy="15" r=".9" fill="currentColor"/><circle cx="13" cy="15" r=".9" fill="currentColor"/>',
  ),
  select: svg('<path d="M5 3l10 6.5-4.5 1L8 15z"/>'),
  pen: svg('<path d="M13.5 3.5l3 3L7 16H4v-3z"/><path d="M11.5 5.5l3 3"/>'),
  rect: svg('<rect x="3.5" y="5" width="13" height="10" rx="1"/>'),
  ellipse: svg('<ellipse cx="10" cy="10" rx="7" ry="5"/>'),
  arrow: svg('<path d="M4 16L16 4"/><path d="M8.5 4H16v7.5"/>'),
  text: svg('<path d="M4.5 5V4h11v1"/><path d="M10 4v12"/><path d="M7.5 16h5"/>'),
  undo: svg('<path d="M7.5 5L4 8.5 7.5 12"/><path d="M4 8.5h8a4 4 0 010 8H9"/>'),
  redo: svg('<path d="M12.5 5L16 8.5 12.5 12"/><path d="M16 8.5H8a4 4 0 000 8h3"/>'),
  clear: svg('<path d="M4 6h12"/><path d="M8 6V4h4v2"/><path d="M5.5 6l.8 10h7.4l.8-10"/>'),
  hide: svg('<path d="M4 10h12"/>'),
  quit: svg('<path d="M5 5l10 10M15 5L5 15"/>'),
};
