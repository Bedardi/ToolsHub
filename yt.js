/**
 * MistaHub Universal Player SDK
 * Usage: <div class="mista-embed" data-vid="VIDEO_ID_OR_URL"></div>
 */

(function() {
    // 1. CSS Styles Injection (Automatic)
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        
        .mp-container { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'Poppins', sans-serif; user-select: none; border-radius: 12px; aspect-ratio: 16/9; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; }
        .mp-video { pointer-events: none; transform: scale(1.6); border: none; width: 100%; height: 100%; }
        .mp-poster { z-index: 5; background: #000 no-repeat center/cover; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        /* UI Layer */
        .mp-ui { z-index: 10; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(0deg, rgba(0,0,0,0.9), transparent 40%, rgba(0,0,0,0.6)); transition: opacity 0.3s; opacity: 1; }
        .mp-ui.mp-hidden { opacity: 0; pointer-events: none; }
        
        /* Buttons */
        .mp-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 5px; display: flex; align-items: center; transition: 0.2s; opacity: 0.9; }
        .mp-btn:hover { color: #e50914; transform: scale(1.1); opacity: 1; }
        .mp-icon { font-size: 28px; }
        
        /* Big Play */
        .mp-big-play { width: 60px; height: 60px; background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: 0.2s; }
        .mp-big-play:hover { background: #e50914; border-color: #e50914; }

        /* Feedback Animation */
        .mp-feedback { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70px; height: 70px; background: rgba(0,0,0,0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.2s; z-index: 20; }
        .mp-feedback.anim { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }

        /* Seek Bar */
        .mp-seek-wrap { width: 100%; height: 15px; display: flex; align-items: center; cursor: pointer; position: relative; }
        .mp-seek-bg { position: absolute; width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 10px; }
        .mp-seek-fill { position: absolute; height: 4px; background: #e50914; border-radius: 10px; width: 0%; }
        .mp-seek-thumb { position: absolute; width: 12px; height: 12px; background: #fff; border-radius: 50%; left: 0%; transform: translateX(-50%); box-shadow: 0 2px 5px black; transition: transform 0.1s; }
        .mp-seek-wrap:hover .mp-seek-thumb { transform: translateX(-50%) scale(1.3); }

        /* Spinner */
        .mp-spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #e50914; border-radius: 50%; animation: spin 1s infinite; position: absolute; top:50%; left:50%; margin:-20px; display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Menus */
        .mp-overlay { position: absolute; inset: 0; z-index: 60; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; pointer-events: none; transition: 0.3s; }
        .mp-overlay.active { opacity: 1; pointer-events: auto; }
        .mp-sheet { background: #151515; width: 100%; padding: 15px; border-radius: 15px 15px 0 0; transform: translateY(100%); transition: transform 0.3s; max-height: 60%; overflow-y: auto; }
        .mp-overlay.active .mp-sheet { transform: translateY(0); }
        .mp-item { padding: 12px; border-bottom: 1px solid #333; color: #ccc; cursor: pointer; display: flex; justify-content: space-between; font-size: 14px; }
        .mp-item.active { color: #e50914; font-weight: bold; }
        .mp-item.active::after { content: '✔'; }

        /* Double Tap */
        .mp-tap { position: absolute; top:0; bottom:0; width: 35%; z-index: 15; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; background: radial-gradient(circle, rgba(255,255,255,0.1), transparent); transition: 0.2s; }
        .mp-tap-l { left: 0; } .mp-tap-r { right: 0; }
        
        /* Layouts */
        .mp-top { padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        .mp-title { color: white; font-size: 13px; font-weight: 600; text-shadow: 0 1px 3px black; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%; }
        .mp-btm { padding: 10px 15px; display: flex; flex-direction: column; gap: 5px; }
        .mp-row { display: flex; justify-content: space-between; align-items: center; }
        .mp-grp { display: flex; align-items: center; gap: 8px; }
        .mp-time { font-size: 11px; opacity: 0.8; font-family: monospace; color:white; margin-left:5px; }
    `;

    // Inject CSS Head
    if(!document.getElementById('mista-player-css')) {
        const style = document.createElement('style');
        style.id = 'mista-player-css';
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    // 2. Main Player Class
    class MistaPlayer {
        constructor(element) {
            this.container = element;
            // Get ID from data-vid attribute
            this.rawSource = element.getAttribute('data-vid');
            this.videoId = this.extractID(this.rawSource);
            this.autoPlay = element.getAttribute('data-autoplay') === 'true';
            
            // Unique ID for this instance
            this.uid = 'mp-' + Math.random().toString(36).substr(2, 9);
            this.player = null;
            this.isPlaying = false;
            
            this.renderDOM();
            this.initYouTube();
        }

        extractID(src) {
            if(!src) return 'D-279L1219U'; // Fallback
            if(src.length === 11) return src;
            const match = src.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
            return match ? match[1] : src;
        }

        renderDOM() {
            this.container.innerHTML = `
                <div class="mp-container" id="box-${this.uid}">
                    <div class="mp-layer" style="z-index:1;"><div id="yt-${this.uid}"></div></div>
                    
                    <div class="mp-layer mp-poster" id="poster-${this.uid}" style="background-image: url('https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg');">
                        <div class="mp-big-play"><span class="material-icons-round" style="font-size:36px; color:white;">play_arrow</span></div>
                    </div>

                    <div class="mp-feedback"><span class="material-icons-round" style="font-size:40px; color:white;">play_arrow</span></div>
                    <div class="mp-tap mp-tap-l"><span class="material-icons-round" style="color:white; font-size:36px;">fast_rewind</span></div>
                    <div class="mp-tap mp-tap-r"><span class="material-icons-round" style="color:white; font-size:36px;">fast_forward</span></div>
                    <div class="mp-spinner"></div>

                    <div class="mp-layer mp-ui mp-hidden">
                        <div class="mp-top">
                            <span class="mp-title">MistaHub Player</span>
                            <button class="mp-btn"><span class="material-icons-round mp-icon">more_vert</span></button>
                        </div>
                        <div class="mp-btm">
                            <div class="mp-seek-wrap">
                                <div class="mp-seek-bg"></div>
                                <div class="mp-seek-fill"></div>
                                <div class="mp-seek-thumb"></div>
                            </div>
                            <div class="mp-row">
                                <div class="mp-grp">
                                    <button class="mp-btn" id="play-${this.uid}"><span class="material-icons-round mp-icon">play_arrow</span></button>
                                    <span class="mp-time" id="time-${this.uid}">0:00 / 0:00</span>
                                </div>
                                <div class="mp-grp">
                                    <button class="mp-btn" id="qual-${this.uid}"><span class="material-icons-round mp-icon">high_quality</span></button>
                                    <button class="mp-btn" id="spd-${this.uid}"><span class="material-icons-round mp-icon">speed</span></button>
                                    <button class="mp-btn" id="full-${this.uid}"><span class="material-icons-round mp-icon">fullscreen</span></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mp-overlay" id="menu-q-${this.uid}"><div class="mp-sheet" id="list-q-${this.uid}"></div></div>
                    <div class="mp-overlay" id="menu-s-${this.uid}"><div class="mp-sheet" id="list-s-${this.uid}"></div></div>
                </div>
            `;
            
            this.fillMenus();
            this.bindEvents();
            this.fetchTitle();
        }

        fillMenus() {
            // Quality
            const qList = ['auto', 'hd1080', 'hd720', 'large', 'medium'];
            let qHtml = '<div style="font-weight:bold;color:white;margin-bottom:10px;">Quality</div>';
            qList.forEach(q => qHtml += `<div class="mp-item ${q==='auto'?'active':''}" data-val="${q}">${q.toUpperCase()}</div>`);
            this.container.querySelector(`#list-q-${this.uid}`).innerHTML = qHtml;

            // Speed
            const sList = [0.5, 1, 1.5, 2];
            let sHtml = '<div style="font-weight:bold;color:white;margin-bottom:10px;">Speed</div>';
            sList.forEach(s => sHtml += `<div class="mp-item ${s===1?'active':''}" data-val="${s}">${s}x</div>`);
            this.container.querySelector(`#list-s-${this.uid}`).innerHTML = sHtml;
        }

        bindEvents() {
            const c = this.container;
            const poster = c.querySelector(`#poster-${this.uid}`);
            const ui = c.querySelector('.mp-ui');
            const box = c.querySelector('.mp-container');
            
            // Poster Start
            poster.addEventListener('click', () => {
                poster.style.display = 'none';
                ui.classList.remove('mp-hidden');
                this.player.playVideo();
            });

            // Play Button
            c.querySelector(`#play-${this.uid}`).addEventListener('click', () => this.togglePlay());

            // Tap & Double Tap
            let lastTap = 0;
            box.addEventListener('click', (e) => {
                if(poster.style.display !== 'none') return;
                if(e.target.closest('.mp-btn') || e.target.closest('.mp-seek-wrap') || e.target.closest('.mp-overlay')) return;

                const now = new Date().getTime();
                if(now - lastTap < 300) {
                    const width = box.offsetWidth;
                    const x = e.clientX - box.getBoundingClientRect().left;
                    if(x < width/2) this.seek(-10, '.mp-tap-l');
                    else this.seek(10, '.mp-tap-r');
                } else {
                    this.toggleUI();
                }
                lastTap = now;
            });

            // Menus
            const qMenu = c.querySelector(`#menu-q-${this.uid}`);
            const sMenu = c.querySelector(`#menu-s-${this.uid}`);
            
            c.querySelector(`#qual-${this.uid}`).addEventListener('click', () => qMenu.classList.add('active'));
            c.querySelector(`#spd-${this.uid}`).addEventListener('click', () => sMenu.classList.add('active'));
            
            // Menu Item Clicks
            [qMenu, sMenu].forEach(m => {
                m.addEventListener('click', (e) => {
                    if(e.target === m) m.classList.remove('active');
                    if(e.target.classList.contains('mp-item')) {
                        m.querySelectorAll('.mp-item').forEach(i => i.classList.remove('active'));
                        e.target.classList.add('active');
                        const val = e.target.getAttribute('data-val');
                        if(m === qMenu) this.player.setPlaybackQuality(val);
                        else this.player.setPlaybackRate(parseFloat(val));
                        m.classList.remove('active');
                    }
                });
            });

            // Seek
            const seekWrap = c.querySelector('.mp-seek-wrap');
            seekWrap.addEventListener('click', (e) => {
                const rect = seekWrap.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                this.player.seekTo(this.player.getDuration() * pct, true);
            });

            // Fullscreen
            c.querySelector(`#full-${this.uid}`).addEventListener('click', () => {
                if(!document.fullscreenElement) box.requestFullscreen();
                else document.exitFullscreen();
            });
        }

        initYouTube() {
            if(window.YT && window.YT.Player) {
                this.createPlayer();
            } else {
                // Wait for global callback if not ready
                if(!window.onYouTubeIframeAPIReady) {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    document.body.appendChild(tag);
                    window.onYouTubeIframeAPIReady = () => {
                        window.dispatchEvent(new Event('yt_ready'));
                    };
                }
                window.addEventListener('yt_ready', () => this.createPlayer());
            }
        }

        createPlayer() {
            this.player = new YT.Player(`yt-${this.uid}`, {
                videoId: this.videoId,
                playerVars: { controls:0, rel:0, playsinline:1, origin:window.location.origin },
                events: {
                    'onStateChange': (e) => this.onStateChange(e)
                }
            });
        }

        onStateChange(e) {
            const s = e.data;
            const spinner = this.container.querySelector('.mp-spinner');
            const playBtn = this.container.querySelector(`#play-${this.uid} span`);
            
            spinner.style.display = 'none';

            if(s === YT.PlayerState.PLAYING) {
                this.isPlaying = true;
                playBtn.innerText = 'pause';
                this.feedback('play_arrow');
                this.startTimer();
                this.hideUiDelay();
            } else if (s === YT.PlayerState.PAUSED) {
                this.isPlaying = false;
                playBtn.innerText = 'play_arrow';
                this.feedback('pause');
                this.container.querySelector('.mp-ui').classList.remove('mp-hidden');
                clearInterval(this.timer);
            } else if (s === YT.PlayerState.BUFFERING) {
                spinner.style.display = 'block';
            }
        }

        togglePlay() {
            if(this.isPlaying) this.player.pauseVideo();
            else this.player.playVideo();
        }

        toggleUI() {
            const ui = this.container.querySelector('.mp-ui');
            if(ui.classList.contains('mp-hidden')) {
                ui.classList.remove('mp-hidden');
                if(this.isPlaying) this.hideUiDelay();
            } else {
                if(this.isPlaying) ui.classList.add('mp-hidden');
            }
        }

        hideUiDelay() {
            clearTimeout(this.uiTimeout);
            this.uiTimeout = setTimeout(() => {
                if(this.isPlaying && !this.container.querySelector('.mp-overlay.active')) {
                    this.container.querySelector('.mp-ui').classList.add('mp-hidden');
                }
            }, 3000);
        }

        seek(sec, sel) {
            this.player.seekTo(this.player.getCurrentTime() + sec, true);
            const el = this.container.querySelector(sel);
            el.style.opacity = 1;
            setTimeout(() => el.style.opacity = 0, 400);
        }

        feedback(icon) {
            const el = this.container.querySelector('.mp-feedback');
            el.innerHTML = `<span class="material-icons-round" style="color:white;font-size:40px;">${icon}</span>`;
            el.classList.add('anim');
            setTimeout(() => el.classList.remove('anim'), 300);
        }

        startTimer() {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                if(this.player && this.player.getCurrentTime) {
                    const c = this.player.getCurrentTime();
                    const d = this.player.getDuration();
                    const pct = (c/d)*100;
                    this.container.querySelector('.mp-seek-fill').style.width = pct + '%';
                    this.container.querySelector('.mp-seek-thumb').style.left = pct + '%';
                    
                    const m = Math.floor(c/60); const ss = Math.floor(c%60);
                    const dm = Math.floor(d/60); const dss = Math.floor(d%60);
                    this.container.querySelector(`#time-${this.uid}`).innerText = 
                        `${m}:${ss<10?'0':''}${ss} / ${dm}:${dss<10?'0':''}${dss}`;
                }
            }, 500);
        }

        async fetchTitle() {
            try {
                const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${this.videoId}`);
                const d = await res.json();
                if(d.title) this.container.querySelector('.mp-title').innerText = d.title;
            } catch(e) {}
        }
    }

    // 3. Auto-Discovery Logic (The AdSense Style Magic)
    function initMistaPlayers() {
        const embeds = document.querySelectorAll('.mista-embed');
        embeds.forEach(el => {
            if(!el.getAttribute('data-init')) {
                new MistaPlayer(el);
                el.setAttribute('data-init', 'true');
            }
        });
    }

    // Run on Load
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMistaPlayers);
    } else {
        initMistaPlayers();
    }

    // Expose for manual use
    window.initMistaPlayers = initMistaPlayers;

})();
