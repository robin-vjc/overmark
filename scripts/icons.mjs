// Regenerates the desktop app icons from a source image.
// Usage: `pnpm icons [path]`, where `path` is a square SVG or a PNG of at least 1024×1024 px (default: app-icon.svg).
// `tauri icon` also emits mobile and Windows Store assets, which Overmark doesn't ship,
// so we generate into a temp folder and copy only what `tauri.conf.json` references.
import { execSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DESKTOP_ICONS = [
  "32x32.png",
  "128x128.png",
  "128x128@2x.png",
  "icon.png",
  "icon.ico",
  "icon.icns",
];

const source = process.argv[2] ?? "app-icon.svg";
const out = mkdtempSync(join(tmpdir(), "overmark-icons-"));
try {
  execSync(`pnpm tauri icon "${source}" --output "${out}"`, { stdio: "inherit" });
  for (const file of DESKTOP_ICONS) {
    copyFileSync(join(out, file), join("src-tauri", "icons", file));
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}
