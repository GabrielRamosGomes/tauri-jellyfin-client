use libmpv2::Mpv;
use tauri::State;

pub fn create() -> libmpv2::Result<Mpv> {
  let mpv = Mpv::with_initializer(|init| {
    init.set_property("vo", "gpu-next")?;
    init.set_property("hwdec", "auto-safe")?;
    init.set_property("input-default-bindings", true)?;
    init.set_property("input-vo-keyboard", true)?;
    init.set_property("osc", true)?; // Temp until own controls are built
    Ok(())
  })?;

  // The default CLOSE_WIN binding is `quit`, which destroys the player core for good.
  mpv.command("keybind", &["CLOSE_WIN", "stop"])?;

  Ok(mpv)
}

#[tauri::command]
pub async fn player_load(mpv: State<'_, Mpv>, request: String) -> Result<(), String> {
  mpv.command("loadfile", &[request.as_str()])
    .map_err(|e| e.to_string())
}