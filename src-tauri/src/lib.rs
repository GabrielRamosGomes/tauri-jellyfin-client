use keyring::Entry;

const KEYCHAIN_SERVICE: &str = "com.tauri-jellyfin-client";

fn get_entry(account: &str) -> Result<Entry, String> {
    Entry::new(KEYCHAIN_SERVICE, account).map_err(|e| e.to_string())
}

#[tauri::command]
fn secure_set(account: String, value: String) -> Result<(), String> {
    Entry::new(KEYCHAIN_SERVICE, &account)
        .and_then(|e| e.set_password(&value))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn secure_get(account: String) -> Result<Option<String>, String> {
    let entry = get_entry(&account)?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn secure_delete(account: String) -> Result<(), String> {
    let entry = get_entry(&account)?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![secure_set, secure_get, secure_delete])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
