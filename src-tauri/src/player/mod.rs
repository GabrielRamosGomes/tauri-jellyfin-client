mod error;

use libmpv2::Mpv;
use tauri::State;
use error::PlayerError;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayRequest {
  url: String,
  token: String,
  audio_track: Option<i64>,
  subtitle_track: Option<i64>,
  start_seconds: Option<i64>
}

pub fn create() -> libmpv2::Result<Mpv> {
  let mpv = Mpv::with_initializer(|init| {
    init.set_property("vo", "gpu-next")?;
    init.set_property("hwdec", "auto-safe")?;
    init.set_property("input-default-bindings", true)?; // Remove later, too many keybinds
    init.set_property("input-vo-keyboard", true)?;
    init.set_property("osc", true)?; // Temp until own controls are built
    init.set_property("audio-channels", "stereo")?; // Later will come from user settings
    init.set_property("terminal", true)?;
    init.set_property("input-terminal", false)?;
    Ok(())
  })?;

  // The default CLOSE_WIN binding is `quit`, which destroys the player core for good.
  mpv.command("keybind", &["CLOSE_WIN", "stop"])?;

  Ok(mpv)
}

#[tauri::command]
pub async fn player_load(mpv: State<'_, Mpv>, request: PlayRequest) -> Result<(), PlayerError> {
  let auth =  format!("Authorization: MediaBrowser Token=\"{}\"", request.token);
  mpv.set_property("http-header-fields", auth)?;
  
  // Always set all three: mpv keeps property values across files, so a None must reset them.
  let aid = request.audio_track.map_or("auto".to_string(), |n| n.to_string());
  let sid = request.subtitle_track.map_or("no".to_string(), |n| n.to_string());
  let start = request.start_seconds.map_or("none".to_string(), |s| s.to_string());

  mpv.set_property("aid", aid)?; // audio id
  mpv.set_property("sid", sid)?; // subtitle id
  mpv.set_property("start", start)?; // start time
  
  mpv.command("loadfile", &[request.url.as_str()])?;
  Ok(())
}