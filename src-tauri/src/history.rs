//! Global undo/redo order across overlay windows.
//!
//! Each overlay keeps its own undo stack for its shapes. This module only
//! remembers *which* overlays changed, in order, so Ctrl+Z in any window (or
//! the toolbar) undoes the most recent change, whichever monitor it was on.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, State, WebviewWindow};

use crate::overlay;

#[derive(Default)]
pub struct History {
    undo: Vec<Vec<String>>,
    redo: Vec<Vec<String>>,
}

pub type SharedHistory = Mutex<History>;

impl History {
    fn push(&mut self, labels: Vec<String>) {
        self.undo.push(labels);
        self.redo.clear();
    }
}

#[tauri::command]
pub fn history_push(window: WebviewWindow, history: State<'_, SharedHistory>) {
    lock(&history).push(vec![window.label().to_owned()]);
}

#[tauri::command]
pub fn history_undo(app: AppHandle, history: State<'_, SharedHistory>) {
    let mut history = lock(&history);
    if let Some(labels) = history.undo.pop() {
        notify(&app, &labels, "history:undo");
        history.redo.push(labels);
    }
}

#[tauri::command]
pub fn history_redo(app: AppHandle, history: State<'_, SharedHistory>) {
    let mut history = lock(&history);
    if let Some(labels) = history.redo.pop() {
        notify(&app, &labels, "history:redo");
        history.undo.push(labels);
    }
}

/// Clears every overlay as a single undoable step.
#[tauri::command]
pub fn clear_all(app: AppHandle, history: State<'_, SharedHistory>) {
    let labels = overlay::labels(&app);
    notify(&app, &labels, "history:clear");
    lock(&history).push(labels);
}

fn notify(app: &AppHandle, labels: &[String], event: &str) {
    for label in labels {
        let _ = app.emit_to(label.as_str(), event, ());
    }
}

fn lock<'a>(history: &'a State<'_, SharedHistory>) -> std::sync::MutexGuard<'a, History> {
    history.lock().expect("history lock poisoned")
}
