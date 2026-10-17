fn main() {
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        let dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        println!("cargo:rustc-link-search=native={dir}/lib/mpv");

        let mpv_dir = std::path::PathBuf::from(&dir).join("lib/mpv");
        // OUT_DIR is target/<profile>/build/<crate>-<hash>/out; the exe lives three levels up.
        let out_dir = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
        let profile_dir = out_dir.ancestors().nth(3).unwrap();
        std::fs::copy(mpv_dir.join("libmpv-2.dll"), profile_dir.join("libmpv-2.dll"))
            .expect("libmpv-2.dll missing, run `pnpm setup:mpv:windows` first");
    }

    tauri_build::build()
}
