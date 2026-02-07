(function() {
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap');
        
        /* --- 1. CONTAINER & ANIMATIONS --- */
        .mp-container { 
            position: relative; width: 100%; height: 100%; background: #000; 
            overflow: hidden; font-family: 'Poppins', sans-serif; user-select: none; 
            border-radius: 16px; aspect-ratio: 16/9; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            -webkit-tap-highlight-color: transparent;
        }
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; transition: 0.3s ease; }

        /* --- 2. VIDEO (MAX GHOST MODE) --- */
        /* Scaled to 1.5 to guarantee NO controls act visible */
        .mp-video-wrapper { 
            z-index: 1; pointer-events: none; opacity: 0; transition: opacity 0.6s ease; 
            transform: scale(1.5); width: 100%; height: 100%;
        }
        .mp-video-wrapper.active { opacity: 1; }
        .mp-video { width: 100%; height: 100%; border: none; }

        /* --- 3. UI LAYER & GRADIENTS --- */
        .mp-ui { 
            z-index: 20; display: flex; flex-direction: column; justify-content: space-between; 
            background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.9) 100%);
            opacity: 1; pointer-events: none;
        }
        .mp-ui.mp-hidden { opacity: 0; }
        
        /* Interactive Elements */
        .mp-btm, .mp-seek-wrap, .mp-btn, .mp-start-btn, .mp-lock-btn { pointer-events: auto; cursor: pointer; }

        /* --- 4. CONTROLS & ICONS --- */
        .mp-btn { 
            background: rgba(255,255,255,0.1); border: none; color: #fff; 
            padding: 10px; border-radius: 50%; display: flex; 
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            backdrop-filter: blur(5px);
        }
        .mp-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }
        .mp-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        
        /* LOCK BUTTON (Special) */
        .mp-lock-btn {
            position: absolute; left: 20px; top: 50%; transform: translateY(-50%); z-index: 50;
            background: rgba(255,255,255,0.1); color: white; border-radius: 50%; width: 45px; height: 45px;
            display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);
            transition: 0.3s; opacity: 0; pointer-events: none;
        }
        .mp-lock-btn.visible { opacity: 1; pointer-events: auto; }
        .mp-lock-btn.locked { background: rgba(255, 255, 255, 0.9); color: #000; }

        /* START BUTTON (Pulsing) */
        .mp-start-btn {
            width: 70px; height: 70px; background: rgba(229, 9, 20, 0.9); 
            box-shadow: 0 0 20px rgba(229, 9, 20, 0.6);
            border-radius: 50%; display: flex; align-items: center; justify-content: center; 
            z-index: 50; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(229, 9, 20, 0); } 100% { box-shadow: 0 0 0 0 rgba(229, 9, 20, 0); } }

        /* --- 5. DRAGGABLE SEEK BAR --- */
        .mp-btm { padding: 20px; }
        .mp-seek-container { width: 100%; height: 20px; display: flex; align-items: center; cursor: pointer; }
        .mp-seek-track { width: 100%; height: 4px; background: rgba(255,255,255,0.2); border-radius: 4px; position: relative; overflow: visible; }
        .mp-seek-fill { height: 100%; background: #e50914; border-radius: 4px; width: 0%; position: relative; }
        .mp-seek-fill::after { 
            content:''; position: absolute; right: -6px; top: -4px; width: 12px; height: 12px; 
            background: #fff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            transform: scale(0); transition: transform 0.2s; 
        }
        .mp-seek-container:hover .mp-seek-fill::after, .mp-seek-container.dragging .mp-seek-fill::after { transform: scale(1.5); }

        /* --- 6. ADS SYSTEM (Refined) --- */
        .mp-ad-layer { 
            z-index: 100; background: #000; display: none; 
            flex-direction: column; align-items: center; justify-content: center;
        }
        .mp-ad-layer.active { display: flex; }
        
        /* Auto Adjusting Slot */
        .mp-ad-slot { 
            width: 100%; height: 100%; 
            display: flex; align-items: center; justify-content: center; 
            overflow: hidden; 
        }
        /* Ensure injected images/iframes fit nicely */
        .mp-ad-slot img, .mp-ad-slot iframe { max-width: 100%; max-height: 100%; object-fit: contain; }

        .mp-skip-btn {
            position: absolute; bottom: 20px; right: 20px;
            background: rgba(30,30,30,0.9); color: #fff; border: 1px solid rgba(255,255,255,0.15);
            padding: 6px 16px; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
            cursor: pointer; opacity: 0; pointer-events: none; transition: 0.3s;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3); backdrop-filter: blur(5px);
        }
        .mp-skip-btn.ready { opacity: 1; pointer-events: auto; }
        .mp-skip-btn:active { transform: scale(0.95); }

        /* --- 7. POSTER & SPINNER --- */
        .mp-poster { z-index: 10; background: #000 no-repeat center/cover; pointer-events: none; }
        .mp-spinner {
            width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); 
            border-top: 3px solid #e50914; border-radius: 50%; 
            animation: spin 0.8s infinite linear; 
            position: absolute; top:50%; left:50%; margin:-20px; 
            display: none; z-index: 15; pointer-events: none;
        }

        /* --- 8. MENUS (Glass) --- */
        .mp-sheet-bg { position: absolute; inset: 0; z-index: 200; background: rgba(0,0,0,0.7); opacity: 0; pointer-events: none; transition: 0.3s; display: flex; flex-direction: column; justify-content: flex-end; }
        .mp-sheet-bg.active { opacity: 1; pointer-events: auto; }
        .mp-sheet { background: #151515; width: 100%; padding: 10px; border-radius: 20px 20px 0 0; transform: translateY(100%); transition: 0.3s cubic-bezier(0.2, 0, 0, 1); max-height: 60%; overflow-y: auto; }
        .mp-sheet-bg.active .mp-sheet { transform: translateY(0); }
        .mp-menu-item { padding: 15px; color: #ccc; font-size: 13px; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .mp-menu-item.active { color: #e50914; font-weight: 700; }

        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    if(!document.getElementById('mista-player-v4')) {
        const s = document.createElement('style'); s.id = 'mista-player-v4'; s.innerHTML = css; document.head.appendChild(s);
    }

    class MistaPlayer {
        constructor(el) {
            this.container = el;
            this.rawSource = el.getAttribute('data-vid');
            this.videoId = this.extractID(this.rawSource);
            this.uid = Math.random().toString(36).substr(2, 9);
            
            // Core States
            this.player = null;
            this.isPlaying = false;
            this.isLocked = false;
            this.isDragging = false;
            
            // Ad States
            this.adWatched = false;
            this.isAdPlaying = false;
            this.hasStarted = false;
            
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

                    <div class="mp-layer" id="touch-${this.uid}" style="z-index: 5; cursor: pointer;"></div>

                    <div class="mp-layer mp-ad-layer" id="ad-layer-${this.uid}">
                        <div class="mp-ad-slot" id="ad-slot-${this.uid}"></div>
                        <div class="mp-skip-btn" id="skip-${this.uid}">Skip</div>
                    </div>

                    <div class="mp-layer mp-poster" id="poster-${this.uid}" style="background-image: url('${poster}');"></div>
                    
                    <div class="mp-start-btn" id="start-${this.uid}">
                        <span class="material-icons-round" style="font-size: 36px; color: white;">play_arrow</span>
                    </div>

                    <div class="mp-spinner" id="spin-${this.uid}"></div>

                    <div class="mp-lock-btn" id="lock-${this.uid}">
                        <span class="material-icons-round">lock_open</span>
                    </div>

                    <div class="mp-layer mp-ui mp-hidden" id="ui-${this.uid}">
                        <div style="padding:20px; display:flex; justify-content:flex-end;">
                            <span class="material-icons-round" style="color:white; font-size:24px;">cast</span>
                        </div>
                        
                        <div class="mp-btm">
                            <div class="mp-seek-container" id="seek-${this.uid}">
                                <div class="mp-seek-track">
                                    <div class="mp-seek-fill" id="fill-${this.uid}"></div>
                                </div>
                            </div>

                            <div class="mp-row">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <button class="mp-btn" id="play-${this.uid}"><span class="material-icons-round">play_arrow</span></button>
                                    <span style="color:#ddd; font-size:12px; font-weight:600;" id="time-${this.uid}">0:00</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <button class="mp-btn" id="q-btn-${this.uid}"><span class="material-icons-round">high_quality</span></button>
                                    <button class="mp-btn" id="fs-btn-${this.uid}"><span class="material-icons-round">fullscreen</span></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mp-sheet-bg" id="menu-q-${this.uid}"><div class="mp-sheet" id="list-q-${this.uid}"></div></div>
                </div>
            `;
            
            this.fillMenus();
            this.attachEvents();
        }

        fillMenus() {
            const qList = ['auto', 'hd1080', 'hd720', 'large', 'medium', 'small'];
            const qHTML = qList.map(q => `<div class="mp-menu-item ${q==='auto'?'active':''}" data-val="${q}">${q.toUpperCase()}</div>`).join('');
            this.container.querySelector(`#list-q-${this.uid}`).innerHTML = `<div style="padding:10px 15px; font-weight:bold; color:white;">Quality</div>` + qHTML;
        }

        attachEvents() {
            const c = this.container;
            const touch = c.querySelector(`#touch-${this.uid}`);
            const lockBtn = c.querySelector(`#lock-${this.uid}`);
            
            // --- START ---
            c.querySelector(`#start-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                if(!this.adWatched) this.playAd();
                else this.playVideo();
            });

            // --- ADS SKIP ---
            c.querySelector(`#skip-${this.uid}`).addEventListener('click', (e) => { e.stopPropagation(); this.closeAd(); });

            // --- LOCK SYSTEM ---
            lockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.isLocked = !this.isLocked;
                
                const icon = lockBtn.querySelector('span');
                const ui = c.querySelector(`#ui-${this.uid}`);
                
                if (this.isLocked) {
                    icon.innerText = 'lock';
                    lockBtn.classList.add('locked');
                    ui.classList.add('mp-hidden'); // Hide controls
                    lockBtn.classList.add('visible'); // Keep lock btn visible
                } else {
                    icon.innerText = 'lock_open';
                    lockBtn.classList.remove('locked');
                    ui.classList.remove('mp-hidden');
                    this.resetUITimer();
                }
            });

            // --- MAIN TOUCH LOGIC ---
            touch.addEventListener('click', () => {
                if(this.isAdPlaying || !this.hasStarted) return;
                
                const ui = c.querySelector(`#ui-${this.uid}`);
                const lock = c.querySelector(`#lock-${this.uid}`);

                if (this.isLocked) {
                    // Only show lock button briefly if screen tapped while locked
                    lock.classList.add('visible');
                    setTimeout(() => lock.classList.remove('visible'), 2000);
                } else {
                    // Normal toggle
                    ui.classList.toggle('mp-hidden');
                    lock.classList.toggle('visible');
                    if (!ui.classList.contains('mp-hidden')) this.resetUITimer();
                }
            });

            // --- PLAY/PAUSE/FS ---
            c.querySelector(`#play-${this.uid}`).addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
            c.querySelector(`#fs-btn-${this.uid}`).addEventListener('click', (e) => { 
                e.stopPropagation(); 
                const box = c.querySelector(`#box-${this.uid}`);
                if (!document.fullscreenElement) box.requestFullscreen(); else document.exitFullscreen(); 
            });

            // --- DRAGGABLE SEEKBAR ---
            const seekBox = c.querySelector(`#seek-${this.uid}`);
            
            const handleDrag = (e) => {
                if(this.isLocked) return;
                const rect = seekBox.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                let pct = (clientX - rect.left) / rect.width;
                pct = Math.max(0, Math.min(1, pct));
                
                c.querySelector(`#fill-${this.uid}`).style.width = (pct * 100) + '%';
                
                if (e.type === 'touchend' || e.type === 'mouseup' || e.type === 'click') {
                    this.isDragging = false;
                    this.player.seekTo(this.player.getDuration() * pct, true);
                    this.playVideo();
                } else {
                    this.isDragging = true;
                }
            };

            // Touch & Mouse Events for Drag
            seekBox.addEventListener('mousedown', handleDrag);
            seekBox.addEventListener('touchstart', handleDrag);
            
            window.addEventListener('mousemove', (e) => { if(this.isDragging) handleDrag(e); });
            window.addEventListener('touchmove', (e) => { if(this.isDragging) handleDrag(e); });
            
            window.addEventListener('mouseup', (e) => { if(this.isDragging) handleDrag(e); });
            window.addEventListener('touchend', (e) => { if(this.isDragging) handleDrag(e); });

            // --- MENU ---
            const qBtn = c.querySelector(`#q-btn-${this.uid}`);
            const qMenu = c.querySelector(`#menu-q-${this.uid}`);
            qBtn.addEventListener('click', (e) => { e.stopPropagation(); qMenu.classList.add('active'); });
            qMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                if(e.target.classList.contains('mp-menu-item')) {
                    this.player.setPlaybackQuality(e.target.getAttribute('data-val'));
                    qMenu.classList.remove('active');
                } else if(e.target === qMenu) qMenu.classList.remove('active');
            });
        }

        // --- UI TIMERS ---
        resetUITimer() {
            clearTimeout(this.uiTimer);
            this.uiTimer = setTimeout(() => {
                if (this.isPlaying && !this.isLocked && !this.isDragging) {
                    this.container.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden');
                    this.container.querySelector(`#lock-${this.uid}`).classList.remove('visible');
                }
            }, 3500);
        }

        // --- AD LOGIC ---
        playAd() {
            this.isAdPlaying = true;
            const adLayer = this.container.querySelector(`#ad-layer-${this.uid}`);
            const adSlot = this.container.querySelector(`#ad-slot-${this.uid}`);
            
            this.container.querySelector(`#start-${this.uid}`).style.display = 'none';
            adLayer.classList.add('active');

            // Inject Script
            adSlot.innerHTML = `<div class="mista-ad" data-cat="Entertainment" style="width:100%;height:100%;"></div>`;
            const s = document.createElement('script');
            s.type = 'module';
            s.src = "https://MistaFy.pages.dev/ads.js?" + Math.random();
            adSlot.appendChild(s);

            let count = 5;
            const skipBtn = this.container.querySelector(`#skip-${this.uid}`);
            skipBtn.innerText = `Skip in ${count}`;
            skipBtn.classList.remove('ready');

            const t = setInterval(() => {
                count--;
                if(count > 0) skipBtn.innerText = `Skip in ${count}`;
                else {
                    clearInterval(t);
                    skipBtn.innerText = "Skip Ad";
                    skipBtn.classList.add('ready');
                }
            }, 1000);
        }

        closeAd() {
            this.container.querySelector(`#ad-layer-${this.uid}`).classList.remove('active');
            this.container.querySelector(`#ad-slot-${this.uid}`).innerHTML = ""; 
            this.isAdPlaying = false;
            this.adWatched = true;
            this.playVideo();
        }

        playVideo() {
            this.container.querySelector(`#poster-${this.uid}`).style.display = 'none';
            this.container.querySelector(`#start-${this.uid}`).style.display = 'none';
            this.container.querySelector(`#spin-${this.uid}`).style.display = 'block';
            this.player.playVideo();
            this.hasStarted = true;
        }

        // --- YOUTUBE API ---
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
                playerVars: { controls: 0, rel: 0, playsinline: 1, iv_load_policy: 3, disablekb: 1 },
                events: { 'onStateChange': (e) => this.onState(e) }
            });
        }

        onState(e) {
            const s = e.data;
            const spin = this.container.querySelector(`#spin-${this.uid}`);
            const icon = this.container.querySelector(`#play-${this.uid} span`);

            spin.style.display = 'none';

            if(s === YT.PlayerState.PLAYING) {
                this.isPlaying = true;
                this.container.querySelector(`#v-wrap-${this.uid}`).classList.add('active');
                icon.innerText = 'pause';
                this.startLoop();
                this.resetUITimer();
            } else if (s === YT.PlayerState.PAUSED) {
                this.isPlaying = false;
                icon.innerText = 'play_arrow';
                this.container.querySelector(`#ui-${this.uid}`).classList.remove('mp-hidden');
                this.container.querySelector(`#lock-${this.uid}`).classList.add('visible');
            } else if (s === YT.PlayerState.BUFFERING) {
                spin.style.display = 'block';
            }
        }

        toggle() { if(this.isPlaying) this.player.pauseVideo(); else this.player.playVideo(); }

        startLoop() {
            setInterval(() => {
                if(this.player && this.player.getCurrentTime && !this.isDragging) {
                    const c = this.player.getCurrentTime();
                    const d = this.player.getDuration();
                    const p = (c/d)*100;
                    this.container.querySelector(`#fill-${this.uid}`).style.width = p + '%';
                    
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
