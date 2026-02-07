(function() {
    // 1. CSS Styles (Fixed: Added Click Shield to block YouTube Native Overlay)
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        
        .mp-container { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'Poppins', sans-serif; user-select: none; border-radius: 12px; aspect-ratio: 16/9; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; }
        
        /* Video & Poster */
        .mp-video-wrap { z-index: 1; pointer-events: none; opacity: 0; transition: opacity 0.4s ease-in; }
        .mp-video-wrap.active { opacity: 1; }
        /* Pointer events none on iframe ensures clicks pass to the shield */
        .mp-video { width: 100%; height: 100%; transform: scale(1.01); border: none; pointer-events: none; } 
        .mp-poster { z-index: 6; background: #000 no-repeat center/cover; display: flex; align-items: center; justify-content: center; transition: opacity 0.3s; }
        
        /* CLICK SHIELD (The Fix) */
        /* This layer sits above video but below controls. It catches ALL clicks so YouTube doesn't see them. */
        .mp-click-shield { position: absolute; inset: 0; z-index: 5; background: transparent; cursor: pointer; }

        /* ADS LAYER */
        .mp-ad-layer { 
            position: absolute; inset: 0; z-index: 100; background: #000; 
            display: none; flex-direction: column; align-items: center; justify-content: center; 
        }
        .mp-ad-layer.active { display: flex; }
        .mp-ad-content { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 101; }
        
        .mp-skip-btn {
            position: absolute; bottom: 20px; right: 20px; z-index: 102;
            background: rgba(0,0,0,0.8); color: white; border: 1px solid rgba(255,255,255,0.2);
            padding: 8px 20px; border-radius: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
            cursor: pointer; pointer-events: none; opacity: 0.6; transition: 0.2s;
        }
        .mp-skip-btn.ready { pointer-events: auto; opacity: 1; background: #e50914; border-color: #e50914; }

        /* UI */
        .mp-ui { z-index: 20; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(0deg, rgba(0,0,0,0.95), transparent 35%, rgba(0,0,0,0.8)); transition: opacity 0.3s; opacity: 1; pointer-events: none; }
        .mp-ui.mp-hidden { opacity: 0; }
        /* Enable clicks only on interactive elements inside UI */
        .mp-btm, .mp-seek-wrap, .mp-btn { pointer-events: auto; }

        /* Components */
        .mp-big-play { width: 70px; height: 70px; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); cursor: pointer; transition: transform 0.2s; z-index: 7; pointer-events: auto; }
        .mp-big-play:hover { background: #e50914; border-color: #e50914; transform: scale(1.1); }
        .mp-spinner { width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #e50914; border-radius: 50%; animation: spin 0.8s infinite linear; position: absolute; top:50%; left:50%; margin:-25px; display: none; z-index: 25; }
        .mp-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 8px; display: flex; opacity: 0.9; transition: 0.2s; }
        .mp-btn:hover { color: #e50914; transform: scale(1.1); opacity: 1; }
        .mp-icon { font-size: 26px; }

        /* Layouts */
        .mp-btm { padding: 15px; display: flex; flex-direction: column; gap: 8px; }
        .mp-row { display: flex; justify-content: space-between; align-items: center; }
        .mp-grp { display: flex; align-items: center; gap: 8px; }
        .mp-title { color: white; font-size: 14px; font-weight: 600; text-shadow: 0 2px 4px black; padding: 20px; max-width: 80%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; pointer-events: none; }
        .mp-time { font-size: 12px; font-weight: 500; color:#ddd; margin-left:5px; }

        /* Seek Bar */
        .mp-seek-wrap { width: 100%; height: 15px; display: flex; align-items: center; cursor: pointer; position: relative; }
        .mp-seek-bg { position: absolute; width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 10px; }
        .mp-seek-fill { position: absolute; height: 4px; background: #e50914; border-radius: 10px; width: 0%; }
        .mp-seek-thumb { position: absolute; width: 14px; height: 14px; background: #fff; border-radius: 50%; left: 0%; transform: translateX(-50%); box-shadow: 0 2px 5px black; transition: transform 0.1s; }
        .mp-seek-wrap:hover .mp-seek-thumb { transform: translateX(-50%) scale(1.3); }

        /* Feedback & Tap - Raised Z-Index */
        .mp-feedback { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.2s; z-index: 30; backdrop-filter: blur(4px); }
        .mp-feedback.anim { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        
        .mp-tap { position: absolute; top:0; bottom:0; width: 35%; z-index: 15; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.2s; }
        .mp-tap-l { left: 0; background: linear-gradient(90deg, rgba(0,0,0,0.3), transparent); } 
        .mp-tap-r { right: 0; background: linear-gradient(-90deg, rgba(0,0,0,0.3), transparent); }
        
        /* Menus */
        .mp-overlay { position: absolute; inset: 0; z-index: 110; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; pointer-events: none; transition: 0.3s; }
        .mp-overlay.active { opacity: 1; pointer-events: auto; }
        .mp-sheet { background: #1f1f1f; width: 100%; padding: 15px; border-radius: 16px 16px 0 0; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1); max-height: 70%; overflow-y: auto; box-shadow: 0 -5px 20px rgba(0,0,0,0.5); }
        .mp-overlay.active .mp-sheet { transform: translateY(0); }
        .mp-item { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #ddd; cursor: pointer; display: flex; justify-content: space-between; font-size: 14px; font-weight: 500; }
        .mp-item:last-child { border-bottom: none; }
        .mp-item.active { color: #e50914; font-weight: 700; }
        .mp-item.active::after { content: '✓'; }

        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    if(!document.getElementById('mista-css')) {
        const s = document.createElement('style'); s.id = 'mista-css'; s.innerHTML = css; document.head.appendChild(s);
    }

    class MistaPlayer {
        constructor(el) {
            this.container = el;
            this.rawSource = el.getAttribute('data-vid');
            this.videoId = this.extractID(this.rawSource);
            this.uid = Math.random().toString(36).substr(2, 9);
            this.player = null;
            this.isPlaying = false;
            this.timer = null;
            
            // Ad Config
            this.lastAdTime = 0;
            this.adInterval = 20 * 60; // 20 Minutes
            this.isAdPlaying = false;
            this.hasStarted = false;
            
            this.render();
            this.initYT();
        }

        extractID(src) {
            if(!src) return 'D-279L1219U';
            let id = src.trim();
            const urlMatch = id.match(/(?:v=|\/|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/);
            return urlMatch ? urlMatch[1] : id;
        }

        render() {
            const posterUrl = `https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg`;
            
            this.container.innerHTML = `
                <div class="mp-container" id="box-${this.uid}">
                    
                    <div class="mp-layer mp-video-wrap" id="v-wrap-${this.uid}">
                        <div id="yt-${this.uid}" class="mp-video"></div>
                    </div>

                    <div class="mp-click-shield" id="shield-${this.uid}"></div>
                    
                    <div class="mp-ad-layer" id="ad-layer-${this.uid}">
                        <div class="mp-ad-content" id="ad-content-${this.uid}"></div>
                        <div class="mp-skip-btn" id="skip-${this.uid}">Skip in 5</div>
                    </div>

                    <div class="mp-layer mp-poster" id="poster-${this.uid}" style="background-image: url('${posterUrl}');">
                        <div class="mp-big-play" id="start-btn-${this.uid}"><span class="material-icons-round" style="font-size:40px; color:white;">play_arrow</span></div>
                    </div>

                    <div class="mp-spinner" id="spin-${this.uid}"></div>
                    <div class="mp-feedback" id="feed-${this.uid}"></div>
                    <div class="mp-tap mp-tap-l"><span class="material-icons-round" style="color:white; font-size:40px;">fast_rewind</span></div>
                    <div class="mp-tap mp-tap-r"><span class="material-icons-round" style="color:white; font-size:40px;">fast_forward</span></div>

                    <div class="mp-layer mp-ui mp-hidden" id="ui-${this.uid}">
                        <div class="mp-title">Loading...</div>
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
                                    <button class="mp-btn" id="q-btn-${this.uid}"><span class="material-icons-round mp-icon">high_quality</span></button>
                                    <button class="mp-btn" id="s-btn-${this.uid}"><span class="material-icons-round mp-icon">speed</span></button>
                                    <button class="mp-btn" id="f-btn-${this.uid}"><span class="material-icons-round mp-icon">fullscreen</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mp-overlay" id="menu-q-${this.uid}"><div class="mp-sheet" id="list-q-${this.uid}"></div></div>
                    <div class="mp-overlay" id="menu-s-${this.uid}"><div class="mp-sheet" id="list-s-${this.uid}"></div></div>
                </div>
            `;
            
            this.fillMenus();
            this.events();
            this.getTitle();
        }

        fillMenus() {
            const qHtml = ['auto','hd1080','hd720','large','medium','small'].map(q => `<div class="mp-item ${q=='auto'?'active':''}" data-val="${q}">${q.toUpperCase()}</div>`).join('');
            this.container.querySelector(`#list-q-${this.uid}`).innerHTML = `<div style="font-weight:bold;color:white;margin-bottom:15px;font-size:16px;">Quality</div>` + qHtml;
            
            const sHtml = [0.5, 1, 1.25, 1.5, 2].map(s => `<div class="mp-item ${s==1?'active':''}" data-val="${s}">${s}x Normal</div>`).join('');
            this.container.querySelector(`#list-s-${this.uid}`).innerHTML = `<div style="font-weight:bold;color:white;margin-bottom:15px;font-size:16px;">Playback Speed</div>` + sHtml;
        }

        events() {
            const c = this.container;
            
            // NOTE: Event listener attached to the SHIELD, not the box.
            // This ensures clicks are caught before hitting the iframe.
            const shield = c.querySelector(`#shield-${this.uid}`);
            
            // 1. Initial Start
            c.querySelector(`#start-btn-${this.uid}`).addEventListener('click', () => {
                this.triggerAd(() => {
                    c.querySelector(`#poster-${this.uid}`).style.display = 'none';
                    c.querySelector(`#spin-${this.uid}`).style.display = 'block';
                    this.player.playVideo();
                    this.hasStarted = true;
                    this.lastAdTime = Date.now() / 1000;
                });
            });

            // 2. Play/Pause
            c.querySelector(`#play-${this.uid}`).addEventListener('click', () => this.toggle());

            // 3. Skip Ad
            c.querySelector(`#skip-${this.uid}`).addEventListener('click', () => this.endAd());

            // 4. Double Tap Logic (Attached to Shield)
            let lastTap = 0;
            shield.addEventListener('click', (e) => {
                if(!this.hasStarted || this.isAdPlaying) return; 
                
                // Prevent click from propagating down (Extra safety)
                e.stopPropagation();

                const now = new Date().getTime();
                if(now - lastTap < 300) {
                    // Double Tap Detected
                    const width = shield.offsetWidth;
                    const x = e.clientX - shield.getBoundingClientRect().left;
                    if(x < width/2) this.seek(-10, '.mp-tap-l'); else this.seek(10, '.mp-tap-r');
                } else {
                    // Single Tap - Toggle UI
                    // Wait briefly to see if it becomes a double tap
                    setTimeout(() => {
                        if (new Date().getTime() - lastTap >= 300) {
                             const ui = c.querySelector(`#ui-${this.uid}`);
                             ui.classList.toggle('mp-hidden');
                             if(!ui.classList.contains('mp-hidden') && this.isPlaying) this.hideUiDelay();
                        }
                    }, 305);
                }
                lastTap = now;
            });

            // 5. Seek Bar
            const seekWrap = c.querySelector('.mp-seek-wrap');
            seekWrap.addEventListener('click', (e) => {
                if(this.isAdPlaying) return;
                const rect = seekWrap.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                this.player.seekTo(this.player.getDuration() * pct, true);
            });

            // 6. Fullscreen
            c.querySelector(`#f-btn-${this.uid}`).addEventListener('click', () => {
                const box = c.querySelector(`#box-${this.uid}`);
                if(!document.fullscreenElement) box.requestFullscreen(); else document.exitFullscreen();
            });

            // 7. Menus
            const qMenu = c.querySelector(`#menu-q-${this.uid}`);
            const sMenu = c.querySelector(`#menu-s-${this.uid}`);
            c.querySelector(`#q-btn-${this.uid}`).addEventListener('click', () => { qMenu.classList.add('active'); c.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden'); });
            c.querySelector(`#s-btn-${this.uid}`).addEventListener('click', () => { sMenu.classList.add('active'); c.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden'); });
            
            [qMenu, sMenu].forEach(m => m.addEventListener('click', (e) => {
                if(e.target === m) m.classList.remove('active');
                if(e.target.classList.contains('mp-item')) {
                    m.querySelectorAll('.mp-item').forEach(i => i.classList.remove('active'));
                    e.target.classList.add('active');
                    const v = e.target.getAttribute('data-val');
                    if(m === qMenu) this.player.setPlaybackQuality(v); else this.player.setPlaybackRate(parseFloat(v));
                    m.classList.remove('active');
                }
            }));
        }

        // --- ADS ---
        triggerAd(callback) {
            this.adCallback = callback;
            this.isAdPlaying = true;
            this.container.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden');
            if(this.player && this.player.pauseVideo && this.hasStarted) this.player.pauseVideo();

            const adLayer = this.container.querySelector(`#ad-layer-${this.uid}`);
            const adContent = this.container.querySelector(`#ad-content-${this.uid}`);
            adLayer.classList.add('active');

            adContent.innerHTML = `<div class="mista-ad" data-cat="Entertainment" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">Loading Ad...</div>`;
            const s = document.createElement('script');
            s.type = 'module';
            s.src = "https://MistaFy.pages.dev/ads.js?" + Math.random();
            adContent.appendChild(s);

            let count = 5;
            const skipBtn = this.container.querySelector(`#skip-${this.uid}`);
            skipBtn.innerText = `Skip in ${count}`;
            skipBtn.classList.remove('ready');

            const timer = setInterval(() => {
                count--;
                if(count > 0) skipBtn.innerText = `Skip in ${count}`;
                else {
                    clearInterval(timer);
                    skipBtn.innerText = "SKIP AD";
                    skipBtn.classList.add('ready');
                }
            }, 1000);
        }

        endAd() {
            this.container.querySelector(`#ad-layer-${this.uid}`).classList.remove('active');
            this.container.querySelector(`#ad-content-${this.uid}`).innerHTML = "";
            this.isAdPlaying = false;
            if(this.adCallback) this.adCallback();
        }

        checkMidRoll() {
            if(!this.isPlaying || this.isAdPlaying) return;
            const now = Date.now() / 1000;
            if(now - this.lastAdTime > this.adInterval) {
                this.triggerAd(() => {
                    this.player.playVideo();
                    this.lastAdTime = Date.now() / 1000;
                });
            }
        }

        // --- PLAYER CORE ---
        initYT() {
            if(window.YT && window.YT.Player) this.createPlayer();
            else {
                if(!window.onYouTubeIframeAPIReady) {
                    const t = document.createElement('script'); t.src = "https://www.youtube.com/iframe_api";
                    document.body.appendChild(t);
                    window.onYouTubeIframeAPIReady = () => window.dispatchEvent(new Event('yt_ready'));
                }
                window.addEventListener('yt_ready', () => this.createPlayer());
            }
        }

        createPlayer() {
            this.player = new YT.Player(`yt-${this.uid}`, {
                videoId: this.videoId,
                playerVars: { controls:0, rel:0, playsinline:1, origin:window.location.origin, modestbranding:1, iv_load_policy:3, disablekb:1 },
                events: { 'onStateChange': (e) => this.stateChange(e) }
            });
        }

        stateChange(e) {
            const s = e.data;
            const spin = this.container.querySelector(`#spin-${this.uid}`);
            const vWrap = this.container.querySelector(`#v-wrap-${this.uid}`);
            const btn = this.container.querySelector(`#play-${this.uid} span`);

            spin.style.display = 'none';

            if(s === YT.PlayerState.PLAYING) {
                this.isPlaying = true;
                vWrap.classList.add('active');
                btn.innerText = 'pause';
                this.loop();
                this.hideUiDelay();
                if(this.lastAdTime === 0) this.lastAdTime = Date.now() / 1000;
            } else if (s === YT.PlayerState.PAUSED) {
                this.isPlaying = false;
                btn.innerText = 'play_arrow';
                this.container.querySelector(`#ui-${this.uid}`).classList.remove('mp-hidden');
            } else if (s === YT.PlayerState.BUFFERING) {
                spin.style.display = 'block';
            }
        }

        toggle() {
            if(this.isPlaying) this.player.pauseVideo(); else this.player.playVideo();
        }

        seek(sec, sel) {
            const ct = this.player.getCurrentTime();
            this.player.seekTo(ct + sec, true);
            this.feedback(sec > 0 ? 'fast_forward' : 'fast_rewind');
            const el = this.container.querySelector(sel);
            el.style.opacity = 1; setTimeout(() => el.style.opacity = 0, 400);
        }

        feedback(icon) {
            const el = this.container.querySelector(`#feed-${this.uid}`);
            el.innerHTML = `<span class="material-icons-round" style="color:white;font-size:40px;">${icon}</span>`;
            el.classList.add('anim'); setTimeout(() => el.classList.remove('anim'), 300);
        }

        hideUiDelay() {
            clearTimeout(this.to);
            this.to = setTimeout(() => {
                if(this.isPlaying && !this.isAdPlaying) {
                    this.container.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden');
                }
            }, 3000);
        }

        loop() {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                if(this.player && this.player.getCurrentTime) {
                    const c = this.player.getCurrentTime();
                    const d = this.player.getDuration();
                    const pct = (c/d)*100;
                    this.container.querySelector('.mp-seek-fill').style.width = pct + '%';
                    this.container.querySelector('.mp-seek-thumb').style.left = pct + '%';
                    
                    const fmt = (t) => { const m=Math.floor(t/60), s=Math.floor(t%60); return `${m}:${s<10?'0':''}${s}`; };
                    this.container.querySelector(`#time-${this.uid}`).innerText = `${fmt(c)} / ${fmt(d)}`;
                    
                    this.checkMidRoll();
                }
            }, 1000);
        }

        async getTitle() {
            try {
                const r = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${this.videoId}`);
                const d = await r.json();
                if(d.title) this.container.querySelector('.mp-title').innerText = d.title;
            } catch(e){}
        }
    }

    const init = () => {
        document.querySelectorAll('.mista-embed').forEach(el => {
            if(!el.getAttribute('data-init')) {
                new MistaPlayer(el); el.setAttribute('data-init', 'true');
            }
        });
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
