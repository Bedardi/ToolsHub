(function() {
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap');
        
        /* --- 1. MAIN CONTAINER (The Frame) --- */
        .mp-container { 
            position: relative; width: 100%; height: 100%; 
            background: #000; overflow: hidden; /* CRITICAL: Hides the zoomed out parts */
            font-family: 'Poppins', sans-serif; user-select: none; 
            border-radius: 16px; aspect-ratio: 16/9; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            -webkit-tap-highlight-color: transparent;
        }
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; }

        /* --- 2. THE GHOST MODE FIX (Aggressive Crop) --- */
        .mp-video-wrapper {
            position: absolute;
            width: 140%; height: 140%; /* Make video 40% bigger than box */
            top: -20%; left: -20%;   /* Center it perfectly */
            pointer-events: none;    /* No clicking on YouTube */
            opacity: 0; transition: opacity 0.5s ease;
        }
        .mp-video-wrapper.active { opacity: 1; }
        .mp-video { width: 100%; height: 100%; border: none; }

        /* --- 3. INTERACTION LAYER (Catches Taps) --- */
        .mp-touch-layer { z-index: 5; background: transparent; cursor: pointer; }

        /* --- 4. POSTER & SPINNER --- */
        .mp-poster { 
            z-index: 10; background: #000 no-repeat center/cover; 
            display: flex; align-items: center; justify-content: center; 
            transition: opacity 0.3s; pointer-events: none;
        }
        .mp-spinner {
            width: 45px; height: 45px; border: 3px solid rgba(255,255,255,0.1); 
            border-top: 3px solid #e50914; border-radius: 50%; 
            animation: spin 0.8s infinite linear; 
            position: absolute; top:50%; left:50%; margin:-22.5px; 
            display: none; z-index: 15; pointer-events: none;
        }

        /* --- 5. ADS SYSTEM (Auto-Fit) --- */
        .mp-ad-layer { 
            z-index: 100; background: #000; display: none; 
            flex-direction: column; align-items: center; justify-content: center;
        }
        .mp-ad-layer.active { display: flex; }
        
        .mp-ad-slot { 
            width: 100%; height: 100%; 
            display: flex; align-items: center; justify-content: center; 
            overflow: hidden; pointer-events: auto;
        }
        /* Auto adjust content inside ad slot */
        .mp-ad-slot > * { max-width: 100%; max-height: 100%; object-fit: contain; }

        .mp-skip-btn {
            position: absolute; bottom: 25px; right: 20px;
            background: rgba(20,20,20,0.9); color: #fff; 
            border: 1px solid rgba(255,255,255,0.2);
            padding: 6px 14px; border-radius: 6px; 
            font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
            cursor: pointer; opacity: 0; pointer-events: none; transition: 0.3s;
            backdrop-filter: blur(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .mp-skip-btn.ready { opacity: 1; pointer-events: auto; background: #e50914; border-color: #e50914; }

        /* --- 6. UI & CONTROLS --- */
        .mp-ui { 
            z-index: 20; display: flex; flex-direction: column; justify-content: space-between; 
            background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.9) 100%);
            opacity: 1; transition: opacity 0.3s ease; pointer-events: none;
        }
        .mp-ui.mp-hidden { opacity: 0; }
        
        /* Enable interaction only on controls */
        .mp-btm, .mp-start-btn, .mp-lock-btn, .mp-btn { pointer-events: auto; }

        /* Start Button (Pulsing) */
        .mp-start-btn {
            width: 65px; height: 65px; background: rgba(229, 9, 20, 0.95); 
            border-radius: 50%; display: flex; align-items: center; justify-content: center; 
            z-index: 50; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.7); animation: pulse 2s infinite; cursor: pointer;
        }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(229, 9, 20, 0); } 100% { box-shadow: 0 0 0 0 rgba(229, 9, 20, 0); } }

        /* Lock Button */
        .mp-lock-btn {
            position: absolute; left: 20px; top: 50%; transform: translateY(-50%); z-index: 55;
            width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.15);
            display: flex; align-items: center; justify-content: center; color: white;
            backdrop-filter: blur(5px); opacity: 0; pointer-events: none; transition: 0.3s;
        }
        .mp-lock-btn.visible { opacity: 1; pointer-events: auto; }
        .mp-lock-btn.locked { background: white; color: black; opacity: 1; }

        /* Bottom Controls */
        .mp-btm { padding: 15px 20px; display: flex; flex-direction: column; gap: 8px; }
        
        /* Draggable Seekbar */
        .mp-seek-container { width: 100%; height: 20px; display: flex; align-items: center; cursor: pointer; position: relative; pointer-events: auto; }
        .mp-seek-track { width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 4px; position: relative; }
        .mp-seek-fill { height: 100%; background: #e50914; border-radius: 4px; width: 0%; position: relative; }
        .mp-seek-thumb { 
            position: absolute; right: -6px; top: -4px; width: 12px; height: 12px; 
            background: #fff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            transform: scale(0); transition: transform 0.1s; 
        }
        .mp-seek-container:hover .mp-seek-thumb, .mp-seek-container.dragging .mp-seek-thumb { transform: scale(1.3); }

        .mp-row { display: flex; justify-content: space-between; align-items: center; }
        .mp-icon-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 5px; opacity: 0.9; transition: 0.2s; }
        .mp-icon-btn:hover { opacity: 1; transform: scale(1.1); }
        .mp-icon-btn span { font-size: 28px; }
        .mp-time { font-size: 12px; color: #ddd; font-weight: 600; margin-left: 10px; min-width: 80px; }

        /* Feedback (Double Tap) */
        .mp-feedback { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            width: 80px; height: 80px; background: rgba(0,0,0,0.7); border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            opacity: 0; pointer-events: none; transition: 0.2s; z-index: 40; 
            backdrop-filter: blur(4px); 
        }
        .mp-feedback.anim { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }

        /* Menus */
        .mp-menu-bg { position: absolute; inset: 0; z-index: 200; background: rgba(0,0,0,0.7); opacity: 0; pointer-events: none; transition: 0.3s; display: flex; flex-direction: column; justify-content: flex-end; }
        .mp-menu-bg.active { opacity: 1; pointer-events: auto; }
        .mp-menu { background: #1a1a1a; width: 100%; border-radius: 16px 16px 0 0; padding: 10px 0; transform: translateY(100%); transition: 0.3s cubic-bezier(0.2, 0, 0, 1); }
        .mp-menu-bg.active .mp-menu { transform: translateY(0); }
        .mp-menu-item { padding: 15px 20px; color: #ccc; font-size: 13px; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between; }
        .mp-menu-item.active { color: #e50914; font-weight: 700; }
        .mp-menu-item.active::after { content: '✓'; }

        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    if(!document.getElementById('mista-player-final')) {
        const s = document.createElement('style'); s.id = 'mista-player-final'; s.innerHTML = css; document.head.appendChild(s);
    }

    class MistaPlayer {
        constructor(el) {
            this.container = el;
            this.rawSource = el.getAttribute('data-vid');
            this.videoId = this.extractID(this.rawSource);
            this.uid = Math.random().toString(36).substr(2, 9);
            
            // States
            this.player = null;
            this.isPlaying = false;
            this.isLocked = false;
            this.isDragging = false;
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

                    <div class="mp-layer mp-touch-layer" id="touch-${this.uid}"></div>

                    <div class="mp-layer mp-ad-layer" id="ad-layer-${this.uid}">
                        <div class="mp-ad-slot" id="ad-slot-${this.uid}"></div>
                        <div class="mp-skip-btn" id="skip-${this.uid}">Skip</div>
                    </div>

                    <div class="mp-layer mp-poster" id="poster-${this.uid}" style="background-image: url('${poster}');"></div>
                    <div class="mp-start-btn" id="start-${this.uid}">
                        <span class="material-icons-round" style="font-size: 36px; color: white;">play_arrow</span>
                    </div>

                    <div class="mp-spinner" id="spin-${this.uid}"></div>
                    <div class="mp-feedback" id="feed-${this.uid}"></div>

                    <div class="mp-lock-btn" id="lock-${this.uid}"><span class="material-icons-round">lock_open</span></div>

                    <div class="mp-layer mp-ui mp-hidden" id="ui-${this.uid}">
                        <div style="padding:20px; text-align:right;">
                            <span class="material-icons-round" style="color:rgba(255,255,255,0.7);">cast</span>
                        </div>
                        
                        <div class="mp-btm">
                            <div class="mp-seek-container" id="seek-${this.uid}">
                                <div class="mp-seek-track">
                                    <div class="mp-seek-fill" id="fill-${this.uid}"></div>
                                    <div class="mp-seek-thumb" id="thumb-${this.uid}"></div>
                                </div>
                            </div>

                            <div class="mp-row">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <button class="mp-icon-btn" id="play-${this.uid}"><span class="material-icons-round">play_arrow</span></button>
                                    <span class="mp-time" id="time-${this.uid}">0:00</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <button class="mp-icon-btn" id="q-btn-${this.uid}"><span class="material-icons-round">high_quality</span></button>
                                    <button class="mp-icon-btn" id="s-btn-${this.uid}"><span class="material-icons-round">speed</span></button>
                                    <button class="mp-icon-btn" id="fs-btn-${this.uid}"><span class="material-icons-round">fullscreen</span></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mp-menu-bg" id="menu-q-${this.uid}"><div class="mp-menu" id="list-q-${this.uid}"></div></div>
                    <div class="mp-menu-bg" id="menu-s-${this.uid}"><div class="mp-menu" id="list-s-${this.uid}"></div></div>
                </div>
            `;
            
            this.fillMenus();
            this.attachEvents();
        }

        fillMenus() {
            const qList = ['auto', 'hd1080', 'hd720', 'large', 'medium'];
            const qHTML = qList.map(q => `<div class="mp-menu-item ${q==='auto'?'active':''}" data-val="${q}">${q.toUpperCase()}</div>`).join('');
            this.container.querySelector(`#list-q-${this.uid}`).innerHTML = `<div style="padding:15px; font-weight:bold; color:white; font-size:14px;">Quality</div>` + qHTML;

            const sList = [0.5, 1, 1.25, 1.5, 2];
            const sHTML = sList.map(s => `<div class="mp-menu-item ${s===1?'active':''}" data-val="${s}">${s}x Normal</div>`).join('');
            this.container.querySelector(`#list-s-${this.uid}`).innerHTML = `<div style="padding:15px; font-weight:bold; color:white; font-size:14px;">Playback Speed</div>` + sHTML;
        }

        attachEvents() {
            const c = this.container;
            const touch = c.querySelector(`#touch-${this.uid}`);
            const box = c.querySelector(`#box-${this.uid}`);
            
            // --- START (AD FIRST) ---
            c.querySelector(`#start-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                if(!this.adWatched) this.playAd(); else this.playVideo();
            });

            // --- SKIP AD ---
            c.querySelector(`#skip-${this.uid}`).addEventListener('click', (e) => { e.stopPropagation(); this.closeAd(); });

            // --- PLAY/PAUSE ---
            c.querySelector(`#play-${this.uid}`).addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });

            // --- LOCK ---
            c.querySelector(`#lock-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                this.isLocked = !this.isLocked;
                const icon = c.querySelector(`#lock-${this.uid} span`);
                const btn = c.querySelector(`#lock-${this.uid}`);
                const ui = c.querySelector(`#ui-${this.uid}`);

                if(this.isLocked) {
                    icon.innerText = 'lock';
                    btn.classList.add('locked');
                    ui.classList.add('mp-hidden');
                    btn.classList.add('visible');
                } else {
                    icon.innerText = 'lock_open';
                    btn.classList.remove('locked');
                    ui.classList.remove('mp-hidden');
                    this.resetUITimer();
                }
            });

            // --- TOUCH LOGIC (Double Tap & Toggle) ---
            let lastTap = 0;
            touch.addEventListener('click', (e) => {
                if(this.isAdPlaying || !this.hasStarted) return;
                
                const ui = c.querySelector(`#ui-${this.uid}`);
                const lock = c.querySelector(`#lock-${this.uid}`);
                
                if(this.isLocked) {
                    lock.classList.add('visible');
                    setTimeout(() => lock.classList.remove('visible'), 2000);
                    return;
                }

                const now = new Date().getTime();
                if(now - lastTap < 300) {
                    // Double Tap
                    const width = touch.offsetWidth;
                    const x = e.clientX - touch.getBoundingClientRect().left;
                    const isRight = x > width / 2;
                    this.seek(isRight ? 10 : -10);
                    this.showFeedback(isRight ? 'fast_forward' : 'fast_rewind');
                } else {
                    // Single Tap
                    setTimeout(() => {
                        if(new Date().getTime() - lastTap >= 300) {
                            ui.classList.toggle('mp-hidden');
                            lock.classList.toggle('visible');
                            if(!ui.classList.contains('mp-hidden')) this.resetUITimer();
                        }
                    }, 305);
                }
                lastTap = now;
            });

            // --- DRAGGABLE SEEKBAR ---
            const seekBox = c.querySelector(`#seek-${this.uid}`);
            
            const handleDrag = (e) => {
                if(this.isLocked || this.isAdPlaying) return;
                const rect = seekBox.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                let pct = (clientX - rect.left) / rect.width;
                pct = Math.max(0, Math.min(1, pct));
                
                c.querySelector(`#fill-${this.uid}`).style.width = (pct * 100) + '%';
                seekBox.classList.add('dragging');

                if (e.type === 'touchend' || e.type === 'mouseup' || e.type === 'click') {
                    this.isDragging = false;
                    seekBox.classList.remove('dragging');
                    this.player.seekTo(this.player.getDuration() * pct, true);
                    this.player.playVideo();
                } else {
                    this.isDragging = true;
                }
            };

            seekBox.addEventListener('mousedown', handleDrag);
            seekBox.addEventListener('touchstart', handleDrag, {passive:false});
            window.addEventListener('mousemove', (e) => { if(this.isDragging) handleDrag(e); });
            window.addEventListener('touchmove', (e) => { if(this.isDragging) handleDrag(e); });
            window.addEventListener('mouseup', (e) => { if(this.isDragging) handleDrag(e); });
            window.addEventListener('touchend', (e) => { if(this.isDragging) handleDrag(e); });

            // --- FULLSCREEN ---
            c.querySelector(`#fs-btn-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                const box = c.querySelector(`#box-${this.uid}`);
                if(!document.fullscreenElement) box.requestFullscreen(); else document.exitFullscreen();
            });

            // --- MENUS ---
            this.setupMenu('q');
            this.setupMenu('s');
        }

        setupMenu(type) {
            const btn = this.container.querySelector(`#${type}-btn-${this.uid}`);
            const menu = this.container.querySelector(`#menu-${type}-${this.uid}`);
            btn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.add('active'); });
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
                if(e.target === menu) menu.classList.remove('active');
                if(e.target.classList.contains('mp-menu-item')) {
                    const val = e.target.getAttribute('data-val');
                    menu.querySelectorAll('.mp-menu-item').forEach(el=>el.classList.remove('active'));
                    e.target.classList.add('active');
                    if(type==='q') this.player.setPlaybackQuality(val); else this.player.setPlaybackRate(parseFloat(val));
                    menu.classList.remove('active');
                }
            });
        }

        resetUITimer() {
            clearTimeout(this.uiTimer);
            this.uiTimer = setTimeout(() => {
                if(this.isPlaying && !this.isLocked && !this.isDragging) {
                    this.container.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden');
                    this.container.querySelector(`#lock-${this.uid}`).classList.remove('visible');
                }
            }, 3500);
        }

        // --- AD LOGIC ---
        playAd() {
            this.isAdPlaying = true;
            this.container.querySelector(`#start-${this.uid}`).style.display = 'none';
            this.container.querySelector(`#ad-layer-${this.uid}`).classList.add('active');
            
            const slot = this.container.querySelector(`#ad-slot-${this.uid}`);
            slot.innerHTML = `<div class="mista-ad" data-cat="Entertainment" style="width:100%;height:100%;"></div>`;
            const s = document.createElement('script'); s.type='module'; s.src="https://MistaFy.pages.dev/ads.js?"+Math.random();
            slot.appendChild(s);

            let c = 5;
            const btn = this.container.querySelector(`#skip-${this.uid}`);
            btn.innerText = `Skip in ${c}`;
            btn.classList.remove('ready');
            const t = setInterval(()=>{
                c--;
                if(c>0) btn.innerText = `Skip in ${c}`;
                else { clearInterval(t); btn.innerText = "Skip"; btn.classList.add('ready'); }
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

        seek(sec) {
            const cur = this.player.getCurrentTime();
            this.player.seekTo(cur + sec, true);
        }

        showFeedback(icon) {
            const el = this.container.querySelector(`#feed-${this.uid}`);
            el.innerHTML = `<span class="material-icons-round" style="color:white;font-size:40px;">${icon}</span>`;
            el.classList.add('anim'); setTimeout(()=>el.classList.remove('anim'), 300);
        }

        // --- YOUTUBE ---
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
                playerVars: { controls:0, rel:0, playsinline:1, iv_load_policy:3, disablekb:1, modestbranding:1, origin:window.location.origin },
                events: { 'onStateChange': (e) => this.onState(e) }
            });
        }

        onState(e) {
            const s = e.data;
            this.container.querySelector(`#spin-${this.uid}`).style.display = 'none';
            const icon = this.container.querySelector(`#play-${this.uid} span`);

            if(s === YT.PlayerState.PLAYING) {
                this.isPlaying = true;
                this.container.querySelector(`#v-wrap-${this.uid}`).classList.add('active');
                icon.innerText = 'pause';
                this.resetUITimer();
                this.startLoop();
            } else if (s === YT.PlayerState.PAUSED) {
                this.isPlaying = false;
                icon.innerText = 'play_arrow';
                this.container.querySelector(`#ui-${this.uid}`).classList.remove('mp-hidden');
            } else if (s === YT.PlayerState.BUFFERING) {
                this.container.querySelector(`#spin-${this.uid}`).style.display = 'block';
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
                    this.container.querySelector(`#time-${this.uid}`).innerText = `${fmt(c)}`;
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
