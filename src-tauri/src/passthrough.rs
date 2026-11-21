//! Decides when the overlays let mouse clicks through to the apps below.
//!
//! Drawing tools: overlays always capture the mouse.
//! Select tool: overlays ignore the mouse, except while the cursor is over an
//! annotation or the toolbar. Tauri can't tell us where the cursor is while a
//! window ignores the mouse, so we poll the cursor position, ask the webview
//! under it whether that point hits something (`probe` event), and it answers
//! through the `set_hit` command.

use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};

use crate::overlay;

const FAST_POLL: Duration = Duration::from_millis(16);
/// Used while the cursor is still, to keep idle CPU near zero.
const SLOW_POLL: Duration = Duration::from_millis(100);
/// Consecutive still polls before slowing down.
const IDLE_POLLS: u32 = 30;

pub struct Passthrough {
    draw_mode: AtomicBool,
    visible: AtomicBool,
    /// Forces a new probe even if the cursor hasn't moved.
    stale: AtomicBool,
    ignoring: Mutex<HashMap<String, bool>>,
}

impl Default for Passthrough {
    fn default() -> Self {
        Self {
            draw_mode: AtomicBool::new(false),
            visible: AtomicBool::new(true),
            stale: AtomicBool::new(true),
            ignoring: Mutex::new(HashMap::new()),
        }
    }
}

impl Passthrough {
    fn set_ignore(&self, window: &WebviewWindow, ignore: bool) {
        let mut ignoring = self.ignoring.lock().expect("passthrough lock poisoned");
        if ignoring.get(window.label()) == Some(&ignore) {
            return;
        }
        if window.set_ignore_cursor_events(ignore).is_ok() {
            ignoring.insert(window.label().to_owned(), ignore);
        }
    }
}

#[derive(Clone, Serialize)]
struct Probe {
    x: f64,
    y: f64,
}

pub fn start_polling(app: AppHandle) {
    thread::spawn(move || {
        let state = app.state::<Passthrough>();
        let mut last_cursor = None;
        let mut still_polls = 0u32;
        loop {
            thread::sleep(if still_polls >= IDLE_POLLS {
                SLOW_POLL
            } else {
                FAST_POLL
            });
            if state.draw_mode.load(Ordering::Relaxed) || !state.visible.load(Ordering::Relaxed) {
                still_polls = IDLE_POLLS;
                continue;
            }
            let Ok(cursor) = app.cursor_position() else {
                continue;
            };
            let key = (cursor.x.round() as i32, cursor.y.round() as i32);
            let stale = state.stale.swap(false, Ordering::Relaxed);
            if !stale && last_cursor == Some(key) {
                still_polls = still_polls.saturating_add(1);
                continue;
            }
            still_polls = 0;
            last_cursor = Some(key);

            for window in overlay::all(&app) {
                let (Ok(pos), Ok(size), Ok(scale)) = (
                    window.outer_position(),
                    window.outer_size(),
                    window.scale_factor(),
                ) else {
                    continue;
                };
                let x = cursor.x - f64::from(pos.x);
                let y = cursor.y - f64::from(pos.y);
                let inside =
                    x >= 0.0 && y >= 0.0 && x < f64::from(size.width) && y < f64::from(size.height);
                if inside {
                    let probe = Probe {
                        x: x / scale,
                        y: y / scale,
                    };
                    let _ = app.emit_to(window.label(), "probe", probe);
                } else {
                    state.set_ignore(&window, true);
                }
            }
        }
    });
}

pub fn toggle_visibility(app: &AppHandle) {
    let state = app.state::<Passthrough>();
    let visible = !state.visible.load(Ordering::Relaxed);
    state.visible.store(visible, Ordering::Relaxed);
    state.stale.store(true, Ordering::Relaxed);
    for window in overlay::all(app) {
        let _ = if visible {
            window.show()
        } else {
            window.hide()
        };
    }
    if visible
        && state.draw_mode.load(Ordering::Relaxed)
        && let Some(primary) = app.get_webview_window(overlay::PRIMARY_LABEL)
    {
        let _ = primary.set_focus();
    }
}

#[tauri::command]
pub fn set_draw_mode(app: AppHandle, state: State<'_, Passthrough>, draw: bool) {
    state.draw_mode.store(draw, Ordering::Relaxed);
    state.stale.store(true, Ordering::Relaxed);
    for window in overlay::all(&app) {
        state.set_ignore(&window, !draw);
    }
}

#[tauri::command]
pub fn set_hit(window: WebviewWindow, state: State<'_, Passthrough>, hit: bool) {
    if !state.draw_mode.load(Ordering::Relaxed) {
        state.set_ignore(&window, !hit);
    }
}

/// Re-checks the cursor even if it hasn't moved, e.g. after a shape under it was deleted.
#[tauri::command]
pub fn refresh_hit(state: State<'_, Passthrough>) {
    state.stale.store(true, Ordering::Relaxed);
}

#[tauri::command]
pub fn hide_overlays(app: AppHandle, state: State<'_, Passthrough>) {
    if state.visible.load(Ordering::Relaxed) {
        toggle_visibility(&app);
    }
}

pub fn show(app: &AppHandle) {
    if !app.state::<Passthrough>().visible.load(Ordering::Relaxed) {
        toggle_visibility(app);
    }
}
