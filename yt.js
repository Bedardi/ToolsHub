(function() {
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        
        /* PLAYER BOX */
        .mp-container { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'Poppins', sans-serif; user-select: none; border-radius: 12px; aspect-ratio: 16/9; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; }

        /* 1. YOUTUBE VIDEO (Zoomed to hide controls) */
        .mp-video { width: 100%; height: 100%; transform: scale(1.35); border: none; pointer-events: none; }
        .mp-video-wrap { z-index: 1; pointer-events: none; opacity: 1; }

        /* 2. AD OVERLAY (The Special Layer) */
        .mp-ad-overlay { 
            position: absolute; inset: 0; z-index: 9999; background: #000; 
            display: none; flex-direction: column; align-items: center; justify-content: center;
        }
        .mp-ad-overlay.active { display: flex; }
        
        .mp-skip-btn {
            position: absolute; bottom: 20px; right: 20px; z-index: 10000;
            background: rgba(0,0,0,0.8); color: white; border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 25px; border-radius: 4px; font-size: 14px; font-weight: 600; 
            cursor: pointer; pointer-events: none; opacity: 0.5; transition: 0.2s;
        }
        .mp-skip-btn.ready { pointer-events: auto; opacity: 1; background: #e50914; border-color: #e50914; }

        /* 3. POSTER */
        .mp-poster { z-index: 10; background: #000 no-repeat center/cover; display: flex; align-items: center; justify-content: center; transition: opacity 0.3s; }
        
        /* 4. UI CONTROLS */
        .mp-ui { z-index: 20; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(0deg, rgba(0,0,0,0.9), transparent 40%, rgba(0,0,0,0.6)); transition: opacity 0.3s; opacity: 1; pointer-events: none; }
        .mp-ui.mp-hidden { opacity: 0; }
        .mp-btm, .mp-big-play { pointer-events: auto; }

        /* Components */
        .mp-big-play { width: 70px; height: 70px; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); cursor: pointer; transition: transform 0.2s; }
        .mp-big-play:hover { background: #e50914; border-color: #e50914; transform: scale(1.1); }
        .mp-spinner { width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #e50914; border-radius: 50%; animation: spin 0.8s infinite linear; position: absolute; top:50%; left:50%; margin:-25px; display: none; z-index: 5; }
        
        .mp-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 10px; display: flex; pointer-events: auto; }
        .mp-seek-wrap { width: 100%; height: 20px; display: flex; align-items: center; cursor: pointer; position: relative; pointer-events: auto; }
        .mp-seek-bg { position: absolute; width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 10px; }
        .mp-seek-fill { position: absolute; height: 4px; background: #e50914; border-radius: 10px; width: 0%; }
        .mp-seek-thumb { position: absolute; width: 14px; height: 14px; background: #fff; border-radius: 50%; left: 0%; transform: translateX(-50%); }

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
            this.adWatched = false; // Track if ad is seen
            
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
                    
                    <div class="mp-layer mp-video-wrap">
                        <div id="yt-${this.uid}" class="mp-video"></div>
                    </div>

                    <div class="mp-ad-overlay" id="ad-layer-${this.uid}">
                        <div id="ad-slot-${this.uid}"></div>
                        <div class="mp-skip-btn" id="skip-${this.uid}">Skip in 5</div>
                    </div>

                    <div class="mp-layer mp-poster" id="poster-${this.uid}" style="background-image: url('${posterUrl}');">
                        <div class="mp-big-play" id="start-${this.uid}"><span class="material-icons-round" style="font-size:40px; color:white;">play_arrow</span></div>
                    </div>

                    <div class="mp-spinner" id="spin-${this.uid}"></div>

                    <div class="mp-layer mp-ui mp-hidden" id="ui-${this.uid}">
                        <div style="padding:20px; color:white; font-size:14px; font-weight:600; pointer-events:none;" class="mp-title">Loading...</div>
                        <div class="mp-btm">
                            <div class="mp-seek-wrap">
                                <div class="mp-seek-bg"></div>
                                <div class="mp-seek-fill"></div>
                                <div class="mp-seek-thumb"></div>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <button class="mp-btn" id="play-${this.uid}"><span class="material-icons-round" style="font-size:28px;">play_arrow</span></button>
                                    <span style="color:#ddd; font-size:12px; font-weight:500;" id="time-${this.uid}">0:00 / 0:00</span>
                                </div>
                                <button class="mp-btn" id="fs-${this.uid}"><span class="material-icons-round" style="font-size:28px;">fullscreen</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            this.events();
            this.getTitle();
        }

        events() {
            const c = this.container;
            
            // --- MAIN LOGIC: START BUTTON ---
            c.querySelector(`#start-${this.uid}`).addEventListener('click', () => {
                if(!this.adWatched) {
                    this.playAd(); // Pehle Ad chalao
                } else {
                    this.playMovie(); // Ad dekh liya, ab movie chalao
                }
            });

            // Skip Ad Button
            c.querySelector(`#skip-${this.uid}`).addEventListener('click', () => this.closeAd());

            // Normal Controls
            c.querySelector(`#play-${this.uid}`).addEventListener('click', () => this.toggle());
            c.querySelector(`#fs-${this.uid}`).addEventListener('click', () => {
                const box = c.querySelector(`#box-${this.uid}`);
                if(!document.fullscreenElement) box.requestFullscreen(); else document.exitFullscreen();
            });

            // UI Toggle
            c.querySelector(`#box-${this.uid}`).addEventListener('click', (e) => {
                if(e.target.closest('.mp-btn') || e.target.closest('.mp-seek-wrap') || this.isAdPlaying) return;
                c.querySelector(`#ui-${this.uid}`).classList.toggle('mp-hidden');
            });
        }

        // --- AD FUNCTIONALITY ---
        playAd() {
            this.isAdPlaying = true;
            const adLayer = this.container.querySelector(`#ad-layer-${this.uid}`);
            const adSlot = this.container.querySelector(`#ad-slot-${this.uid}`);
            const skipBtn = this.container.querySelector(`#skip-${this.uid}`);
            
            // 1. Show Layer
            adLayer.classList.add('active');
            
            // 2. Inject Script (Ye wahi code hai jo tumne diya)
            adSlot.innerHTML = `<div class="mista-ad" data-cat="Entertainment" style="width:300px;height:250px;display:flex;align-items:center;justify-content:center;background:#111;color:#555;">Loading Ad...</div>`;
            const s = document.createElement('script');
            s.type = 'module';
            s.src = "https://MistaFy.pages.dev/ads.js?" + Math.random();
            adSlot.appendChild(s);

            // 3. Timer
            let count = 5;
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

        closeAd() {
            const adLayer = this.container.querySelector(`#ad-layer-${this.uid}`);
            const adSlot = this.container.querySelector(`#ad-slot-${this.uid}`);
            
            // 1. Hide Layer
            adLayer.classList.remove('active');
            
            // 2. CLEANUP (Bahut Zaruri: Ad ko remove kar do taaki audio band ho jaye)
            adSlot.innerHTML = ''; 
            
            // 3. Mark as watched & Play Movie
            this.isAdPlaying = false;
            this.adWatched = true;
            this.playMovie();
        }

        playMovie() {
            this.container.querySelector(`#poster-${this.uid}`).style.display = 'none';
            this.container.querySelector(`#spin-${this.uid}`).style.display = 'block';
            if(this.player && this.player.playVideo) this.player.playVideo();
        }

        // --- YOUTUBE CORE ---
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
                playerVars: { controls:0, rel:0, playsinline:1, origin:window.location.origin, iv_load_policy:3, disablekb:1 },
                events: { 'onStateChange': (e) => this.stateChange(e) }
            });
        }

        stateChange(e) {
            const s = e.data;
            const spin = this.container.querySelector(`#spin-${this.uid}`);
            const btn = this.container.querySelector(`#play-${this.uid} span`);
            
            spin.style.display = 'none';

            if(s === YT.PlayerState.PLAYING) {
                this.isPlaying = true;
                btn.innerText = 'pause';
                this.loop();
                // Auto hide UI
                setTimeout(() => { if(this.isPlaying) this.container.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden'); }, 2000);
            } else if (s === YT.PlayerState.PAUSED) {
                this.isPlaying = false;
                btn.innerText = 'play_arrow';
                this.container.querySelector(`#ui-${this.uid}`).classList.remove('mp-hidden');
            } else if (s === YT.PlayerState.BUFFERING) spin.style.display = 'block';
        }

        toggle() { if(this.isPlaying) this.player.pauseVideo(); else this.player.playVideo(); }

        loop() {
            setInterval(() => {
                if(this.player && this.player.getCurrentTime) {
                    const c = this.player.getCurrentTime();
                    const d = this.player.getDuration();
                    const pct = (c/d)*100;
                    this.container.querySelector('.mp-seek-fill').style.width = pct + '%';
                    this.container.querySelector('.mp-seek-thumb').style.left = pct + '%';
                    const fmt = (t) => { const m=Math.floor(t/60), s=Math.floor(t%60); return `${m}:${s<10?'0':''}${s}`; };
                    this.container.querySelector(`#time-${this.uid}`).innerText = `${fmt(c)} / ${fmt(d)}`;
                }
            }, 500);
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
            if(!el.getAttribute('data-init')) { new MistaPlayer(el); el.setAttribute('data-init', 'true'); }
        });
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
