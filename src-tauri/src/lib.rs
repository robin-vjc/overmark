use tauri::Manager;

mod history;
mod hotkeys;
mod overlay;
mod passthrough;

#[tauri::command]
fn quit(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // A second launch would stack another set of overlays; ignore it instead.
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(hotkeys::plugin())
        .manage(passthrough::Passthrough::default())
        .manage(history::SharedHistory::default())
        .invoke_handler(tauri::generate_handler![
            quit,
            passthrough::set_draw_mode,
            passthrough::set_hit,
            passthrough::refresh_hit,
            passthrough::hide_overlays,
            history::history_push,
            history::history_undo,
            history::history_redo,
            history::clear_all,
        ])
        .setup(|app| {
            overlay::create_all(app.handle())?;
            hotkeys::register(app.handle());
            passthrough::start_polling(app.handle().clone());
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing any overlay (e.g. Alt+F4) quits instead of leaving a monitor uncovered.
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                window.app_handle().exit(0);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Overmark");
}
