(function() {
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        
        /* --- CONTAINER SETUP --- */
        .mp-container { 
            position: relative; width: 100%; height: 100%; background: #000; 
            overflow: hidden; font-family: 'Poppins', sans-serif; user-select: none; 
            border-radius: 12px; aspect-ratio: 16/9; box-shadow: 0 10px 40px rgba(0,0,0,0.6); 
            touch-action: manipulation; /* Prevents browser zooming on double tap */
        }
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; }

        /* --- 1. SMART CROP VIDEO (THE FIX) --- */
        /* Instead of simple scale, we oversize the wrapper and center it. */
        .mp-video-wrapper {
            position: absolute;
            top: -18%; left: -18%; width: 136%; height: 136%; /* Zoom level to hide controls */
            pointer-events: none; /* No interaction with YouTube directly */
            opacity: 0; transition: opacity 0.5s ease;
        }
        .mp-video-wrapper.active { opacity: 1; }
        .mp-video { width: 100%; height: 100%; border: none; }

        /* --- 2. CLICK INTERACTION LAYER --- */
        /* Catches all clicks for UI toggling and Double Taps */
        .mp-click-layer { z-index: 5; cursor: pointer; background: transparent; }

        /* --- 3. AD OVERLAY --- */
        .mp-ad-layer { 
            z-index: 100; background: #000; display: none; 
            flex-direction: column; align-items: center; justify-content: center;
        }
        .mp-ad-layer.active { display: flex; }
        .mp-ad-slot { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        
        .mp-skip-btn {
            position: absolute; bottom: 25px; right: 25px;
            background: rgba(0,0,0,0.8); color: #fff; border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 24px; border-radius: 4px; font-size: 13px; font-weight: 700; text-transform: uppercase;
            cursor: pointer; opacity: 0.5; pointer-events: none; transition: 0.3s;
        }
        .mp-skip-btn.ready { opacity: 1; pointer-events: auto; background: #e50914; border-color: #e50914; }

        /* --- 4. POSTER --- */
        .mp-poster { 
            z-index: 10; background: #000 no-repeat center/cover; 
            display: flex; align-items: center; justify-content: center; 
            transition: opacity 0.3s; pointer-events: none; /* Clicks pass to start button */
        }
        
        /* --- 5. UI CONTROLS --- */
        .mp-ui { 
            z-index: 20; display: flex; flex-direction: column; justify-content: space-between; 
            background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.9) 100%);
            transition: opacity 0.2s; opacity: 1; pointer-events: none;
        }
        .mp-ui.mp-hidden { opacity: 0; }
        
        /* Make Controls Clickable */
        .mp-btm, .mp-seek-wrap, .mp-btn, .mp-start-btn { pointer-events: auto; }

        .mp-start-btn {
            width: 70px; height: 70px; background: rgba(0,0,0,0.6); 
            border: 2px solid #fff; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; transition: 0.2s; z-index: 50;
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        }
        .mp-start-btn:hover { background: #e50914; border-color: #e50914; transform: translate(-50%, -50%) scale(1.1); }

        .mp-spinner {
            width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.1); 
            border-top: 3px solid #e50914; border-radius: 50%; 
            animation: spin 0.8s infinite linear; 
            position: absolute; top:50%; left:50%; margin:-25px; 
            display: none; z-index: 15; pointer-events: none;
        }

        .mp-btm { padding: 15px 20px; display: flex; flex-direction: column; gap: 8px; }
        .mp-row { display: flex; justify-content: space-between; align-items: center; }
        .mp-icon-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 5px; opacity: 0.85; transition: 0.2s; }
        .mp-icon-btn:hover { opacity: 1; transform: scale(1.1); }
        .mp-icon-btn .material-icons-round { font-size: 28px; }

        .mp-time { font-size: 12px; color: #ccc; font-weight: 500; margin-left: 10px; min-width: 80px; }

        /* SEEK BAR (Netflix Style) */
        .mp-seek-wrap { width: 100%; height: 20px; display: flex; align-items: center; cursor: pointer; position: relative; }
        .mp-seek-track { position: absolute; width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 4px; }
        .mp-seek-fill { position: absolute; width: 0%; height: 4px; background: #e50914; border-radius: 4px; }
        .mp-seek-thumb { position: absolute; left: 0%; width: 14px; height: 14px; background: #e50914; border-radius: 50%; transform: translateX(-50%) scale(0); transition: 0.1s; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .mp-seek-wrap:hover .mp-seek-thumb { transform: translateX(-50%) scale(1); }

        /* FEEDBACK (Double Tap) */
        .mp-feedback { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            width: 80px; height: 80px; background: rgba(0,0,0,0.6); border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            opacity: 0; pointer-events: none; transition: 0.2s; z-index: 30; 
            backdrop-filter: blur(4px); 
        }
        .mp-feedback.anim { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }

        /* TAP ZONES (Invisible) */
        .mp-zone { position: absolute; top:0; bottom:0; width: 35%; z-index: 6; pointer-events: none; }
        .mp-zone-l { left: 0; }
        .mp-zone-r { right: 0; }

        /* MENUS */
        .mp-sheet-bg { position: absolute; inset: 0; z-index: 200; background: rgba(0,0,0,0.6); opacity: 0; pointer-events: none; transition: 0.3s; display: flex; flex-direction: column; justify-content: flex-end; }
        .mp-sheet-bg.active { opacity: 1; pointer-events: auto; }
        .mp-sheet { background: #1a1a1a; width: 100%; max-height: 60%; border-radius: 16px 16px 0 0; padding: 10px 0; overflow-y: auto; transform: translateY(100%); transition: 0.3s; }
        .mp-sheet-bg.active .mp-sheet { transform: translateY(0); }
        .mp-menu-item { padding: 15px 20px; color: #eee; font-size: 14px; display: flex; justify-content: space-between; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .mp-menu-item.active { color: #e50914; font-weight: bold; }
        .mp-menu-item.active::after { content: '✓'; }

        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    if(!document.getElementById('mista-player-css')) {
        const s = document.createElement('style'); s.id = 'mista-player-css'; s.innerHTML = css; document.head.appendChild(s);
    }

    class MistaPlayer {
        constructor(el) {
            this.container = el;
            this.rawSource = el.getAttribute('data-vid');
            this.videoId = this.extractID(this.rawSource);
            this.uid = Math.random().toString(36).substr(2, 9);
            
            // State
            this.player = null;
            this.isPlaying = false;
            this.adWatched = false;
            this.isAdPlaying = false;
            
            this.render();
            this.initYT();
        }

        extractID(src) {
            if(!src) return 'D-279L1219U';
            let id = src.trim();
            const m = id.match(/(?:v=|\/|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/);
            return m ? m[1] : id;
        }

        render() {
            const poster = `https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg`;
            
            this.container.innerHTML = `
                <div class="mp-container" id="box-${this.uid}">
                    
                    <div class="mp-video-wrapper" id="v-wrap-${this.uid}">
                        <div id="yt-${this.uid}" class="mp-video"></div>
                    </div>

                    <div class="mp-layer mp-click-layer" id="click-${this.uid}"></div>
                    <div class="mp-layer mp-zone mp-zone-l"></div>
                    <div class="mp-layer mp-zone mp-zone-r"></div>

                    <div class="mp-layer mp-ad-layer" id="ad-layer-${this.uid}">
                        <div class="mp-ad-slot" id="ad-slot-${this.uid}"></div>
                        <div class="mp-skip-btn" id="skip-${this.uid}">Skip in 5</div>
                    </div>

                    <div class="mp-layer mp-poster" id="poster-${this.uid}" style="background-image: url('${poster}');"></div>
                    
                    <div class="mp-start-btn" id="start-${this.uid}">
                        <span class="material-icons-round" style="font-size: 40px; color: white;">play_arrow</span>
                    </div>

                    <div class="mp-spinner" id="spin-${this.uid}"></div>

                    <div class="mp-feedback" id="feed-${this.uid}"></div>

                    <div class="mp-layer mp-ui mp-hidden" id="ui-${this.uid}">
                        <div style="padding:20px; font-weight:600; color:white; pointer-events:none;"></div>
                        <div class="mp-btm">
                            <div class="mp-seek-wrap" id="seek-${this.uid}">
                                <div class="mp-seek-track"></div>
                                <div class="mp-seek-fill"></div>
                                <div class="mp-seek-thumb"></div>
                            </div>
                            <div class="mp-row">
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <button class="mp-icon-btn" id="play-${this.uid}"><span class="material-icons-round">play_arrow</span></button>
                                    <span class="mp-time" id="time-${this.uid}">0:00 / 0:00</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:0px;">
                                    <button class="mp-icon-btn" id="q-btn-${this.uid}"><span class="material-icons-round">high_quality</span></button>
                                    <button class="mp-icon-btn" id="s-btn-${this.uid}"><span class="material-icons-round">speed</span></button>
                                    <button class="mp-icon-btn" id="fs-btn-${this.uid}"><span class="material-icons-round">fullscreen</span></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mp-sheet-bg" id="menu-q-${this.uid}"><div class="mp-sheet" id="list-q-${this.uid}"></div></div>
                    <div class="mp-sheet-bg" id="menu-s-${this.uid}"><div class="mp-sheet" id="list-s-${this.uid}"></div></div>
                </div>
            `;
            
            this.fillMenus();
            this.attachEvents();
        }

        fillMenus() {
            // Quality
            const qList = ['auto', 'hd1080', 'hd720', 'large', 'medium', 'small'];
            const qHTML = qList.map(q => `<div class="mp-menu-item ${q==='auto'?'active':''}" data-val="${q}">${q.toUpperCase()}</div>`).join('');
            this.container.querySelector(`#list-q-${this.uid}`).innerHTML = `<div style="padding:15px 20px; font-weight:bold; color:white;">Quality</div>` + qHTML;

            // Speed
            const sList = [0.5, 1, 1.25, 1.5, 2];
            const sHTML = sList.map(s => `<div class="mp-menu-item ${s===1?'active':''}" data-val="${s}">${s}x Normal</div>`).join('');
            this.container.querySelector(`#list-s-${this.uid}`).innerHTML = `<div style="padding:15px 20px; font-weight:bold; color:white;">Playback Speed</div>` + sHTML;
        }

        attachEvents() {
            const c = this.container;
            const clickLayer = c.querySelector(`#click-${this.uid}`);
            
            // 1. START LOGIC (Ad -> Video)
            c.querySelector(`#start-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                if(!this.adWatched) this.playAd();
                else this.playVideo();
            });

            // 2. SKIP AD
            c.querySelector(`#skip-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeAd();
            });

            // 3. PLAY/PAUSE
            c.querySelector(`#play-${this.uid}`).addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });

            // 4. MAIN INTERACTION (Double Tap & UI Toggle)
            let lastTap = 0;
            clickLayer.addEventListener('click', (e) => {
                if(this.isAdPlaying || !this.adWatched) return;
                
                const now = new Date().getTime();
                if (now - lastTap < 300) {
                    // Double Tap
                    const width = clickLayer.offsetWidth;
                    const x = e.clientX - clickLayer.getBoundingClientRect().left;
                    if(x < width / 2) this.seek(-10); else this.seek(10);
                } else {
                    // Single Tap
                    setTimeout(() => {
                        if (new Date().getTime() - lastTap >= 300) {
                            c.querySelector(`#ui-${this.uid}`).classList.toggle('mp-hidden');
                        }
                    }, 305);
                }
                lastTap = now;
            });

            // 5. SEEKBAR
            const seekWrap = c.querySelector(`#seek-${this.uid}`);
            seekWrap.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = seekWrap.getBoundingClientRect();
                const p = (e.clientX - rect.left) / rect.width;
                this.player.seekTo(this.player.getDuration() * p, true);
            });

            // 6. FULLSCREEN
            c.querySelector(`#fs-btn-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                const box = c.querySelector(`#box-${this.uid}`);
                if (!document.fullscreenElement) box.requestFullscreen(); else document.exitFullscreen();
            });

            // 7. MENUS
            this.setupMenu('q');
            this.setupMenu('s');
        }

        setupMenu(type) {
            const btn = this.container.querySelector(`#${type}-btn-${this.uid}`);
            const menu = this.container.querySelector(`#menu-${type}-${this.uid}`);
            
            btn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.add('active'); this.container.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden'); });
            
            menu.addEventListener('click', (e) => {
                if(e.target === menu) menu.classList.remove('active');
                if(e.target.classList.contains('mp-menu-item')) {
                    e.stopPropagation();
                    const val = e.target.getAttribute('data-val');
                    menu.querySelectorAll('.mp-menu-item').forEach(el => el.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    if(type === 'q') this.player.setPlaybackQuality(val);
                    else this.player.setPlaybackRate(parseFloat(val));
                    
                    menu.classList.remove('active');
                }
            });
        }

        // --- AD LOGIC ---
        playAd() {
            this.isAdPlaying = true;
            const adLayer = this.container.querySelector(`#ad-layer-${this.uid}`);
            const adSlot = this.container.querySelector(`#ad-slot-${this.uid}`);
            
            // Hide Start Button
            this.container.querySelector(`#start-${this.uid}`).style.display = 'none';
            adLayer.classList.add('active');

            // Inject Script
            adSlot.innerHTML = `<div class="mista-ad" data-cat="Entertainment" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;">Loading Ad...</div>`;
            const s = document.createElement('script');
            s.type = 'module';
            s.src = "https://MistaFy.pages.dev/ads.js?" + Math.random();
            adSlot.appendChild(s);

            // Timer
            let count = 5;
            const skipBtn = this.container.querySelector(`#skip-${this.uid}`);
            skipBtn.innerText = `Skip in ${count}`;
            skipBtn.classList.remove('ready');

            const t = setInterval(() => {
                count--;
                if(count > 0) skipBtn.innerText = `Skip in ${count}`;
                else {
                    clearInterval(t);
                    skipBtn.innerText = "SKIP AD";
                    skipBtn.classList.add('ready');
                }
            }, 1000);
        }

        closeAd() {
            this.container.querySelector(`#ad-layer-${this.uid}`).classList.remove('active');
            this.container.querySelector(`#ad-slot-${this.uid}`).innerHTML = ""; // Kill Ad
            this.isAdPlaying = false;
            this.adWatched = true;
            this.playVideo();
        }

        playVideo() {
            this.container.querySelector(`#poster-${this.uid}`).style.display = 'none';
            this.container.querySelector(`#start-${this.uid}`).style.display = 'none';
            this.container.querySelector(`#spin-${this.uid}`).style.display = 'block';
            this.player.playVideo();
        }

        // --- YOUTUBE LOGIC ---
        initYT() {
            if(window.YT && window.YT.Player) this.createPlayer();
            else {
                const t = document.createElement('script'); t.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(t);
                window.onYouTubeIframeAPIReady = () => this.createPlayer();
            }
        }

        createPlayer() {
            this.player = new YT.Player(`yt-${this.uid}`, {
                videoId: this.videoId,
                playerVars: { 
                    controls: 0, rel: 0, playsinline: 1, 
                    iv_load_policy: 3, fs: 0, disablekb: 1, 
                    modestbranding: 1, origin: window.location.origin 
                },
                events: { 'onStateChange': (e) => this.onState(e) }
            });
        }

        onState(e) {
            const s = e.data;
            const spin = this.container.querySelector(`#spin-${this.uid}`);
            const vWrap = this.container.querySelector(`#v-wrap-${this.uid}`);
            const btn = this.container.querySelector(`#play-${this.uid} span`);

            spin.style.display = 'none';

            if(s === YT.PlayerState.PLAYING) {
                this.isPlaying = true;
                vWrap.classList.add('active'); // Show Video NOW
                btn.innerText = 'pause';
                this.startLoop();
                // Auto Hide UI
                setTimeout(() => { if(this.isPlaying) this.container.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden'); }, 2000);
            } else if (s === YT.PlayerState.PAUSED) {
                this.isPlaying = false;
                btn.innerText = 'play_arrow';
                this.container.querySelector(`#ui-${this.uid}`).classList.remove('mp-hidden');
            } else if (s === YT.PlayerState.BUFFERING) {
                spin.style.display = 'block';
            }
        }

        toggle() { if(this.isPlaying) this.player.pauseVideo(); else this.player.playVideo(); }

        seek(sec) {
            const cur = this.player.getCurrentTime();
            this.player.seekTo(cur + sec, true);
            this.showFeed(sec > 0 ? 'fast_forward' : 'fast_rewind');
        }

        showFeed(icon) {
            const el = this.container.querySelector(`#feed-${this.uid}`);
            el.innerHTML = `<span class="material-icons-round" style="color:white;font-size:40px;">${icon}</span>`;
            el.classList.add('anim'); setTimeout(() => el.classList.remove('anim'), 300);
        }

        startLoop() {
            setInterval(() => {
                if(this.player && this.player.getCurrentTime) {
                    const c = this.player.getCurrentTime();
                    const d = this.player.getDuration();
                    const p = (c/d)*100;
                    this.container.querySelector('.mp-seek-fill').style.width = p + '%';
                    this.container.querySelector('.mp-seek-thumb').style.left = p + '%';
                    
                    const fmt = (t) => { const m=Math.floor(t/60), s=Math.floor(t%60); return `${m}:${s<10?'0':''}${s}`; };
                    this.container.querySelector(`#time-${this.uid}`).innerText = `${fmt(c)} / ${fmt(d)}`;
                }
            }, 500);
        }
    }

    const init = () => {
        document.querySelectorAll('.mista-embed').forEach(el => {
            if(!el.getAttribute('data-init')) { new MistaPlayer(el); el.setAttribute('data-init', 'true'); }
        });
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
