use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    tray::{MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, PhysicalSize,
};

struct PinnedState(AtomicBool);

#[tauri::command]
fn set_pinned(window: tauri::WebviewWindow, state: tauri::State<PinnedState>, pinned: bool) {
    state.0.store(pinned, Ordering::Relaxed);
    window.set_always_on_top(pinned).ok();
}

fn position_window_right(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let screen_size: PhysicalSize<u32> = *monitor.size();
        let win_size = window.outer_size().unwrap_or(PhysicalSize::new(380, 700));
        let x = (screen_size.width as i32) - (win_size.width as i32);
        window.set_position(PhysicalPosition::new(x, 0i32)).ok();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(PinnedState(AtomicBool::new(false)))
        .invoke_handler(tauri::generate_handler![set_pinned])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let handle = app.handle().clone();
            let icon = app
                .default_window_icon()
                .cloned()
                .expect("No default icon configured");

            let tray: TrayIcon = TrayIconBuilder::with_id("main-tray")
                .icon(icon)
                .tooltip("A-do")
                .on_tray_icon_event(move |_tray: &TrayIcon, event: TrayIconEvent| {
                    if let TrayIconEvent::Click {
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = handle.get_webview_window("main") {
                            let visible = window.is_visible().unwrap_or(false);
                            if visible {
                                window.hide().ok();
                            } else {
                                position_window_right(&window);
                                window.show().ok();
                                window.set_focus().ok();
                            }
                        }
                    }
                })
                .build(app)?;

            app.manage(tray);
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Focused(false) = event {
                if window.label() == "main" {
                    let pinned = window.app_handle().state::<PinnedState>();
                    if !pinned.0.load(Ordering::Relaxed) {
                        window.hide().ok();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
