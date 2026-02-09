(function() {
    // #1. ULTIMATE M3 PLAYER CSS
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

        :root {
            --m3-surface: #1C1B1F;
            --m3-on-surface: #E6E1E5;
            --m3-primary: #D0BCFF;
            --m3-secondary: #CCC2DC;
            --m3-tertiary: #EFB8C8;
            --m3-outline: #938F99;
            --m3-error: #F2B8B5;
            --m3-success: #67D974;
        }

        .mp-container { 
            position: relative; width: 100%; background: #000; 
            overflow: hidden; font-family: 'Roboto', sans-serif; 
            border-radius: 28px; aspect-ratio: 16/9; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            touch-action: none; user-select: none;
            cursor: var(--mp-cursor, default);
        }
        .mp-container.mp-hide-cursor { cursor: none; }

        /* Core Layers */
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; display: flex; }
        .mp-video-wrap { z-index: 1; opacity: 0; transition: opacity 0.6s ease; pointer-events: none; }
        .mp-video-wrap.active { opacity: 1; pointer-events: auto; }
        .mp-video { width: 100%; height: 100%; transform: scale(1.05); }

        /* M3 UI Overlay */
        .mp-ui { 
            z-index: 10; background: linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 60%, rgba(0,0,0,0.7) 100%);
            flex-direction: column; justify-content: space-between;
            opacity: 1; transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mp-ui.mp-hidden { opacity: 0; pointer-events: none; transform: translateY(10px); }

        /* Top Bar */
        .mp-top-bar { padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .mp-title { color: var(--m3-on-surface); font-size: 1.1rem; font-weight: 500; max-width: 70%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

        /* Controls Group */
        .mp-controls-bottom { padding: 0 20px 20px 20px; }
        .mp-row { display: flex; justify-content: space-between; align-items: center; }
        .mp-grp { display: flex; align-items: center; gap: 8px; }

        /* Buttons */
        .mp-btn { 
            background: none; border: none; color: white; cursor: pointer; 
            width: 48px; height: 48px; border-radius: 24px; transition: background 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .mp-btn:hover { background: rgba(255,255,255,0.1); }
        .mp-btn .material-icons-round { font-size: 28px; }

        /* Time Display */
        .mp-time { color: var(--m3-on-surface); font-size: 0.85rem; margin-left: 8px; font-variant-numeric: tabular-nums; opacity: 0.9; }

        /* M3 Seekbar */
        .mp-seek-wrap { 
            width: 100%; height: 28px; display: flex; align-items: center; cursor: pointer; 
            position: relative; margin-bottom: 8px; z-index: 20;
        }
        .mp-seek-bg { position: absolute; width: 100%; height: 4px; background: rgba(255,255,255,0.2); border-radius: 10px; }
        .mp-buffer-bar { position: absolute; height: 4px; background: rgba(255,255,255,0.3); border-radius: 10px; width: 0%; transition: width 0.3s; }
        .mp-seek-fill { position: absolute; height: 4px; background: var(--m3-primary); border-radius: 10px; width: 0%; }
        .mp-seek-thumb { 
            position: absolute; width: 18px; height: 18px; background: var(--m3-primary); 
            border-radius: 50%; left: 0%; transform: translateX(-50%) scale(0); 
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 10px rgba(0,0,0,0.6);
        }
        .mp-seek-wrap:hover .mp-seek-thumb, .mp-seek-wrap.dragging .mp-seek-thumb { transform: translateX(-50%) scale(1); }
        .mp-seek-wrap:hover .mp-seek-bg, .mp-seek-wrap:hover .mp-seek-fill, .mp-seek-wrap:hover .mp-buffer-bar { height: 6px; }

        /* Settings Bottom Sheet */
        .mp-settings-sheet {
            position: absolute; bottom: 0; left: 0; right: 0; background: #2B2930;
            border-radius: 28px 28px 0 0; padding: 20px; z-index: 100; max-height: 80vh;
            transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 -5px 20px rgba(0,0,0,0.5); overflow-y: auto;
        }
        .mp-settings-sheet.active { transform: translateY(0); }
        .mp-settings-title { color: var(--m3-on-surface); font-weight: 700; font-size: 1.2rem; margin-bottom: 20px; padding-left: 10px; }
        .mp-setting-group { margin-bottom: 24px; }
        .mp-setting-label { color: var(--m3-outline); font-size: 0.9rem; margin-bottom: 10px; padding-left: 10px; }
        .mp-setting-item {
            padding: 14px 20px; border-radius: 16px; color: var(--m3-on-surface); cursor: pointer;
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;
            transition: background 0.2s; font-size: 0.95rem;
        }
        .mp-setting-item:hover { background: rgba(208, 188, 255, 0.1); }
        .mp-setting-item.selected { background: var(--m3-primary); color: #381E72; font-weight: bold; }
        .mp-setting-item .material-icons-round { color: inherit; font-size: 20px; margin-right: 8px; }

        /* Volume Slider */
        .mp-volume-slider-wrap { display: flex; align-items: center; gap: 10px; padding: 10px; }
        .mp-volume-slider { flex-grow: 1; height: 8px; appearance: none; background: rgba(255,255,255,0.2); border-radius: 4px; }
        .mp-volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
            background: var(--m3-primary); cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.4);
        }
        .mp-volume-slider::-moz-range-thumb {
            width: 18px; height: 18px; border-radius: 50%;
            background: var(--m3-primary); cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.4);
        }
        .mp-volume-value { color: var(--m3-on-surface); font-size: 0.9rem; width: 40px; text-align: right; }

        /* Gesture Indicators (Pills) */
        .mp-gesture-pill {
            position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(43, 41, 48, 0.9); color: var(--m3-primary);
            padding: 10px 20px; border-radius: 24px; display: flex; align-items: center;
            gap: 10px; font-size: 1rem; opacity: 0; transition: opacity 0.3s, transform 0.3s; z-index: 100;
        }
        .mp-brightness-overlay {
            position: absolute; inset: 0; background: black; opacity: 0; pointer-events: none; z-index: 5;
        }

        /* Double Tap Hints */
        .mp-tap-hint {
            position: absolute; top: 0; width: 35%; height: 100%; 
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s, transform 0.3s; z-index: 5; color: white;
            background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
        }
        .mp-tap-hint span:first-child { font-size: 60px; }
        .mp-tap-hint span:last-child { font-size: 1.2rem; font-weight: 500; margin-top: 5px; }
        .mp-tap-hint.active { opacity: 1; transform: scale(1.1); }
        
        /* Loader */
        .mp-loader {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 60px; height: 60px; border: 5px solid rgba(255,255,255,0.1);
            border-top-color: var(--m3-primary); border-radius: 50%; animation: spin 0.8s infinite linear;
            display: none; z-index: 30;
        }
        @keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
    `;

    // #2. IndexedDB for Persistence (Re-using the excellent MistaDB)
    class MistaDB {
        constructor() { this.dbName = "MistaPlayerDB"; this.version = 1; }
        async init() {
            return new Promise((res) => {
                let req = indexedDB.open(this.dbName, this.version);
                req.onupgradeneeded = (e) => { 
                    let db = e.target.result;
                    if (!db.objectStoreNames.contains("progress")) db.createObjectStore("progress");
                    if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings");
                };
                req.onsuccess = (e) => { this.db = e.target.result; res(); };
            });
        }
        async set(store, id, val) { 
            if(!this.db) return;
            let tx = this.db.transaction(store, "readwrite");
            tx.objectStore(store).put(val, id);
        }
        async get(store, id) {
            return new Promise((res) => {
                if(!this.db) return res(null);
                let tx = this.db.transaction(store, "readonly");
                let req = tx.objectStore(store).get(id);
                req.onsuccess = () => res(req.result);
            });
        }
    }

    // Load CSS once
    if(!document.getElementById('m3-ott-style')) {
        const s = document.createElement('style'); s.id='m3-ott-style'; s.innerHTML=css; document.head.appendChild(s);
    }

    // #3. The ULTIMATE MistaPlayer Class
    class MistaPlayer {
        constructor(el) {
            this.container = el;
            this.vid = this.extractID(el.getAttribute('data-vid'));
            this.uid = Math.random().toString(36).substr(2, 5); // Unique ID for elements
            this.db = new MistaDB();

            this.player = null; // YouTube Player instance
            this.isPlaying = false;
            this.isDragging = false; // For seekbar
            this.isGestureActive = false; // For mobile gestures
            this.resumeTime = 0; // Where to resume after quality change
            this.currentVolume = 100;
            this.currentBrightness = 100; // 0-100, 100 is full brightness

            // Default & Persistent Settings
            this.settings = {
                quality: 'default',
                speed: 1
            };
            
            this.uiTimeout = null; // For auto-hide UI
            this.gesturePillTimeout = null; // For gesture feedback pill

            this.init();
        }

        extractID(s) { 
            const m = s.match(/(?:v=|\/|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/); 
            return m ? m[1] : s; 
        }

        async init() {
            await this.db.init();
            await this.loadPersistentSettings();
            this.render();
            this.setupYT();
        }

        async loadPersistentSettings() {
            const savedProgress = await this.db.get('progress', this.vid);
            if(savedProgress) this.resumeTime = savedProgress;

            const savedSettings = await this.db.get('settings', 'global');
            if(savedSettings) {
                this.settings.quality = savedSettings.quality || 'default';
                this.settings.speed = savedSettings.speed || 1;
            }
        }

        // RENDER function (The heart of the UI)
        render() {
            this.container.innerHTML = `
                <div class="mp-container" id="box-${this.uid}">
                    <div class="mp-brightness-overlay" id="br-overlay-${this.uid}"></div>
                    <div class="mp-layer mp-video-wrap" id="video-wrap-${this.uid}"><div id="yt-player-${this.uid}" class="mp-video"></div></div>
                    
                    <div class="mp-loader" id="loader-${this.uid}"></div>
                    <div class="mp-gesture-pill" id="gesture-pill-${this.uid}">
                        <span class="material-icons-round">volume_up</span><span class="val">100%</span>
                    </div>

                    <div class="mp-tap-hint" style="left:0;" id="tap-l-${this.uid}"><span class="material-icons-round">fast_rewind</span><span>-10s</span></div>
                    <div class="mp-tap-hint" style="right:0;" id="tap-r-${this.uid}"><span class="material-icons-round">fast_forward</span><span>+10s</span></div>

                    <div class="mp-layer mp-ui" id="ui-${this.uid}">
                        <div class="mp-top-bar">
                            <div class="mp-title" id="title-${this.uid}">Loading Video...</div>
                            <button class="mp-btn" id="pip-btn-${this.uid}"><span class="material-icons-round">picture_in_picture_alt</span></button>
                        </div>
                        
                        <div class="mp-controls-bottom">
                            <div class="mp-seek-wrap" id="seek-wrap-${this.uid}">
                                <div class="mp-seek-bg"></div>
                                <div class="mp-buffer-bar" id="buffer-bar-${this.uid}"></div>
                                <div class="mp-seek-fill" id="seek-fill-${this.uid}"></div>
                                <div class="mp-seek-thumb" id="seek-thumb-${this.uid}"></div>
                            </div>
                            <div class="mp-row">
                                <div class="mp-grp">
                                    <button class="mp-btn" id="play-btn-${this.uid}"><span class="material-icons-round">play_arrow</span></button>
                                    <span class="mp-time" id="time-display-${this.uid}">0:00 / 0:00</span>
                                </div>
                                <div class="mp-grp">
                                    <button class="mp-btn" id="settings-btn-${this.uid}"><span class="material-icons-round">settings</span></button>
                                    <button class="mp-btn" id="fullscreen-btn-${this.uid}"><span class="material-icons-round">fullscreen</span></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mp-settings-sheet" id="settings-sheet-${this.uid}">
                        <div class="mp-settings-title">Playback Settings</div>

                        <div class="mp-setting-group">
                            <div class="mp-setting-label">Quality</div>
                            <div class="mp-setting-item" data-setting="quality" data-val="auto">Auto</div>
                            <div class="mp-setting-item" data-setting="quality" data-val="hd1080">1080p (Full HD)</div>
                            <div class="mp-setting-item" data-setting="quality" data-val="hd720">720p (HD)</div>
                            <div class="mp-setting-item" data-setting="quality" data-val="large">480p</div>
                            <div class="mp-setting-item" data-setting="quality" data-val="medium">360p</div>
                        </div>

                        <div class="mp-setting-group">
                            <div class="mp-setting-label">Playback Speed</div>
                            <div class="mp-setting-item" data-setting="speed" data-val="0.5">0.5x</div>
                            <div class="mp-setting-item" data-setting="speed" data-val="1">Normal (1x)</div>
                            <div class="mp-setting-item" data-setting="speed" data-val="1.5">1.5x</div>
                            <div class="mp-setting-item" data-setting="speed" data-val="2">2x</div>
                        </div>

                        <div class="mp-setting-group">
                            <div class="mp-setting-label">Volume</div>
                            <div class="mp-volume-slider-wrap">
                                <span class="material-icons-round" id="volume-icon-${this.uid}">volume_up</span>
                                <input type="range" min="0" max="100" value="100" class="mp-volume-slider" id="volume-slider-${this.uid}">
                                <span class="mp-volume-value" id="volume-value-${this.uid}">100%</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.applyInitialSettingsToUI();
            this.bindEvents();
        }

        applyInitialSettingsToUI() {
            const sheet = this.container.querySelector(`#settings-sheet-${this.uid}`);
            // Apply Quality
            sheet.querySelector(`.mp-setting-item[data-setting="quality"][data-val="${this.settings.quality}"]`).classList.add('selected');
            // Apply Speed
            sheet.querySelector(`.mp-setting-item[data-setting="speed"][data-val="${this.settings.speed}"]`).classList.add('selected');
            // Apply Volume (Set default to 100%)
            this.container.querySelector(`#volume-slider-${this.uid}`).value = this.currentVolume;
            this.container.querySelector(`#volume-value-${this.uid}`).innerText = `${this.currentVolume}%`;
        }

        // #4. YouTube Player Setup
        setupYT() {
            const createPlayer = () => {
                this.player = new YT.Player(`yt-player-${this.uid}`, {
                    videoId: this.vid,
                    playerVars: { 
                        controls: 0, rel: 0, modestbranding: 1, playsinline: 1, 
                        autoplay: 0, suggestedQuality: this.settings.quality 
                    },
                    events: { 
                        onReady: (e) => this.onPlayerReady(e),
                        onStateChange: (e) => this.onPlayerStateChange(e)
                    }
                });
            };
            if(window.YT) createPlayer(); else window.addEventListener('yt_ready', createPlayer);
        }

        onPlayerReady(e) {
            this.container.querySelector(`#title-${this.uid}`).innerText = this.player.getVideoData().title;
            if(this.resumeTime > 0) this.player.seekTo(this.resumeTime, true);
            this.player.setVolume(this.currentVolume); // Set initial volume
            this.player.setPlaybackRate(this.settings.speed); // Set initial speed
            this.container.querySelector(`#video-wrap-${this.uid}`).classList.add('active');
            this.hideLoader();
        }

        onPlayerStateChange(e) {
            const playBtnIcon = this.container.querySelector(`#play-btn-${this.uid} span`);
            const loader = this.container.querySelector(`#loader-${this.uid}`);
            const ui = this.container.querySelector(`#ui-${this.uid}`);

            if(e.data == YT.PlayerState.PLAYING) {
                this.isPlaying = true;
                playBtnIcon.innerText = 'pause';
                this.startPlayerLoop();
                this.resetUIHideTimeout(); // Start auto-hide UI
                loader.style.display = 'none';
                ui.classList.remove('mp-hidden'); // Ensure UI visible when playing starts
            } else if (e.data == YT.PlayerState.PAUSED) {
                this.isPlaying = false;
                playBtnIcon.innerText = 'play_arrow';
                clearInterval(this.playerLoop);
                this.resetUIHideTimeout(); // Show UI if paused
                ui.classList.remove('mp-hidden');
            } else if (e.data == YT.PlayerState.BUFFERING) {
                loader.style.display = 'block';
            } else if (e.data == YT.PlayerState.ENDED) {
                this.isPlaying = false;
                playBtnIcon.innerText = 'replay'; // Show replay icon
                clearInterval(this.playerLoop);
                this.container.querySelector(`#seek-fill-${this.uid}`).style.width = '100%';
                this.container.querySelector(`#seek-thumb-${this.uid}`).style.left = '100%';
                ui.classList.remove('mp-hidden'); // Show UI when ended
            }
        }

        startPlayerLoop() {
            clearInterval(this.playerLoop);
            this.playerLoop = setInterval(async () => {
                const cur = this.player.getCurrentTime();
                const dur = this.player.getDuration();
                const buf = this.player.getVideoLoadedFraction() * 100;
                const pct = (cur/dur) * 100;

                this.updateSeekUI(pct, buf);
                this.updateTimeDisplay(cur, dur);

                // Save progress every 5 seconds
                if(Math.floor(cur) % 5 === 0) await this.db.set('progress', this.vid, cur);
            }, 500);
        }

        updateSeekUI(playPct, bufferPct) {
            this.container.querySelector(`#seek-fill-${this.uid}`).style.width = playPct + '%';
            this.container.querySelector(`#seek-thumb-${this.uid}`).style.left = playPct + '%';
            this.container.querySelector(`#buffer-bar-${this.uid}`).style.width = bufferPct + '%';
        }

        updateTimeDisplay(currentTime, duration) {
            const fmt = s => new Date(s * 1000).toISOString().substr(duration >= 3600 ? 11 : 14, duration >= 3600 ? 8 : 5);
            this.container.querySelector(`#time-display-${this.uid}`).innerText = `${fmt(currentTime)} / ${fmt(duration)}`;
        }

        resetUIHideTimeout() {
            clearTimeout(this.uiTimeout);
            const ui = this.container.querySelector(`#ui-${this.uid}`);
            const sheet = this.container.querySelector(`#settings-sheet-${this.uid}`);
            const box = this.container.querySelector(`#box-${this.uid}`);

            if(this.isPlaying && !sheet.classList.contains('active')) {
                ui.classList.remove('mp-hidden');
                box.classList.remove('mp-hide-cursor');
                this.uiTimeout = setTimeout(() => {
                    ui.classList.add('mp-hidden');
                    box.classList.add('mp-hide-cursor');
                }, 3000); // Hide UI after 3 seconds of inactivity
            } else {
                ui.classList.remove('mp-hidden');
                box.classList.remove('mp-hide-cursor');
            }
        }

        hideLoader() {
            this.container.querySelector(`#loader-${this.uid}`).style.display = 'none';
        }

        showGesturePill(icon, valueText) {
            const pill = this.container.querySelector(`#gesture-pill-${this.uid}`);
            pill.querySelector('.material-icons-round').innerText = icon;
            pill.querySelector('.val').innerText = valueText;
            pill.style.opacity = 1;
            clearTimeout(this.gesturePillTimeout);
            this.gesturePillTimeout = setTimeout(() => pill.style.opacity = 0, 800);
        }

        showTapHint(id) {
            const el = this.container.querySelector(id);
            el.classList.add('active');
            setTimeout(() => el.classList.remove('active'), 500);
        }

        // #5. Event Binding (All interactions here)
        bindEvents() {
            const c = this.container;
            const box = c.querySelector(`#box-${this.uid}`);
            const ui = c.querySelector(`#ui-${this.uid}`);
            const seekWrap = c.querySelector(`#seek-wrap-${this.uid}`);
            const settingsSheet = c.querySelector(`#settings-sheet-${this.uid}`);
            const volumeSlider = c.querySelector(`#volume-slider-${this.uid}`);
            const volumeIcon = c.querySelector(`#volume-icon-${this.uid}`);
            const volumeValue = c.querySelector(`#volume-value-${this.uid}`);

            // UI Interaction Reset Timer
            box.addEventListener('mousemove', () => this.resetUIHideTimeout());
            box.addEventListener('click', () => this.resetUIHideTimeout());

            // Play/Pause Button
            c.querySelector(`#play-btn-${this.uid}`).onclick = () => {
                if(this.player.getPlayerState() == YT.PlayerState.PLAYING) this.player.pauseVideo();
                else this.player.playVideo();
            };

            // Fullscreen Button
            c.querySelector(`#fullscreen-btn-${this.uid}`).onclick = () => {
                if(!document.fullscreenElement) box.requestFullscreen(); else document.exitFullscreen();
            };

            // Picture-in-Picture Button
            c.querySelector(`#pip-btn-${this.uid}`).onclick = async () => {
                if(document.pictureInPictureEnabled) {
                    await this.player.getIframe().requestPictureInPicture();
                } else {
                    alert("Picture-in-Picture is not supported by your browser.");
                }
            };

            // Seekbar Dragging / Scrubbing
            let isSeeking = false;
            const handleSeek = (e) => {
                const rect = seekWrap.getBoundingClientRect();
                const x = (e.clientX || e.touches[0].clientX) - rect.left;
                const pct = Math.min(Math.max(0, x / rect.width), 1);
                
                this.updateSeekUI(pct * 100, this.player.getVideoLoadedFraction() * 100);
                if(isSeeking && this.player) {
                    this.player.seekTo(this.player.getDuration() * pct, true);
                }
            };
            seekWrap.addEventListener('mousedown', (e) => { isSeeking = true; seekWrap.classList.add('dragging'); handleSeek(e); });
            window.addEventListener('mouseup', () => { isSeeking = false; seekWrap.classList.remove('dragging'); });
            window.addEventListener('mousemove', (e) => { if(isSeeking) handleSeek(e); });
            seekWrap.addEventListener('touchstart', (e) => { isSeeking = true; seekWrap.classList.add('dragging'); handleSeek(e); });
            window.addEventListener('touchend', () => { isSeeking = false; seekWrap.classList.remove('dragging'); });
            window.addEventListener('touchmove', (e) => { if(isSeeking) handleSeek(e); });

            // Unified Settings Sheet Toggle
            c.querySelector(`#settings-btn-${this.uid}`).onclick = () => {
                settingsSheet.classList.toggle('active');
                this.resetUIHideTimeout(); // Keep UI visible while settings open
            };
            // Close settings by clicking outside or on sheet itself
            settingsSheet.addEventListener('click', (e) => {
                if (e.target === settingsSheet) settingsSheet.classList.remove('active');
            });

                        // Settings Items (Quality & Speed) logic continue...
            settingsSheet.querySelectorAll('.mp-setting-item').forEach(item => {
                item.onclick = async () => {
                    const type = item.dataset.setting;
                    const val = item.dataset.val;

                    // UI Update
                    settingsSheet.querySelectorAll(`.mp-setting-item[data-setting="${type}"]`).forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');

                    if (type === 'quality') {
                        this.settings.quality = val;
                        const curTime = this.player.getCurrentTime();
                        this.container.querySelector(`#loader-${this.uid}`).style.display = 'block';
                        // Force quality change by reloading video at same timestamp
                        this.player.loadVideoById({
                            videoId: this.vid,
                            startSeconds: curTime,
                            suggestedQuality: val
                        });
                    } else if (type === 'speed') {
                        const speedVal = parseFloat(val);
                        this.settings.speed = speedVal;
                        this.player.setPlaybackRate(speedVal);
                    }

                    // Save settings globally in IndexedDB
                    await this.db.set('settings', 'global', this.settings);
                    setTimeout(() => settingsSheet.classList.remove('active'), 300);
                };
            });

            // Volume Slider in Settings
            volumeSlider.oninput = (e) => {
                const val = e.target.value;
                this.currentVolume = val;
                this.player.setVolume(val);
                volumeValue.innerText = `${val}%`;
                volumeIcon.innerText = val == 0 ? 'volume_off' : (val < 50 ? 'volume_down' : 'volume_up');
            };

            // --- ADVANCED GESTURES (Volume, Brightness & Double Tap) ---
            let startY = 0, startVal = 0, gType = "";
            
            box.addEventListener('touchstart', (e) => {
                if (e.target.closest('.mp-btn') || e.target.closest('.mp-settings-sheet')) return;
                
                // Double Tap logic
                const now = Date.now();
                const tapInterval = now - (this.lastTap || 0);
                if (tapInterval < 300) {
                    const x = e.touches[0].clientX - box.getBoundingClientRect().left;
                    if (x < box.offsetWidth / 2) {
                        this.player.seekTo(this.player.getCurrentTime() - 10);
                        this.showTapHint(`#tap-l-${this.uid}`);
                    } else {
                        this.player.seekTo(this.player.getCurrentTime() + 10);
                        this.showTapHint(`#tap-r-${this.uid}`);
                    }
                    this.lastTap = 0; // Reset
                    return;
                }
                this.lastTap = now;

                // Swipe Gesture Start
                startY = e.touches[0].clientY;
                const x = e.touches[0].clientX - box.getBoundingClientRect().left;
                gType = x < box.offsetWidth / 2 ? "brightness" : "volume";
                
                if (gType === "volume") startVal = this.player.getVolume();
                else startVal = this.currentBrightness;
                
                this.isGestureActive = true;
            });

            box.addEventListener('touchmove', (e) => {
                if (!this.isGestureActive) return;
                const deltaY = startY - e.touches[0].clientY;
                const sensitivity = 0.5; 
                let newVal = Math.min(Math.max(0, startVal + (deltaY * sensitivity)), 100);

                if (gType === "volume") {
                    this.player.setVolume(newVal);
                    this.currentVolume = newVal;
                    volumeSlider.value = newVal; // Sync settings slider
                    this.showGesturePill(newVal == 0 ? "volume_off" : "volume_up", Math.round(newVal) + "%");
                } else {
                    this.currentBrightness = newVal;
                    const opacity = 1 - (newVal / 100);
                    c.querySelector(`#br-overlay-${this.uid}`).style.opacity = opacity * 0.8; // Max 80% dimming
                    this.showGesturePill("brightness_6", Math.round(newVal) + "%");
                }
            });

            window.addEventListener('touchend', () => { this.isGestureActive = false; });
        }
    }

    // --- INITIALIZATION ---
    const startMista = () => {
        document.querySelectorAll('.mista-embed').forEach(el => {
            if (!el.dataset.init) {
                new MistaPlayer(el);
                el.dataset.init = "true";
            }
        });
    };

    if (window.YT && window.YT.Player) {
        startMista();
    } else {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => startMista();
    }
})();

