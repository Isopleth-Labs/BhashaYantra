#[cfg(target_os = "windows")]
fn inject_unicode_text(text: &str) -> Result<usize, String> {
    use std::mem::size_of;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE,
    };

    let mut inputs = Vec::with_capacity(text.encode_utf16().count() * 2);
    for code_unit in text
        .replace("\r\n", "\n")
        .replace('\n', "\r")
        .encode_utf16()
    {
        let key_down = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: 0,
                    wScan: code_unit,
                    dwFlags: KEYEVENTF_UNICODE,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };
        let mut key_up = key_down;
        key_up.Anonymous.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
        inputs.push(key_down);
        inputs.push(key_up);
    }

    if inputs.is_empty() {
        return Err("There is no text to send".to_string());
    }

    let mut sent_total = 0usize;
    for batch in inputs.chunks(1_024) {
        let sent = unsafe {
            SendInput(
                batch.len() as u32,
                batch.as_ptr(),
                size_of::<INPUT>() as i32,
            )
        };
        sent_total += sent as usize;
        if sent != batch.len() as u32 {
            return Err(format!(
                "Windows accepted {sent_total} of {} keyboard events. The target app may be running as administrator.",
                inputs.len()
            ));
        }
        std::thread::sleep(std::time::Duration::from_millis(2));
    }

    Ok(text.chars().count())
}

#[cfg(not(target_os = "windows"))]
fn inject_unicode_text(_text: &str) -> Result<usize, String> {
    Err("Use Anywhere is currently available on Windows only".to_string())
}

#[tauri::command]
async fn send_text_to_previous_app(
    text: String,
    window: tauri::WebviewWindow,
) -> Result<usize, String> {
    if text.trim().is_empty() {
        return Err("There is no text to send".to_string());
    }
    if text.chars().count() > 50_000 {
        return Err("Use Anywhere is limited to 50,000 characters per send".to_string());
    }

    window
        .minimize()
        .map_err(|error| format!("Could not minimize BhashaYantra: {error}"))?;
    std::thread::sleep(std::time::Duration::from_millis(450));
    inject_unicode_text(&text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![send_text_to_previous_app])
        .run(tauri::generate_context!())
        .expect("error while running BhashaYantra");
}
