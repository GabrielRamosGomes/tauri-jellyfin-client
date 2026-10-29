#[derive(Debug, thiserror::Error)]
pub enum PlayerError {
    #[error(transparent)]
    Mpv(#[from] libmpv2::Error),
}

impl serde::Serialize for PlayerError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}
