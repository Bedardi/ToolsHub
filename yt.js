(function() {
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        
        /* --- CONTAINER --- */
        .mp-container { 
            position: relative; width: 100%; height: 100%; 
            background: #000; overflow: hidden; 
            font-family: 'Poppins', sans-serif; user-select: none; 
            border-radius: 12px; aspect-ratio: 16/9; 
            -webkit-tap-highlight-color: transparent;
        }

        /* --- 1. VIDEO LAYER (FIXED: Always Visible) --- */
        .mp-video-wrap { 
            position: absolute; inset: 0; width: 100%; height: 100%; 
            z-index: 1; pointer-events: none; /* KEY: Clicks pass through */
        }
        .mp-video { width: 100%; height: 100%; border: none; }

        /* --- 2. CLICK SHIELD (The Wall) --- */
        /* This transparent layer sits on top of YouTube and catches ALL clicks */
        .mp-shield { 
            position: absolute; inset: 0; z-index: 5; 
            background: rgba(0,0,0,0.01); /* Tiny opacity to ensure click capture */
            cursor: pointer;
        }

        /* --- 3. ADS LAYER --- */
        .mp-ad-layer { 
            position: absolute; inset: 0; z-index: 100; background: #000; 
            display: none; flex-direction: column; align-items: center; justify-content: center;
            pointer-events: auto;
        }
        .mp-ad-layer.active { display: flex; }
        .mp-ad-slot { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        
        .mp-skip-btn {
            position: absolute; bottom: 30px; right: 20px;
            background: #e50914; color: #fff; border: none;
            padding: 8px 20px; border-radius: 4px; font-size: 13px; font-weight: 700; text-transform: uppercase;
            cursor: pointer; pointer-events: none; opacity: 0.5; transition: 0.2s;
        }
        .mp-skip-btn.ready { opacity: 1; pointer-events: auto; }

        /* --- 4. POSTER & SPINNER --- */
        .mp-poster { 
            position: absolute; inset: 0; z-index: 10; 
            background: #000 no-repeat center/cover; pointer-events: auto;
            transition: opacity 0.2s;
        }
        .mp-start-btn {
            width: 70px; height: 70px; background: rgba(0,0,0,0.6); 
            border: 2px solid #fff; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            z-index: 50; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            cursor: pointer; pointer-events: none; /* Clicks go to poster */
        }

        .mp-spinner {
            width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); 
            border-top: 3px solid #e50914; border-radius: 50%; 
            animation: spin 0.8s infinite linear; 
            position: absolute; top:50%; left:50%; margin:-20px; 
            display: none; z-index: 15; pointer-events: none;
        }

        /* --- 5. UI CONTROLS --- */
        .mp-ui { 
            position: absolute; inset: 0; z-index: 20; 
            display: flex; flex-direction: column; justify-content: space-between; 
            background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.9) 100%);
            transition: opacity 0.2s ease; opacity: 1; pointer-events: none;
        }
        .mp-ui.mp-hidden { opacity: 0; }
        
        /* Interactive Parts */
        .mp-btm, .mp-seek-container, .mp-icon-btn, .mp-lock-btn { pointer-events: auto; }

        .mp-lock-btn {
            position: absolute; left: 20px; top: 50%; transform: translateY(-50%); z-index: 55;
            width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: white;
            backdrop-filter: blur(5px); opacity: 0; pointer-events: none; transition: 0.3s; cursor: pointer;
        }
        .mp-lock-btn.visible { opacity: 1; pointer-events: auto; }
        .mp-lock-btn.locked { background: white; color: black; opacity: 1; }

        .mp-btm { padding: 15px 20px; display: flex; flex-direction: column; gap: 10px; }
        
        .mp-seek-container { width: 100%; height: 20px; display: flex; align-items: center; cursor: pointer; position: relative; }
        .mp-seek-track { width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 4px; position: relative; width: 100%; }
        .mp-seek-fill { height: 100%; background: #e50914; border-radius: 4px; width: 0%; position: relative; }
        .mp-seek-thumb { 
            position: absolute; right: -6px; top: -5px; width: 14px; height: 14px; 
            background: #fff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            transform: scale(0); transition: transform 0.1s; 
        }
        .mp-seek-container:hover .mp-seek-thumb { transform: scale(1.3); }

        .mp-row { display: flex; justify-content: space-between; align-items: center; }
        .mp-icon-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 5px; opacity: 0.9; transition: 0.2s; }
        .mp-icon-btn:hover { opacity: 1; transform: scale(1.1); }
        .mp-time { font-size: 12px; color: #ddd; font-weight: 600; margin-left: 10px; min-width: 80px; }

        /* --- 6. MENUS --- */
        .mp-menu-bg { position: absolute; inset: 0; z-index: 200; background: rgba(0,0,0,0.7); opacity: 0; pointer-events: none; transition: 0.3s; display: flex; flex-direction: column; justify-content: flex-end; }
        .mp-menu-bg.active { opacity: 1; pointer-events: auto; }
        .mp-menu { background: #1a1a1a; width: 100%; border-radius: 16px 16px 0 0; padding: 10px 0; transform: translateY(100%); transition: 0.3s cubic-bezier(0.2, 0, 0, 1); max-height: 60%; overflow-y: auto; }
        .mp-menu-bg.active .mp-menu { transform: translateY(0); }
        .mp-menu-item { padding: 15px 20px; color: #ccc; font-size: 13px; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between; }
        .mp-menu-item.active { color: #e50914; font-weight: 700; }

        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    if(!document.getElementById('mista-fixed-css')) {
        const s = document.createElement('style'); s.id = 'mista-fixed-css'; s.innerHTML = css; document.head.appendChild(s);
    }

    class MistaPlayer {
        constructor(el) {
            this.container = el;
            this.rawSource = el.getAttribute('data-vid');
            this.videoId = this.extractID(this.rawSource);
            this.uid = Math.random().toString(36).substr(2, 9);
            
            this.player = null;
            this.isPlaying = false;
            this.isLocked = false;
            this.isDragging = false;
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
                    
                    <div class="mp-video-wrap">
                        <div id="yt-${this.uid}" class="mp-video"></div>
                    </div>

                    <div class="mp-shield" id="shield-${this.uid}"></div>

                    <div class="mp-ad-layer" id="ad-layer-${this.uid}">
                        <div class="mp-ad-slot" id="ad-slot-${this.uid}"></div>
                        <button class="mp-skip-btn" id="skip-${this.uid}">Skip Ad</button>
                    </div>

                    <div class="mp-poster" id="poster-${this.uid}" style="background-image: url('${poster}');">
                        <div class="mp-start-btn" id="start-${this.uid}">
                            <span class="material-icons-round" style="font-size: 36px; color: white;">play_arrow</span>
                        </div>
                    </div>

                    <div class="mp-spinner" id="spin-${this.uid}"></div>

                    <div class="mp-lock-btn" id="lock-${this.uid}"><span class="material-icons-round">lock_open</span></div>

                    <div class="mp-ui mp-hidden" id="ui-${this.uid}">
                        <div style="padding:15px; text-align:right;">
                            <span class="material-icons-round" style="color:rgba(255,255,255,0.7); font-size:20px;">cast</span>
                        </div>
                        <div class="mp-btm">
                            <div class="mp-seek-container" id="seek-${this.uid}">
                                <div class="mp-seek-track">
                                    <div class="mp-seek-fill" id="fill-${this.uid}"></div>
                                    <div class="mp-seek-thumb"></div>
                                </div>
                            </div>
                            <div class="mp-row">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <button class="mp-icon-btn" id="play-${this.uid}"><span class="material-icons-round" style="font-size:30px;">play_arrow</span></button>
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
            this.container.querySelector(`#list-q-${this.uid}`).innerHTML = `<div style="padding:15px; font-weight:bold; color:white;">Quality</div>` + qHTML;

            const sList = [0.5, 1, 1.25, 1.5, 2];
            const sHTML = sList.map(s => `<div class="mp-menu-item ${s===1?'active':''}" data-val="${s}">${s}x Normal</div>`).join('');
            this.container.querySelector(`#list-s-${this.uid}`).innerHTML = `<div style="padding:15px; font-weight:bold; color:white;">Playback Speed</div>` + sHTML;
        }

        attachEvents() {
            const c = this.container;
            const shield = c.querySelector(`#shield-${this.uid}`);
            
            // --- POSTER CLICK (Start) ---
            c.querySelector(`#poster-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                if(!this.adWatched) this.playAd(); else this.playVideo();
            });

            // --- SKIP AD ---
            c.querySelector(`#skip-${this.uid}`).addEventListener('click', (e) => { e.stopPropagation(); this.closeAd(); });

            // --- CONTROLS ---
            c.querySelector(`#play-${this.uid}`).addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
            
            // --- LOCK ---
            c.querySelector(`#lock-${this.uid}`).addEventListener('click', (e) => {
                e.stopPropagation();
                this.isLocked = !this.isLocked;
                const btn = c.querySelector(`#lock-${this.uid}`);
                const icon = btn.querySelector('span');
                const ui = c.querySelector(`#ui-${this.uid}`);
                
                if(this.isLocked) {
                    btn.classList.add('locked');
                    icon.innerText = 'lock';
                    ui.classList.add('mp-hidden');
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('locked');
                    icon.innerText = 'lock_open';
                    ui.classList.remove('mp-hidden');
                    this.resetUITimer();
                }
            });

            // --- SHIELD TAP (Handle all non-button taps) ---
            let lastTap = 0;
            shield.addEventListener('click', (e) => {
                if(this.isAdPlaying) return;
                e.stopPropagation();

                const now = new Date().getTime();
                if(now - lastTap < 300) {
                    // Double Tap
                    const width = shield.offsetWidth;
                    const x = e.clientX - shield.getBoundingClientRect().left;
                    this.player.seekTo(this.player.getCurrentTime() + (x > width/2 ? 10 : -10), true);
                } else {
                    // Single Tap
                    setTimeout(() => {
                        if(new Date().getTime() - lastTap >= 300) {
                            if(this.isLocked) {
                                const l = c.querySelector(`#lock-${this.uid}`);
                                l.classList.add('visible'); setTimeout(()=>l.classList.remove('visible'), 2000);
                            } else {
                                const ui = c.querySelector(`#ui-${this.uid}`);
                                ui.classList.toggle('mp-hidden');
                                c.querySelector(`#lock-${this.uid}`).classList.toggle('visible');
                                if(!ui.classList.contains('mp-hidden')) this.resetUITimer();
                            }
                        }
                    }, 305);
                }
                lastTap = now;
            });

            // --- DRAGGABLE SEEK ---
            const seekBox = c.querySelector(`#seek-${this.uid}`);
            const handleDrag = (e) => {
                if(this.isLocked || this.isAdPlaying) return;
                const rect = seekBox.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                let pct = (clientX - rect.left) / rect.width;
                pct = Math.max(0, Math.min(1, pct));
                c.querySelector(`#fill-${this.uid}`).style.width = (pct*100)+'%';
                
                if(e.type === 'touchend' || e.type === 'mouseup' || e.type === 'click') {
                    this.isDragging = false;
                    this.player.seekTo(this.player.getDuration() * pct, true);
                    this.player.playVideo();
                } else this.isDragging = true;
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

            this.setupMenu('q'); this.setupMenu('s');
        }

        setupMenu(type) {
            const btn = this.container.querySelector(`#${type}-btn-${this.uid}`);
            const menu = this.container.querySelector(`#menu-${type}-${this.uid}`);
            btn.addEventListener('click', (e)=>{ e.stopPropagation(); menu.classList.add('active'); });
            menu.addEventListener('click', (e)=>{
                e.stopPropagation();
                if(e.target === menu) menu.classList.remove('active');
                if(e.target.classList.contains('mp-menu-item')) {
                    menu.querySelectorAll('.mp-menu-item').forEach(el=>el.classList.remove('active'));
                    e.target.classList.add('active');
                    const v = e.target.getAttribute('data-val');
                    if(type==='q') this.player.setPlaybackQuality(v); else this.player.setPlaybackRate(parseFloat(v));
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
            }, 3000);
        }

        // --- AD LOGIC ---
        playAd() {
            this.isAdPlaying = true;
            this.container.querySelector(`#poster-${this.uid}`).style.display = 'none'; // Hide poster to show ad
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
                else { clearInterval(t); btn.innerText = "Skip Ad"; btn.classList.add('ready'); }
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
            this.container.querySelector(`#spin-${this.uid}`).style.display = 'block';
            if(this.player && this.player.playVideo) this.player.playVideo();
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
                    controls: 0, 
                    disablekb: 1, 
                    fs: 0, 
                    rel: 0, 
                    iv_load_policy: 3, 
                    modestbranding: 1,
                    playsinline: 1
                },
                events: { 'onStateChange': (e) => this.onState(e) }
            });
        }

        onState(e) {
            const s = e.data;
            this.container.querySelector(`#spin-${this.uid}`).style.display = 'none';
            const icon = this.container.querySelector(`#play-${this.uid} span`);

            if(s === YT.PlayerState.PLAYING) {
                this.isPlaying = true;
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
