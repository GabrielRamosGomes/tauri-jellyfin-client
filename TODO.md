- [x] 1. Server Management & Authentication
  - [x] Validate server URL (/System/Info/Public)
  - [x] Generate persistent DeviceId and X-Emby-Authorization header
  - [x] Authenticate user (/Users/AuthenticateByName) and store AccessToken
  - [x] Save session locally for auto-login on restart
  - [x] Multi-server storage and switching UI

- [ ] 2. Library & Media Discovery
  - [x] Fetch library categories
  - [x] Render media grids with pagination
  - [x] Detailed media view with backdrops (synopsis, year, runtime, stream specs, seasons)
  - [ ] Basic library sorting and filtering (Name, Date, Unwatched)
  - [ ] Work on UI framework to unify app styles

- [ ] 3. Playback / DirectPlayer
  - [ ] Send custom Client Profile in /PlaybackInfo to bypass server transcoding
  - [ ] Pass raw stream URL directly to libmpv
  - [ ] Enable GPU hardware decoding (hwdec=auto)
  - [ ] Core playback controls (Play, Pause, Seek, Volume, Fullscreen)
  - [ ] Sync playback progress to server (/Sessions/Playing/Progress)

- [ ] 4. Extra Media Features
  - [ ] Parse MediaStreams for UI badges (Dolby Vision, HDR10+, Atmos, DTS)
  - [ ] Intro Skip button (jumoog/Intro-Skipper timestamps integration)
  - [ ] Media segment / chapter markers on progress bar
  - [ ] Queue playback & auto-play next episode

- [ ] 5. Server Administration (Admin Users Only)
  - [ ] Detect admin users and gate the Administration nav section accordingly
  - [ ] Dashboard (server activity / stats overview)
  - [ ] Metadata Manager (edit item metadata from the client)

- [ ] 6. Nice to Haves
  - [ ] Translations
