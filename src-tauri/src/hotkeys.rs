//! System-wide shortcuts that work while other apps have focus.

use tauri::plugin::TauriPlugin;
use tauri::{AppHandle, Wry};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

use crate::passthrough;

fn toggle_overlay() -> Shortcut {
    #[cfg(target_os = "macos")]
    let primary = Modifiers::SUPER;
    #[cfg(not(target_os = "macos"))]
    let primary = Modifiers::CONTROL;
    Shortcut::new(Some(primary | Modifiers::SHIFT), Code::KeyD)
}

pub fn plugin() -> TauriPlugin<Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, shortcut, event| {
            if event.state() == ShortcutState::Pressed && *shortcut == toggle_overlay() {
                passthrough::toggle_visibility(app);
            }
        })
        .build()
}

pub fn register(app: &AppHandle) {
    // Another app may own the shortcut; the toolbar still works without it.
    if let Err(err) = app.global_shortcut().register(toggle_overlay()) {
        eprintln!("overmark: could not register global shortcut: {err}");
    }
}
