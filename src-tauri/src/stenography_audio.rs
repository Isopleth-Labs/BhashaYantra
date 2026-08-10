use serde::Serialize;
use std::io::Write;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeSpeechStatus {
    pub engine: &'static str,
    pub language: String,
    pub rate: i32,
}

#[derive(Default)]
pub struct StenographyAudioManager {
    process: Mutex<Option<Child>>,
}

impl StenographyAudioManager {
    pub fn start(
        &self,
        text: String,
        language: String,
        words_per_minute: u32,
    ) -> Result<NativeSpeechStatus, String> {
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return Err("Narration text is empty.".into());
        }
        if trimmed.chars().count() > 60_000 {
            return Err("Narration text exceeds the safe desktop speech limit.".into());
        }

        #[cfg(not(windows))]
        {
            let _ = (language, words_per_minute);
            return Err("Native narration is currently available on Windows only.".into());
        }

        #[cfg(windows)]
        {
            self.stop();
            let culture_prefix = if language.eq_ignore_ascii_case("hi") {
                "hi"
            } else {
                "en"
            };
            let rate = (((words_per_minute as i32) - 80) / 15).clamp(-4, 4);
            let script = format!(
                "$text=[Console]::In.ReadToEnd(); Add-Type -AssemblyName System.Speech; \
                 $speaker=New-Object System.Speech.Synthesis.SpeechSynthesizer; \
                 $voice=$speaker.GetInstalledVoices() | Where-Object {{ $_.Enabled -and $_.VoiceInfo.Culture.Name -like '{}*' }} | Select-Object -First 1; \
                 if($voice){{$speaker.SelectVoice($voice.VoiceInfo.Name)}}; \
                 $speaker.Rate={}; $speaker.Volume=100; $speaker.Speak($text); $speaker.Dispose();",
                culture_prefix, rate
            );

            let mut command = Command::new("powershell.exe");
            command
                .args([
                    "-NoLogo",
                    "-NoProfile",
                    "-NonInteractive",
                    "-Command",
                    &script,
                ])
                .stdin(Stdio::piped())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .creation_flags(CREATE_NO_WINDOW);

            let mut child = command
                .spawn()
                .map_err(|error| format!("Windows narration could not start: {error}"))?;
            let mut stdin = child
                .stdin
                .take()
                .ok_or_else(|| "Windows narration input could not open.".to_string())?;
            stdin
                .write_all(trimmed.as_bytes())
                .map_err(|error| format!("Narration text could not be sent: {error}"))?;
            drop(stdin);

            *self
                .process
                .lock()
                .map_err(|_| "Narration state is unavailable.".to_string())? = Some(child);
            Ok(NativeSpeechStatus {
                engine: "Windows native voice",
                language: culture_prefix.into(),
                rate,
            })
        }
    }

    pub fn stop(&self) {
        if let Ok(mut process) = self.process.lock() {
            if let Some(child) = process.as_mut() {
                let _ = child.kill();
                let _ = child.wait();
            }
            *process = None;
        }
    }
}

impl Drop for StenographyAudioManager {
    fn drop(&mut self) {
        self.stop();
    }
}
