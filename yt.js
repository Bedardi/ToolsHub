(function() {
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        :root { --primary: #E50914; --bg: #000; --text: #fff; }

        .mp-container { position: relative; width: 100%; background: var(--bg); overflow: hidden; font-family: 'Inter', sans-serif; border-radius: 8px; aspect-ratio: 16/9; touch-action: none; }
        
        /* OTT Zoom & Masking */
        .mp-video-wrap { position: absolute; inset: 0; transform: scale(1.45); pointer-events: none; }
        .mp-video-wrap iframe { width: 100%; height: 100%; border: none; }

        /* Indicators */
        .mp-vol-bright-hint { position: absolute; top: 20%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); padding: 8px 20px; border-radius: 30px; color: #fff; display: none; align-items: center; gap: 10px; z-index: 600; font-size: 14px; border: 1px solid #333; }

        /* Custom UI */
        .mp-ui { position: absolute; inset: 0; z-index: 100; background: linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 40%, rgba(0,0,0,0.8) 100%); display: flex; flex-direction: column; justify-content: space-between; transition: 0.3s; }
        .mp-ui.hidden { opacity: 0; pointer-events: none; }

        .mp-top { padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        .mp-btm { padding: 10px 15px 20px; }
        
        /* Modern Range/Seekbar */
        .mp-seek-container { width: 100%; height: 25px; display: flex; align-items: center; position: relative; }
        .mp-range { width: 100%; -webkit-appearance: none; background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; outline: none; }
        .mp-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: var(--primary); border-radius: 50%; border: 2px solid #fff; cursor: pointer; }

        .mp-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
        .mp-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 5px; display: flex; transition: 0.2s; }
        .mp-btn .material-icons-round { font-size: 32px; }

        /* Global App Bottom Sheet (Fixed to Body) */
        .ott-global-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; align-items: flex-end; backdrop-filter: blur(5px); }
        .ott-global-overlay.active { display: flex; }
        .ott-global-sheet { width: 100%; background: #1a1a1a; border-radius: 24px 24px 0 0; padding-bottom: 40px; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0,0,0.2,1); }
        .ott-global-overlay.active .ott-global-sheet { transform: translateY(0); }
        .ott-item { padding: 18px 25px; color: #fff; display: flex; align-items: center; justify-content: space-between; font-size: 16px; border-bottom: 1px solid #252525; cursor: pointer; }
        .ott-item.active { color: var(--primary); font-weight: 600; }

        /* Ad System */
        .mp-ad-box { position: absolute; inset: 0; z-index: 800; background: #000; display: none; align-items: center; justify-content: center; }
        .mp-ad-box.active { display: flex; }
        .mp-skip { position: absolute; bottom: 30px; right: 0; background: rgba(0,0,0,0.9); color: #fff; padding: 12px 25px; font-size: 14px; cursor: pointer; border: 1px solid #444; border-right:none; }
        
        .mp-spin { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 45px; height: 45px; border: 4px solid rgba(255,255,255,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; display: none; z-index: 200; }
        @keyframes spin { 100% { transform: translate(-50%, -50%) rotate(360deg); } }
    `;

    if(!document.getElementById('mista-final-css')) {
        const s = document.createElement('style'); s.id='mista-final-css'; s.innerHTML=css; document.head.appendChild(s);
    }

    class MistaOTT {
        constructor(el) {
            this.container = el;
            this.vid = this.extractID(el.getAttribute('data-vid'));
            this.uid = Math.random().toString(36).substr(2, 9);
            this.player = null;
            this.isPlaying = false;
            this.isLocked = false;
            this.render();
            this.initYT();
            this.initGlobalSheet();
        }

        extractID(s) { const m = s.match(/(?:v=|\/|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/); return m?m[1]:s; }

        render() {
            const thumb = `https://img.youtube.com/vi/${this.vid}/maxresdefault.jpg`;
            this.container.innerHTML = `
                <div class="mp-container" id="box-${this.uid}">
                    <div class="mp-video-wrap"><div id="yt-${this.uid}"></div></div>
                    <div class="mp-spin" id="spin-${this.uid}"></div>
                    <div class="mp-vol-bright-hint" id="hint-${this.uid}"></div>

                    <div class="mp-ad-box" id="ad-box-${this.uid}">
                        <div id="ad-content-${this.uid}" style="width:100%;height:100%"></div>
                        <div class="mp-skip" id="skip-${this.uid}">ADVERTISEMENT</div>
                    </div>

                    <div class="mp-layer" id="poster-${this.uid}" style="position:absolute; inset:0; background:url('${thumb}') center/cover; z-index:500; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                        <div style="width:75px; height:75px; background:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
                            <span class="material-icons-round" style="color:#fff; font-size:48px;">play_arrow</span>
                        </div>
                    </div>

                    <div class="mp-ui" id="ui-${this.uid}">
                        <div class="mp-top">
                            <span style="color:#fff; font-size:14px; font-weight:600; text-shadow:0 2px 4px #000;" id="title-${this.uid}">Loading...</span>
                            <button class="mp-btn" id="lock-btn-${this.uid}"><span class="material-icons-round">lock_open</span></button>
                        </div>
                        <div class="mp-btm">
                            <div class="mp-seek-container">
                                <input type="range" class="mp-range" id="seek-${this.uid}" value="0">
                            </div>
                            <div class="mp-controls">
                                <div style="display:flex; align-items:center; gap:15px;">
                                    <button class="mp-btn" id="play-${this.uid}"><span class="material-icons-round">play_arrow</span></button>
                                    <span style="color:#fff; font-size:12px;" id="time-${this.uid}">00:00 / 00:00</span>
                                </div>
                                <div style="display:flex; gap:10px;">
                                    <button class="mp-btn" id="set-btn-${this.uid}"><span class="material-icons-round">tune</span></button>
                                    <button class="mp-btn" id="fs-btn-${this.uid}"><span class="material-icons-round">fullscreen</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.setupGestures();
            this.setupEvents();
        }

        initGlobalSheet() {
            if(!document.getElementById('ott-sheet-overlay')) {
                const ov = document.createElement('div');
                ov.id = 'ott-sheet-overlay';
                ov.className = 'ott-global-overlay';
                ov.innerHTML = `<div class="ott-global-sheet"><div id="ott-sheet-data"></div></div>`;
                document.body.appendChild(ov);
                ov.onclick = (e) => { if(e.target === ov) ov.classList.remove('active'); };
            }
        }

        setupEvents() {
            const c = this.container;
            c.querySelector(`#poster-${this.uid}`).onclick = () => {
                let count = parseInt(localStorage.getItem('mp_ad_track') || '0');
                if(count >= 2) { localStorage.setItem('mp_ad_track', '0'); this.runAd(); }
                else { localStorage.setItem('mp_ad_track', count + 1); this.startVideo(); }
            };

            c.querySelector(`#play-${this.uid}`).onclick = () => {
                if(this.isPlaying) this.player.pauseVideo(); else this.player.playVideo();
            };

            const seek = c.querySelector(`#seek-${this.uid}`);
            seek.oninput = () => {
                const time = (seek.value / 100) * this.player.getDuration();
                this.player.seekTo(time, true);
            };

            c.querySelector(`#set-btn-${this.uid}`).onclick = () => this.openSheet('main');
            
            c.querySelector(`#fs-btn-${this.uid}`).onclick = () => {
                const b = c.querySelector(`#box-${this.uid}`);
                if(!document.fullscreenElement) b.requestFullscreen(); else document.exitFullscreen();
            };
        }

        setupGestures() {
            const box = this.container.querySelector(`#box-${this.uid}`);
            let startY = 0;
            box.addEventListener('touchstart', (e) => startY = e.touches[0].clientY);
            box.addEventListener('touchmove', (e) => {
                if(this.isLocked || !this.isPlaying) return;
                const deltaY = startY - e.touches[0].clientY;
                const rect = box.getBoundingClientRect();
                const x = e.touches[0].clientX - rect.left;
                if(x > rect.width / 2) {
                    let vol = this.player.getVolume();
                    this.player.setVolume(Math.max(0, Math.min(100, vol + (deltaY > 0 ? 2 : -2))));
                    this.showHint('volume_up', this.player.getVolume() + '%');
                }
            });
        }

        openSheet(type) {
            const ov = document.getElementById('ott-sheet-overlay');
            const data = document.getElementById('ott-sheet-data');
            let html = '';

            if(type === 'main') {
                html = `<div class="ott-item" onclick="window.dispatchEvent(new CustomEvent('ott_menu',{detail:'quality'}))"><span>Quality</span><span class="material-icons-round">hd</span></div>
                        <div class="ott-item" onclick="window.dispatchEvent(new CustomEvent('ott_menu',{detail:'speed'}))"><span>Speed</span><span class="material-icons-round">speed</span></div>`;
            } else if(type === 'quality') {
                const levels = ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'];
                html = levels.map(l => `<div class="ott-item q-set" data-val="${l}"><span>${l.toUpperCase()}</span></div>`).join('');
            }

            data.innerHTML = html;
            ov.classList.add('active');

            // Handle Clicks inside Sheet
            window.addEventListener('ott_menu', (e) => this.openSheet(e.detail), {once:true});
            data.querySelectorAll('.q-set').forEach(i => {
                i.onclick = () => {
                    const val = i.getAttribute('data-val');
                    const time = this.player.getCurrentTime();
                    this.player.setPlaybackQuality(val);
                    // REAL QUALITY CHANGE HACK: Re-seek after small delay
                    setTimeout(() => this.player.seekTo(time, true), 100);
                    ov.classList.remove('active');
                };
            });
        }

        runAd() {
            const box = this.container.querySelector(`#ad-box-${this.uid}`);
            const skip = this.container.querySelector(`#skip-${this.uid}`);
            box.classList.add('active');
            
            const script = document.createElement('script');
            script.src = "https://MistaFy.pages.dev/ads.js?" + Math.random();
            this.container.querySelector(`#ad-content-${this.uid}`).appendChild(script);

            let s = 5;
            const t = setInterval(() => {
                s--;
                if(s <= 0) {
                    clearInterval(t);
                    skip.innerText = "SKIP AD";
                    skip.onclick = () => { box.classList.remove('active'); this.startVideo(); };
                } else { skip.innerText = `SKIP IN ${s}S`; }
            }, 1000);
        }

        startVideo() {
            this.container.querySelector(`#poster-${this.uid}`).style.display = 'none';
            this.player.playVideo();
        }

        initYT() {
            if(!window.YT) {
                const s = document.createElement('script'); s.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(s);
                window.onYouTubeIframeAPIReady = () => this.createPlayer();
            } else { this.createPlayer(); }
        }

        createPlayer() {
            this.player = new YT.Player(`yt-${this.uid}`, {
                videoId: this.vid,
                playerVars: { controls:0, modestbranding:1, rel:0, playsinline:1, iv_load_policy:3 },
                events: {
                    'onReady': () => this.loadMeta(),
                    'onStateChange': (e) => {
                        const spin = this.container.querySelector(`#spin-${this.uid}`);
                        const btn = this.container.querySelector(`#play-${this.uid} span`);
                        if(e.data === 1) { 
                            this.isPlaying = true; spin.style.display = 'none'; btn.innerText = 'pause'; 
                            this.loop();
                        } else if(e.data === 3) { spin.style.display = 'block'; }
                        else { this.isPlaying = false; btn.innerText = 'play_arrow'; }
                    }
                }
            });
        }

        loop() {
            const it = setInterval(() => {
                if(!this.isPlaying) { clearInterval(it); return; }
                const cur = this.player.getCurrentTime();
                const dur = this.player.getDuration();
                this.container.querySelector(`#seek-${this.uid}`).value = (cur/dur) * 100;
                const fmt = (s) => new Date(s * 1000).toISOString().substr(14, 5);
                this.container.querySelector(`#time-${this.uid}`).innerText = `${fmt(cur)} / ${fmt(dur)}`;
            }, 500);
        }

        showHint(icon, text) {
            const h = this.container.querySelector(`#hint-${this.uid}`);
            h.innerHTML = `<span class="material-icons-round">${icon}</span> ${text}`;
            h.style.display = 'flex';
            clearTimeout(this.ht);
            this.ht = setTimeout(() => h.style.display = 'none', 1000);
        }

        async loadMeta() {
            try {
                const r = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${this.vid}`);
                const d = await r.json(); this.container.querySelector(`#title-${this.uid}`).innerText = d.title;
            } catch(e){}
        }
    }

    const boot = () => { document.querySelectorAll('.mista-embed').forEach(el => { if(!el.getAttribute('data-init')) { new MistaOTT(el); el.setAttribute('data-init', 'true'); } }); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
