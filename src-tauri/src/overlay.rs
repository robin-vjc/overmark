//! One transparent, always-on-top overlay window per monitor.

use tauri::{AppHandle, Manager, Monitor, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

const LABEL_PREFIX: &str = "overlay-";

/// Label of the overlay on the primary monitor, which also hosts the toolbar.
pub const PRIMARY_LABEL: &str = "overlay-0";

pub fn create_all(app: &AppHandle) -> tauri::Result<()> {
    for (index, monitor) in monitors_primary_first(app)?.iter().enumerate() {
        let window =
            WebviewWindowBuilder::new(app, format!("{LABEL_PREFIX}{index}"), WebviewUrl::default())
                .title("Overmark")
                .transparent(true)
                .decorations(false)
                .shadow(false)
                .always_on_top(true)
                .visible_on_all_workspaces(true)
                .skip_taskbar(true)
                .resizable(false)
                .visible(false)
                .build()?;

        // Physical units avoid offsets on mixed-DPI setups.
        window.set_position(*monitor.position())?;
        window.set_size(*monitor.size())?;
        window.set_ignore_cursor_events(true)?;
        window.show()?;
    }
    Ok(())
}

pub fn all(app: &AppHandle) -> Vec<WebviewWindow> {
    app.webview_windows()
        .into_iter()
        .filter(|(label, _)| label.starts_with(LABEL_PREFIX))
        .map(|(_, window)| window)
        .collect()
}

pub fn labels(app: &AppHandle) -> Vec<String> {
    all(app).iter().map(|w| w.label().to_owned()).collect()
}

fn monitors_primary_first(app: &AppHandle) -> tauri::Result<Vec<Monitor>> {
    let mut monitors = app.available_monitors()?;
    if let Some(primary) = app.primary_monitor()?
        && let Some(index) = monitors
            .iter()
            .position(|m| m.position() == primary.position())
    {
        let primary = monitors.remove(index);
        monitors.insert(0, primary);
    }
    Ok(monitors)
}
