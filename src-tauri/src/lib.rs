mod direct_typing;
mod stenography_audio;

use direct_typing::{DirectTypingManager, DirectTypingProfile, DirectTypingStatus};
use stenography_audio::{NativeSpeechStatus, StenographyAudioManager};
use tauri::State;

#[tauri::command]
async fn start_direct_typing(
    profile: DirectTypingProfile,
    manager: State<'_, DirectTypingManager>,
    window: tauri::WebviewWindow,
) -> Result<DirectTypingStatus, String> {
    let status = manager.start(profile)?;
    if let Err(error) = window.minimize() {
        manager.stop();
        return Err(format!(
            "Direct Typing was stopped because BhashaYantra could not minimize: {error}"
        ));
    }
    Ok(status)
}

#[tauri::command]
async fn update_direct_typing(
    profile: DirectTypingProfile,
    manager: State<'_, DirectTypingManager>,
) -> Result<DirectTypingStatus, String> {
    manager.update(profile)
}

#[tauri::command]
async fn stop_direct_typing(
    manager: State<'_, DirectTypingManager>,
) -> Result<DirectTypingStatus, String> {
    Ok(manager.stop())
}

#[tauri::command]
async fn direct_typing_status(
    manager: State<'_, DirectTypingManager>,
) -> Result<DirectTypingStatus, String> {
    Ok(manager.status())
}

#[tauri::command]
async fn start_stenography_voice(
    text: String,
    language: String,
    words_per_minute: u32,
    manager: State<'_, StenographyAudioManager>,
) -> Result<NativeSpeechStatus, String> {
    manager.start(text, language, words_per_minute)
}

#[tauri::command]
async fn stop_stenography_voice(manager: State<'_, StenographyAudioManager>) -> Result<(), String> {
    manager.stop();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DirectTypingManager::default())
        .manage(StenographyAudioManager::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            start_direct_typing,
            update_direct_typing,
            stop_direct_typing,
            direct_typing_status,
            start_stenography_voice,
            stop_stenography_voice,
        ])
        .run(tauri::generate_context!())
        .expect("error while running BhashaYantra");
}
