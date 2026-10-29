use tauri::Manager;

mod keychain;
mod player;

#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            keychain::secure_set, 
            keychain::secure_get, 
            keychain::secure_delete,
            player::player_load
        ])
        .setup(|app| {
           app.manage(player::create()?);
           Ok(()) 
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
