use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectTypingProfile {
    pub layout: String,
    pub output_mode: String,
    pub smart_dictionary: HashMap<String, String>,
    pub legacy_to_unicode_pairs: Vec<[String; 2]>,
    pub unicode_to_legacy_pairs: Vec<[String; 2]>,
    pub key_map: HashMap<String, String>,
    pub custom_source_mappings: HashMap<String, String>,
    pub shortcuts: Vec<DirectTypingShortcut>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct DirectTypingShortcut {
    pub key: String,
    pub ctrl: bool,
    pub alt: bool,
    pub shift: bool,
    pub output: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectTypingStatus {
    pub available: bool,
    pub enabled: bool,
    pub layout: Option<String>,
    pub output_mode: Option<String>,
    pub last_error: Option<String>,
}

#[cfg(target_os = "windows")]
mod windows_service {
    use super::{DirectTypingProfile, DirectTypingShortcut, DirectTypingStatus};
    use regex::Regex;
    use std::collections::HashMap;
    use std::mem::{size_of, zeroed};
    use std::ptr::null_mut;
    use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
    use std::sync::mpsc::{self, Receiver, Sender};
    use std::sync::{Mutex, OnceLock};
    use std::thread::{self, JoinHandle};
    use unicode_normalization::UnicodeNormalization;
    use windows_sys::Win32::Foundation::{GetLastError, LPARAM, LRESULT, WPARAM};
    use windows_sys::Win32::System::Threading::{GetCurrentProcessId, GetCurrentThreadId};
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        GetAsyncKeyState, GetKeyState, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT,
        KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, VK_BACK, VK_CAPITAL, VK_CONTROL, VK_DELETE, VK_DOWN,
        VK_END, VK_ESCAPE, VK_F12, VK_HOME, VK_LEFT, VK_LWIN, VK_MENU, VK_NEXT, VK_PRIOR,
        VK_RETURN, VK_RIGHT, VK_RWIN, VK_SHIFT, VK_SPACE, VK_TAB, VK_UP,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        CallNextHookEx, DispatchMessageW, GetForegroundWindow, GetMessageW,
        GetWindowThreadProcessId, PostThreadMessageW, SetWindowsHookExW, TranslateMessage,
        UnhookWindowsHookEx, KBDLLHOOKSTRUCT, LLKHF_INJECTED, MSG, WH_KEYBOARD_LL, WH_MOUSE_LL,
        WM_KEYDOWN, WM_KEYUP, WM_LBUTTONDOWN, WM_MBUTTONDOWN, WM_MOUSEWHEEL, WM_QUIT,
        WM_RBUTTONDOWN, WM_SYSKEYDOWN, WM_SYSKEYUP, WM_XBUTTONDOWN,
    };

    const I_MATRA_MARKER: &str = "\u{FFF0}";
    const REPH_MARKER: &str = "\u{FFF1}";
    const INPUT_MARKER: usize = 0x4259_414E_5452_4101;

    #[derive(Clone)]
    enum EngineEvent {
        Character(char, isize),
        Backspace(isize),
        Boundary(Boundary, isize),
        Reset,
        Configure(DirectTypingProfile),
        DirectOutput(DirectTypingShortcut, isize),
        Stop,
    }

    #[derive(Clone, Copy)]
    enum Boundary {
        Space,
        Enter,
        Tab,
    }

    struct HookRuntime {
        enabled: AtomicBool,
        process_id: AtomicU32,
        thread_id: AtomicU32,
        sender: Mutex<Option<Sender<EngineEvent>>>,
        shortcuts: Mutex<Vec<DirectTypingShortcut>>,
        status: Mutex<DirectTypingStatus>,
    }

    impl HookRuntime {
        fn new() -> Self {
            Self {
                enabled: AtomicBool::new(false),
                process_id: AtomicU32::new(0),
                thread_id: AtomicU32::new(0),
                sender: Mutex::new(None),
                shortcuts: Mutex::new(Vec::new()),
                status: Mutex::new(DirectTypingStatus {
                    available: true,
                    enabled: false,
                    layout: None,
                    output_mode: None,
                    last_error: None,
                }),
            }
        }

        fn send(&self, event: EngineEvent) {
            if let Ok(sender) = self.sender.lock() {
                if let Some(sender) = sender.as_ref() {
                    let _ = sender.send(event);
                }
            }
        }

        fn set_error(&self, message: String) {
            if let Ok(mut status) = self.status.lock() {
                status.last_error = Some(message);
            }
        }

        fn set_profile(&self, profile: &DirectTypingProfile) {
            if let Ok(mut shortcuts) = self.shortcuts.lock() {
                *shortcuts = profile.shortcuts.clone();
            }
            if let Ok(mut status) = self.status.lock() {
                status.enabled = true;
                status.layout = Some(profile.layout.clone());
                status.output_mode = Some(profile.output_mode.clone());
                status.last_error = None;
            }
        }

        fn set_disabled(&self) {
            self.enabled.store(false, Ordering::SeqCst);
            if let Ok(mut status) = self.status.lock() {
                status.enabled = false;
            }
        }
    }

    static HOOK_RUNTIME: OnceLock<HookRuntime> = OnceLock::new();

    fn runtime() -> &'static HookRuntime {
        HOOK_RUNTIME.get_or_init(HookRuntime::new)
    }

    #[derive(Default)]
    pub struct DirectTypingManager {
        hook_thread: Mutex<Option<JoinHandle<()>>>,
    }

    impl DirectTypingManager {
        pub fn start(&self, profile: DirectTypingProfile) -> Result<DirectTypingStatus, String> {
            self.cleanup_finished();

            if let Ok(thread) = self.hook_thread.lock() {
                if thread.is_some() {
                    runtime().send(EngineEvent::Configure(profile.clone()));
                    runtime().enabled.store(true, Ordering::SeqCst);
                    runtime().set_profile(&profile);
                    return Ok(self.status());
                }
            }

            let (ready_sender, ready_receiver) = mpsc::sync_channel::<Result<(), String>>(1);
            let initial_profile = profile.clone();
            let handle = thread::Builder::new()
                .name("bhashayantra-direct-typing".to_string())
                .spawn(move || hook_thread_main(initial_profile, ready_sender))
                .map_err(|error| format!("Could not start Direct Typing: {error}"))?;

            let startup = ready_receiver
                .recv()
                .map_err(|_| "Direct Typing stopped during startup".to_string())?;
            if let Err(error) = startup {
                let _ = handle.join();
                return Err(error);
            }

            if let Ok(mut thread) = self.hook_thread.lock() {
                *thread = Some(handle);
            }
            runtime().enabled.store(true, Ordering::SeqCst);
            runtime().set_profile(&profile);
            Ok(self.status())
        }

        pub fn update(&self, profile: DirectTypingProfile) -> Result<DirectTypingStatus, String> {
            if !runtime().enabled.load(Ordering::SeqCst) {
                return Err("Direct Typing is not active".to_string());
            }
            runtime().send(EngineEvent::Configure(profile.clone()));
            runtime().set_profile(&profile);
            Ok(self.status())
        }

        pub fn stop(&self) -> DirectTypingStatus {
            runtime().set_disabled();
            runtime().send(EngineEvent::Stop);
            let thread_id = runtime().thread_id.load(Ordering::SeqCst);
            if thread_id != 0 {
                unsafe { PostThreadMessageW(thread_id, WM_QUIT, 0, 0) };
            }
            if let Ok(mut slot) = self.hook_thread.lock() {
                if let Some(handle) = slot.take() {
                    let _ = handle.join();
                }
            }
            self.status()
        }

        pub fn status(&self) -> DirectTypingStatus {
            runtime()
                .status
                .lock()
                .map(|status| status.clone())
                .unwrap_or(DirectTypingStatus {
                    available: true,
                    enabled: false,
                    layout: None,
                    output_mode: None,
                    last_error: Some("Direct Typing status is unavailable".to_string()),
                })
        }

        fn cleanup_finished(&self) {
            if let Ok(mut slot) = self.hook_thread.lock() {
                if slot.as_ref().is_some_and(JoinHandle::is_finished) {
                    if let Some(handle) = slot.take() {
                        let _ = handle.join();
                    }
                }
            }
        }
    }

    impl Drop for DirectTypingManager {
        fn drop(&mut self) {
            let _ = self.stop();
        }
    }

    fn hook_thread_main(
        profile: DirectTypingProfile,
        ready_sender: mpsc::SyncSender<Result<(), String>>,
    ) {
        let (engine_sender, engine_receiver) = mpsc::channel();
        let worker = thread::Builder::new()
            .name("bhashayantra-composer".to_string())
            .spawn(move || engine_worker(profile, engine_receiver));

        let worker = match worker {
            Ok(worker) => worker,
            Err(error) => {
                let _ = ready_sender.send(Err(format!("Could not start composer: {error}")));
                return;
            }
        };

        runtime()
            .process_id
            .store(unsafe { GetCurrentProcessId() }, Ordering::SeqCst);
        runtime()
            .thread_id
            .store(unsafe { GetCurrentThreadId() }, Ordering::SeqCst);
        if let Ok(mut sender) = runtime().sender.lock() {
            *sender = Some(engine_sender);
        }

        let keyboard_hook = unsafe {
            SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_hook_callback), null_mut(), 0)
        };
        if keyboard_hook.is_null() {
            let error = format!("Windows keyboard hook failed (error {})", unsafe {
                GetLastError()
            });
            runtime().set_disabled();
            runtime().set_error(error.clone());
            runtime().send(EngineEvent::Stop);
            if let Ok(mut sender) = runtime().sender.lock() {
                *sender = None;
            }
            let _ = worker.join();
            let _ = ready_sender.send(Err(error));
            return;
        }

        let mouse_hook =
            unsafe { SetWindowsHookExW(WH_MOUSE_LL, Some(mouse_hook_callback), null_mut(), 0) };
        if mouse_hook.is_null() {
            unsafe { UnhookWindowsHookEx(keyboard_hook) };
            let error = format!("Windows focus hook failed (error {})", unsafe {
                GetLastError()
            });
            runtime().set_disabled();
            runtime().set_error(error.clone());
            runtime().send(EngineEvent::Stop);
            if let Ok(mut sender) = runtime().sender.lock() {
                *sender = None;
            }
            let _ = worker.join();
            let _ = ready_sender.send(Err(error));
            return;
        }

        let _ = ready_sender.send(Ok(()));
        let mut message: MSG = unsafe { zeroed() };
        loop {
            let result = unsafe { GetMessageW(&mut message, null_mut(), 0, 0) };
            if result <= 0 {
                break;
            }
            unsafe {
                TranslateMessage(&message);
                DispatchMessageW(&message);
            }
        }

        runtime().set_disabled();
        runtime().send(EngineEvent::Stop);
        if let Ok(mut sender) = runtime().sender.lock() {
            *sender = None;
        }
        runtime().thread_id.store(0, Ordering::SeqCst);
        unsafe {
            UnhookWindowsHookEx(mouse_hook);
            UnhookWindowsHookEx(keyboard_hook);
        }
        let _ = worker.join();
    }

    unsafe extern "system" fn keyboard_hook_callback(
        code: i32,
        wparam: WPARAM,
        lparam: LPARAM,
    ) -> LRESULT {
        if code < 0 {
            return unsafe { CallNextHookEx(null_mut(), code, wparam, lparam) };
        }

        let event = unsafe { &*(lparam as *const KBDLLHOOKSTRUCT) };
        if event.flags & LLKHF_INJECTED != 0 {
            return unsafe { CallNextHookEx(null_mut(), code, wparam, lparam) };
        }

        let key_down = wparam == WM_KEYDOWN as usize || wparam == WM_SYSKEYDOWN as usize;
        let key_up = wparam == WM_KEYUP as usize || wparam == WM_SYSKEYUP as usize;
        if !key_down && !key_up {
            return unsafe { CallNextHookEx(null_mut(), code, wparam, lparam) };
        }

        let ctrl = key_is_down(VK_CONTROL);
        let alt = key_is_down(VK_MENU);
        if event.vkCode == VK_F12 as u32 && ctrl && alt {
            if key_down {
                runtime().set_disabled();
                runtime().send(EngineEvent::Stop);
                let thread_id = runtime().thread_id.load(Ordering::SeqCst);
                if thread_id != 0 {
                    unsafe { PostThreadMessageW(thread_id, WM_QUIT, 0, 0) };
                }
            }
            return 1;
        }

        if !runtime().enabled.load(Ordering::SeqCst) || foreground_is_bhashayantra() {
            return unsafe { CallNextHookEx(null_mut(), code, wparam, lparam) };
        }

        if ctrl || alt || key_is_down(VK_LWIN) || key_is_down(VK_RWIN) {
            if let Some(shortcut) = matching_shortcut(event.vkCode, ctrl, alt) {
                if key_down {
                    runtime().send(EngineEvent::DirectOutput(shortcut, unsafe {
                        GetForegroundWindow()
                    }
                        as isize));
                }
                return 1;
            }
            if key_down {
                runtime().send(EngineEvent::Reset);
            }
            return unsafe { CallNextHookEx(null_mut(), code, wparam, lparam) };
        }

        let foreground = unsafe { GetForegroundWindow() } as isize;
        let handled = event.vkCode == VK_BACK as u32
            || event.vkCode == VK_SPACE as u32
            || event.vkCode == VK_RETURN as u32
            || event.vkCode == VK_TAB as u32
            || virtual_key_to_ascii(event.vkCode).is_some();

        if handled {
            if key_down {
                if event.vkCode == VK_BACK as u32 {
                    runtime().send(EngineEvent::Backspace(foreground));
                } else if event.vkCode == VK_SPACE as u32 {
                    runtime().send(EngineEvent::Boundary(Boundary::Space, foreground));
                } else if event.vkCode == VK_RETURN as u32 {
                    runtime().send(EngineEvent::Boundary(Boundary::Enter, foreground));
                } else if event.vkCode == VK_TAB as u32 {
                    runtime().send(EngineEvent::Boundary(Boundary::Tab, foreground));
                } else if let Some(character) = virtual_key_to_ascii(event.vkCode) {
                    runtime().send(EngineEvent::Character(character, foreground));
                }
            }
            return 1;
        }

        if key_down && is_navigation_key(event.vkCode) {
            runtime().send(EngineEvent::Reset);
        }
        unsafe { CallNextHookEx(null_mut(), code, wparam, lparam) }
    }

    unsafe extern "system" fn mouse_hook_callback(
        code: i32,
        wparam: WPARAM,
        lparam: LPARAM,
    ) -> LRESULT {
        if code >= 0
            && runtime().enabled.load(Ordering::SeqCst)
            && matches!(
                wparam as u32,
                WM_LBUTTONDOWN | WM_RBUTTONDOWN | WM_MBUTTONDOWN | WM_XBUTTONDOWN | WM_MOUSEWHEEL
            )
        {
            runtime().send(EngineEvent::Reset);
        }
        unsafe { CallNextHookEx(null_mut(), code, wparam, lparam) }
    }

    fn foreground_is_bhashayantra() -> bool {
        let foreground = unsafe { GetForegroundWindow() };
        if foreground.is_null() {
            return false;
        }
        let mut process_id = 0u32;
        unsafe { GetWindowThreadProcessId(foreground, &mut process_id) };
        process_id == runtime().process_id.load(Ordering::SeqCst)
    }

    fn key_is_down(key: u16) -> bool {
        unsafe { GetAsyncKeyState(key as i32) < 0 }
    }

    fn is_navigation_key(key: u32) -> bool {
        matches!(
            key as u16,
            VK_LEFT
                | VK_RIGHT
                | VK_UP
                | VK_DOWN
                | VK_HOME
                | VK_END
                | VK_PRIOR
                | VK_NEXT
                | VK_DELETE
                | VK_ESCAPE
        )
    }

    fn virtual_key_to_ascii(key: u32) -> Option<char> {
        let shift = key_is_down(VK_SHIFT);
        let caps = unsafe { GetKeyState(VK_CAPITAL as i32) & 1 != 0 };
        if (0x41..=0x5A).contains(&key) {
            let value = char::from_u32(key)?;
            return Some(if shift ^ caps {
                value
            } else {
                value.to_ascii_lowercase()
            });
        }
        if (0x30..=0x39).contains(&key) {
            const SHIFTED: [char; 10] = [')', '!', '@', '#', '$', '%', '^', '&', '*', '('];
            return Some(if shift {
                SHIFTED[(key - 0x30) as usize]
            } else {
                char::from_u32(key)?
            });
        }
        let (plain, shifted) = match key {
            0xBA => (';', ':'),
            0xBB => ('=', '+'),
            0xBC => (',', '<'),
            0xBD => ('-', '_'),
            0xBE => ('.', '>'),
            0xBF => ('/', '?'),
            0xC0 => ('`', '~'),
            0xDB => ('[', '{'),
            0xDC => ('\\', '|'),
            0xDD => (']', '}'),
            0xDE => ('\'', '"'),
            _ => return None,
        };
        Some(if shift { shifted } else { plain })
    }

    fn matching_shortcut(key: u32, ctrl: bool, alt: bool) -> Option<DirectTypingShortcut> {
        let shift = key_is_down(VK_SHIFT);
        let character = virtual_key_to_ascii(key)?.to_ascii_lowercase().to_string();
        runtime()
            .shortcuts
            .lock()
            .ok()?
            .iter()
            .find_map(|shortcut| {
                (shortcut.key.to_ascii_lowercase() == character
                    && shortcut.ctrl == ctrl
                    && shortcut.alt == alt
                    && shortcut.shift == shift)
                    .then(|| shortcut.clone())
            })
    }

    fn engine_worker(mut profile: DirectTypingProfile, receiver: Receiver<EngineEvent>) {
        let mut source = String::new();
        let mut rendered = String::new();
        let mut target_window = 0isize;

        while let Ok(event) = receiver.recv() {
            match event {
                EngineEvent::Configure(next) => {
                    profile = next;
                    source.clear();
                    rendered.clear();
                    target_window = 0;
                }
                EngineEvent::Reset => {
                    source.clear();
                    rendered.clear();
                    target_window = 0;
                }
                EngineEvent::Stop => break,
                EngineEvent::DirectOutput(shortcut, window) => {
                    source.clear();
                    rendered.clear();
                    target_window = window;
                    let converted = if profile.output_mode == "legacy" {
                        unicode_to_legacy(&shortcut.output, &profile.unicode_to_legacy_pairs)
                    } else {
                        shortcut.output.clone()
                    };
                    record_injection(inject_shortcut_output(&converted, &shortcut));
                }
                EngineEvent::Boundary(boundary, window) => {
                    source.clear();
                    rendered.clear();
                    target_window = window;
                    record_injection(inject_boundary(boundary));
                }
                EngineEvent::Backspace(window) => {
                    if target_window != window {
                        source.clear();
                        rendered.clear();
                        target_window = window;
                    }
                    if source.pop().is_some() {
                        let next = transform_source(&source, &profile);
                        record_injection(replace_rendered(&rendered, &next));
                        rendered = next;
                    } else {
                        record_injection(inject_virtual_key(VK_BACK));
                    }
                }
                EngineEvent::Character(character, window) => {
                    if target_window != window {
                        source.clear();
                        rendered.clear();
                        target_window = window;
                    }

                    if is_character_boundary(character, &profile) {
                        source.clear();
                        rendered.clear();
                        let output = transform_source(&character.to_string(), &profile);
                        record_injection(inject_unicode(&output));
                        continue;
                    }

                    source.push(character);
                    let next = transform_source(&source, &profile);
                    record_injection(replace_rendered(&rendered, &next));
                    rendered = next;
                }
            }
        }
    }

    fn record_injection(result: Result<(), String>) {
        if let Err(error) = result {
            runtime().set_error(error);
        }
    }

    fn is_character_boundary(character: char, profile: &DirectTypingProfile) -> bool {
        match profile.layout.as_str() {
            "bhashayantra-smart" | "english-qwerty" => !character.is_ascii_alphanumeric(),
            "inscript" => profile
                .key_map
                .get(&character.to_string())
                .is_some_and(|output| matches!(output.as_str(), "," | "." | "।")),
            _ => false,
        }
    }

    fn transform_source(source: &str, profile: &DirectTypingProfile) -> String {
        let expanded_source = source
            .chars()
            .map(|character| {
                profile
                    .custom_source_mappings
                    .get(&character.to_ascii_lowercase().to_string())
                    .cloned()
                    .unwrap_or_else(|| character.to_string())
            })
            .collect::<String>();
        let source = expanded_source.as_str();

        if profile.layout == "english-qwerty" {
            return source.to_string();
        }
        if profile.output_mode == "legacy"
            && matches!(profile.layout.as_str(), "classic-hindi" | "remington-gail")
        {
            return source.to_string();
        }

        let unicode = match profile.layout.as_str() {
            "bhashayantra-smart" => smart_phonetic_to_unicode(source, &profile.smart_dictionary),
            "classic-hindi" | "remington-gail" => {
                legacy_to_unicode(source, &profile.legacy_to_unicode_pairs)
            }
            "inscript" => direct_map_to_unicode(source, &profile.key_map),
            "remington-cbi" => {
                compose_remington_unicode(&direct_map_to_unicode(source, &profile.key_map))
            }
            _ => source.to_string(),
        };

        if profile.output_mode == "legacy" {
            unicode_to_legacy(&unicode, &profile.unicode_to_legacy_pairs)
        } else {
            unicode.nfc().collect()
        }
    }

    fn direct_map_to_unicode(source: &str, map: &HashMap<String, String>) -> String {
        source
            .chars()
            .map(|character| {
                map.get(&character.to_string())
                    .cloned()
                    .unwrap_or_else(|| character.to_string())
            })
            .collect::<String>()
            .nfc()
            .collect()
    }

    fn compose_remington_unicode(source: &str) -> String {
        source
            .replace("्ा", "")
            .replace("अा", "आ")
            .replace("आॅ", "ऑ")
            .replace("आे", "ओ")
            .replace("आै", "औ")
            .replace("ाॅ", "ॉ")
            .replace("ाे", "ो")
            .replace("ाै", "ौ")
            .replace("एॅ", "ऍ")
            .replace("एे", "ऐ")
            .replace("इी", "ई")
            .replace("उु", "ऊ")
            .replace("ॅं", "ँ")
            .nfc()
            .collect()
    }

    fn legacy_to_unicode(source: &str, pairs: &[[String; 2]]) -> String {
        let converted = tokenize_pairs(source, pairs, true);
        let with_i = converted.replace(I_MATRA_MARKER, "ि");
        let reph = Regex::new(r"([क-हक़-य़](?:्[क-हक़-य़])?)([ािीुूृेैोौंँःॅ]*)\u{FFF1}")
            .expect("valid reph expression");
        reph.replace_all(&with_i, "र्$1$2")
            .replace(REPH_MARKER, "र्")
            .nfc()
            .collect()
    }

    fn unicode_to_legacy(source: &str, pairs: &[[String; 2]]) -> String {
        let i_matra = Regex::new(r"([क-हक़-य़](?:्[क-हक़-य़])*)ि").expect("valid short-i expression");
        let prepared = i_matra.replace_all(source, format!("{I_MATRA_MARKER}$1"));
        tokenize_pairs(&prepared, pairs, false).replace(I_MATRA_MARKER, "f")
    }

    fn tokenize_pairs(source: &str, pairs: &[[String; 2]], legacy_direction: bool) -> String {
        let mut sorted = pairs.to_vec();
        sorted.sort_by(|left, right| right[0].len().cmp(&left[0].len()));
        let mut output = String::new();
        let mut cursor = 0usize;
        let mut pending_i = false;

        while cursor < source.len() {
            let remaining = &source[cursor..];
            if !legacy_direction && remaining.starts_with(I_MATRA_MARKER) {
                output.push_str(I_MATRA_MARKER);
                cursor += I_MATRA_MARKER.len();
                continue;
            }
            if legacy_direction && remaining.starts_with('f') {
                pending_i = true;
                cursor += 1;
                continue;
            }
            if legacy_direction && remaining.starts_with('Z') {
                output.push_str(REPH_MARKER);
                cursor += 1;
                continue;
            }

            if let Some(pair) = sorted.iter().find(|pair| remaining.starts_with(&pair[0])) {
                output.push_str(&pair[1]);
                let next_cursor = cursor + pair[0].len();
                let next_pair = sorted
                    .iter()
                    .find(|candidate| source[next_cursor..].starts_with(&candidate[0]));
                let cluster_continues = pair[1].ends_with('्')
                    || next_pair.is_some_and(|candidate| candidate[1].starts_with('्'));
                if pending_i && !cluster_continues {
                    output.push_str(I_MATRA_MARKER);
                    pending_i = false;
                }
                cursor = next_cursor;
                continue;
            }

            let character = remaining.chars().next().unwrap_or_default();
            output.push(character);
            cursor += character.len_utf8();
        }
        if pending_i {
            output.push('ि');
        }
        output
    }

    fn smart_phonetic_to_unicode(source: &str, dictionary: &HashMap<String, String>) -> String {
        if let Some(value) = dictionary.get(&source.to_lowercase()) {
            return value.clone();
        }

        const VOWELS: [(&str, &str, &str); 12] = [
            ("aa", "आ", "ा"),
            ("ai", "ऐ", "ै"),
            ("au", "औ", "ौ"),
            ("ee", "ई", "ी"),
            ("ii", "ई", "ी"),
            ("oo", "ऊ", "ू"),
            ("uu", "ऊ", "ू"),
            ("ri", "ऋ", "ृ"),
            ("a", "अ", ""),
            ("i", "इ", "ि"),
            ("u", "उ", "ु"),
            ("e", "ए", "े"),
        ];
        const EXTRA_VOWEL: (&str, &str, &str) = ("o", "ओ", "ो");
        const CONSONANTS: [(&str, &str); 40] = [
            ("ksh", "क्ष"),
            ("chh", "छ"),
            ("ddh", "ढ"),
            ("tth", "ठ"),
            ("shr", "श्र"),
            ("gya", "ज्ञ"),
            ("jny", "ज्ञ"),
            ("kh", "ख"),
            ("gh", "घ"),
            ("ng", "ङ"),
            ("ch", "च"),
            ("jh", "झ"),
            ("ny", "ञ"),
            ("tt", "ट"),
            ("th", "थ"),
            ("dd", "ड"),
            ("dh", "ध"),
            ("nn", "ण"),
            ("ph", "फ"),
            ("bh", "भ"),
            ("sh", "श"),
            ("ss", "ष"),
            ("tr", "त्र"),
            ("gy", "ज्ञ"),
            ("k", "क"),
            ("g", "ग"),
            ("c", "च"),
            ("j", "ज"),
            ("t", "त"),
            ("d", "द"),
            ("n", "न"),
            ("p", "प"),
            ("f", "फ"),
            ("b", "ब"),
            ("m", "म"),
            ("y", "य"),
            ("r", "र"),
            ("l", "ल"),
            ("v", "व"),
            ("w", "व"),
        ];
        const EXTRA_CONSONANTS: [(&str, &str); 4] =
            [("s", "स"), ("h", "ह"), ("q", "क़"), ("x", "क्ष")];

        let mut output = String::new();
        let mut pending = String::new();
        let mut cursor = 0usize;
        while cursor < source.len() {
            let remaining = &source[cursor..];
            let case_match = [("Th", "ठ"), ("Dh", "ढ"), ("T", "ट"), ("D", "ड"), ("N", "ण")]
                .iter()
                .find(|(token, _)| remaining.starts_with(token));
            if let Some((token, value)) = case_match {
                flush_pending(&mut output, &mut pending, true);
                pending.push_str(value);
                cursor += token.len();
                continue;
            }

            let lower = remaining.to_lowercase();
            let vowel = VOWELS
                .iter()
                .chain(std::iter::once(&EXTRA_VOWEL))
                .find(|(token, _, _)| lower.starts_with(token));
            if let Some((token, independent, sign)) = vowel {
                if pending.is_empty() {
                    output.push_str(independent);
                } else {
                    output.push_str(&pending);
                    output.push_str(sign);
                    pending.clear();
                }
                cursor += token.len();
                continue;
            }

            let consonant = CONSONANTS
                .iter()
                .chain(EXTRA_CONSONANTS.iter())
                .chain(std::iter::once(&("z", "ज़")))
                .find(|(token, _)| lower.starts_with(token));
            if let Some((token, value)) = consonant {
                flush_pending(&mut output, &mut pending, true);
                pending.push_str(value);
                cursor += token.len();
                continue;
            }

            flush_pending(&mut output, &mut pending, false);
            let character = remaining.chars().next().unwrap_or_default();
            output.push(character);
            cursor += character.len_utf8();
        }
        flush_pending(&mut output, &mut pending, false);
        output.nfc().collect()
    }

    fn flush_pending(output: &mut String, pending: &mut String, with_virama: bool) {
        if pending.is_empty() {
            return;
        }
        output.push_str(pending);
        if with_virama {
            output.push('्');
        }
        pending.clear();
    }

    #[derive(Debug, PartialEq, Eq)]
    struct RenderDelta {
        delete_characters: usize,
        insert: String,
    }

    fn render_delta(previous: &str, next: &str) -> RenderDelta {
        let mut prefix_bytes = 0usize;
        for (previous_character, next_character) in previous.chars().zip(next.chars()) {
            if previous_character != next_character {
                break;
            }
            prefix_bytes += previous_character.len_utf8();
        }

        RenderDelta {
            delete_characters: previous[prefix_bytes..].chars().count(),
            insert: next[prefix_bytes..].to_string(),
        }
    }

    fn replace_rendered(previous: &str, next: &str) -> Result<(), String> {
        let delta = render_delta(previous, next);
        for _ in 0..delta.delete_characters {
            inject_virtual_key(VK_BACK)?;
        }
        inject_unicode(&delta.insert)
    }

    fn inject_shortcut_output(output: &str, shortcut: &DirectTypingShortcut) -> Result<(), String> {
        let mut release = Vec::new();
        let mut restore = Vec::new();
        if shortcut.shift {
            release.push(virtual_input(VK_SHIFT, true));
            restore.push(virtual_input(VK_SHIFT, false));
        }
        if shortcut.alt {
            release.push(virtual_input(VK_MENU, true));
            restore.insert(0, virtual_input(VK_MENU, false));
        }
        if shortcut.ctrl {
            release.push(virtual_input(VK_CONTROL, true));
            restore.insert(0, virtual_input(VK_CONTROL, false));
        }
        inject_inputs(&release)?;
        inject_unicode(output)?;
        inject_inputs(&restore)
    }

    fn inject_boundary(boundary: Boundary) -> Result<(), String> {
        match boundary {
            Boundary::Space => inject_virtual_key(VK_SPACE),
            Boundary::Enter => inject_virtual_key(VK_RETURN),
            Boundary::Tab => inject_virtual_key(VK_TAB),
        }
    }

    fn inject_virtual_key(key: u16) -> Result<(), String> {
        inject_inputs(&[virtual_input(key, false), virtual_input(key, true)])
    }

    fn virtual_input(key: u16, key_up: bool) -> INPUT {
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: key,
                    wScan: 0,
                    dwFlags: if key_up { KEYEVENTF_KEYUP } else { 0 },
                    time: 0,
                    dwExtraInfo: INPUT_MARKER,
                },
            },
        }
    }

    fn inject_unicode(text: &str) -> Result<(), String> {
        if text.is_empty() {
            return Ok(());
        }
        let mut inputs = Vec::with_capacity(text.encode_utf16().count() * 2);
        for code_unit in text.encode_utf16() {
            let key_down = INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: 0,
                        wScan: code_unit,
                        dwFlags: KEYEVENTF_UNICODE,
                        time: 0,
                        dwExtraInfo: INPUT_MARKER,
                    },
                },
            };
            let mut key_up = key_down;
            key_up.Anonymous.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
            inputs.push(key_down);
            inputs.push(key_up);
        }
        inject_inputs(&inputs)
    }

    fn inject_inputs(inputs: &[INPUT]) -> Result<(), String> {
        for batch in inputs.chunks(512) {
            let sent = unsafe {
                SendInput(
                    batch.len() as u32,
                    batch.as_ptr(),
                    size_of::<INPUT>() as i32,
                )
            };
            if sent != batch.len() as u32 {
                return Err(format!(
                    "Windows blocked Direct Typing after {sent}/{} events. Do not run the target app as administrator.",
                    batch.len()
                ));
            }
        }
        Ok(())
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        fn profile(layout: &str, output: &str) -> DirectTypingProfile {
            DirectTypingProfile {
                layout: layout.to_string(),
                output_mode: output.to_string(),
                smart_dictionary: HashMap::from([
                    ("mera".to_string(), "मेरा".to_string()),
                    ("naam".to_string(), "नाम".to_string()),
                ]),
                legacy_to_unicode_pairs: vec![
                    ["d".to_string(), "क".to_string()],
                    ["f".to_string(), "ि".to_string()],
                    ["e".to_string(), "म".to_string()],
                    ["s".to_string(), "े".to_string()],
                    ["j".to_string(), "र".to_string()],
                    ["k".to_string(), "ा".to_string()],
                ],
                unicode_to_legacy_pairs: vec![
                    ["क".to_string(), "d".to_string()],
                    ["ि".to_string(), "f".to_string()],
                ],
                key_map: HashMap::new(),
                custom_source_mappings: HashMap::new(),
                shortcuts: Vec::new(),
            }
        }

        #[test]
        fn smart_profile_matches_frontend_dictionary() {
            assert_eq!(
                transform_source("mera", &profile("bhashayantra-smart", "unicode")),
                "मेरा"
            );
        }

        #[test]
        fn classic_short_i_is_reordered() {
            assert_eq!(
                transform_source("fd", &profile("classic-hindi", "unicode")),
                "कि"
            );
        }

        #[test]
        fn classic_legacy_keeps_the_raw_font_encoding() {
            assert_eq!(
                transform_source("fd", &profile("classic-hindi", "legacy")),
                "fd"
            );
        }

        #[test]
        fn custom_mapping_is_expanded_before_layout_conversion() {
            let mut configured = profile("classic-hindi", "unicode");
            configured
                .custom_source_mappings
                .insert("x".to_string(), "d".to_string());
            assert_eq!(transform_source("x", &configured), "क");
        }

        #[test]
        fn office_delta_preserves_the_stable_unicode_prefix() {
            assert_eq!(
                render_delta("मेर", "मेरा"),
                RenderDelta {
                    delete_characters: 0,
                    insert: "ा".to_string(),
                }
            );
            assert_eq!(
                render_delta("ि", "कि"),
                RenderDelta {
                    delete_characters: 1,
                    insert: "कि".to_string(),
                }
            );
            assert_eq!(
                render_delta("मेरा", ""),
                RenderDelta {
                    delete_characters: 4,
                    insert: String::new(),
                }
            );
        }

        #[test]
        fn office_delta_reconstructs_the_classic_hindi_fixture() {
            let configured = profile("classic-hindi", "unicode");
            let mut source = String::new();
            let mut rendered = String::new();
            let mut document = String::new();

            for character in "esjk".chars() {
                source.push(character);
                let next = transform_source(&source, &configured);
                let delta = render_delta(&rendered, &next);
                for _ in 0..delta.delete_characters {
                    document.pop();
                }
                document.push_str(&delta.insert);
                rendered = next;
            }

            assert_eq!(document, "मेरा");
            assert_eq!(rendered, "मेरा");
        }

        #[test]
        fn native_hook_starts_and_stops_cleanly() {
            let manager = DirectTypingManager::default();
            let started = manager
                .start(profile("classic-hindi", "unicode"))
                .expect("Windows hook should start in the desktop test process");
            assert!(started.enabled);
            assert_eq!(started.layout.as_deref(), Some("classic-hindi"));

            let stopped = manager.stop();
            assert!(!stopped.enabled);
        }
    }
}

#[cfg(target_os = "windows")]
pub use windows_service::DirectTypingManager;

#[cfg(not(target_os = "windows"))]
#[derive(Default)]
pub struct DirectTypingManager;

#[cfg(not(target_os = "windows"))]
impl DirectTypingManager {
    pub fn start(&self, _profile: DirectTypingProfile) -> Result<DirectTypingStatus, String> {
        Err("Direct Typing is currently available on Windows only".to_string())
    }

    pub fn update(&self, _profile: DirectTypingProfile) -> Result<DirectTypingStatus, String> {
        Err("Direct Typing is currently available on Windows only".to_string())
    }

    pub fn stop(&self) -> DirectTypingStatus {
        self.status()
    }

    pub fn status(&self) -> DirectTypingStatus {
        DirectTypingStatus {
            available: false,
            enabled: false,
            layout: None,
            output_mode: None,
            last_error: None,
        }
    }
}
