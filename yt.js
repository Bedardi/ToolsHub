(function() {
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

        .mp-container { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'Poppins', sans-serif; user-select: none; border-radius: 12px; aspect-ratio: 16/9; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; }

        .mp-video-wrap { z-index: 1; pointer-events: none; opacity: 0; transition: opacity 0.4s ease-in; }
        .mp-video-wrap.active { opacity: 1; }
        .mp-video { width: 100%; height: 100%; transform: scale(1.6); border: none; }

        .mp-ad-layer { z-index: 100; background: #000; display: none; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto; }
        .mp-ad-layer.active { display: flex; }
        .mp-ad-slot { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .mp-skip-btn { position: absolute; bottom: 30px; right: 20px; background: #e50914; color: #fff; border: none; padding: 8px 24px; border-radius: 4px; font-size: 13px; font-weight: 700; text-transform: uppercase; cursor: pointer; opacity: 0.5; pointer-events: none; transition: 0.3s; }
        .mp-skip-btn.ready { opacity: 1; pointer-events: auto; }

        .mp-poster { z-index: 5; background: #000 no-repeat center/cover; display: flex; align-items: center; justify-content: center; transition: opacity 0.3s; }
        .mp-ui { z-index: 10; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(0deg, rgba(0,0,0,0.95), transparent 35%, rgba(0,0,0,0.8)); transition: opacity 0.3s; opacity: 1; }
        .mp-ui.mp-hidden { opacity: 0; pointer-events: none; }

        .mp-big-play { width: 70px; height: 70px; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); cursor: pointer; transition: transform 0.2s; z-index: 6; }
        .mp-big-play:hover { background: #e50914; border-color: #e50914; transform: scale(1.1); }
        .mp-spinner { width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #e50914; border-radius: 50%; animation: spin 0.8s infinite linear; position: absolute; top:50%; left:50%; margin:-25px; display: none; z-index: 20; }
        .mp-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 6px; display: flex; opacity: 0.9; transition: 0.2s; }
        .mp-btn:hover { color: #e50914; transform: scale(1.1); opacity: 1; }

        .mp-btm { padding: 15px; display: flex; flex-direction: column; gap: 8px; }
        .mp-row { display: flex; justify-content: space-between; align-items: center; }
        .mp-grp { display: flex; align-items: center; gap: 8px; }
        .mp-title { color: white; font-size: 14px; font-weight: 600; text-shadow: 0 2px 4px black; padding: 20px; max-width: 80%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .mp-time { font-size: 11px; opacity: 0.8; font-family: monospace; color:white; margin-left:5px; }

        /* Updated Seek Bar Styles */
        .mp-seek-wrap { width: 100%; height: 20px; display: flex; align-items: center; cursor: pointer; position: relative; pointer-events: auto; }
        .mp-seek-bg { position: absolute; width: 100%; height: 4px; background: rgba(255,255,255,0.2); border-radius: 10px; }
        .mp-seek-fill { position: absolute; height: 4px; background: #e50914; border-radius: 10px; width: 0%; }
        .mp-seek-thumb { position: absolute; width: 14px; height: 14px; background: #fff; border-radius: 50%; left: 0%; transform: translate(-50%, 0%); box-shadow: 0 2px 5px black; transition: transform 0.1s; }
        .mp-seek-wrap.dragging .mp-seek-thumb { transform: translate(-50%, 0%) scale(1.4); }

        .mp-feedback { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.2s; z-index: 25; }
        .mp-feedback.anim { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        .mp-tap { position: absolute; top:0; bottom:0; width: 35%; z-index: 15; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; background: radial-gradient(circle, rgba(255,255,255,0.1), transparent); transition: 0.2s; }
        .mp-tap-l { left: 0; }
        .mp-tap-r { right: 0; }
        .mp-replay { position: absolute; inset: 0; z-index: 30; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; }
        .mp-replay.visible { opacity: 1; pointer-events: auto; }

        .mp-overlay { position: absolute; inset: 0; z-index: 60; background: rgba(0,0,0,0.7); display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; pointer-events: none; transition: 0.3s; }
        .mp-overlay.active { opacity: 1; pointer-events: auto; }
        .mp-sheet { background: #151515; width: 100%; padding: 15px; border-radius: 20px 20px 0 0; transform: translateY(100%); transition: transform 0.3s; max-height: 60%; overflow-y: auto; }
        .mp-overlay.active .mp-sheet { transform: translateY(0); }
        .mp-item { padding: 12px; border-bottom: 1px solid #333; color: #ccc; cursor: pointer; display: flex; justify-content: space-between; font-size: 14px; }
        .mp-item.active { color: #e50914; font-weight: bold; }
        .mp-item.active::after { content: '✔'; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    if(!document.getElementById('mista-css')) {
        const s = document.createElement('style');
        s.id = 'mista-css';
        s.innerHTML = css;
        document.head.appendChild(s);
    }

    class MistaPlayer {
        constructor(el) {
            this.container = el;
            this.rawSource = el.getAttribute('data-vid');
            this.videoId = this.extractID(this.rawSource);
            this.uid = Math.random().toString(36).substr(2, 9);
            this.player = null;
            this.isPlaying = false;
            this.isDragging = false; 
            this.adWatched = false;
            this.timer = null;
            this.render();
            this.initYT();
        }

        extractID(src) {
            if(!src) return 'ScMzIvxBSi4';
            let id = src.trim();
            const urlMatch = id.match(/(?:v=|\/|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/);
            if(urlMatch) { return urlMatch[1]; }
            return id;
        }

        render() {
            const posterUrl = `https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg`;
            this.container.innerHTML = `
                <div class="mp-container" id="box-${this.uid}">
                    <div class="mp-layer mp-video-wrap" id="v-wrap-${this.uid}">
                        <div id="yt-${this.uid}" class="mp-video"></div>
                    </div>
                    <div class="mp-layer mp-ad-layer" id="ad-layer-${this.uid}">
                        <div class="mp-ad-slot" id="ad-slot-${this.uid}"></div>
                        <button class="mp-skip-btn" id="skip-${this.uid}">Skip Ad</button>
                    </div>
                    <div class="mp-layer mp-poster" id="poster-${this.uid}" style="background-image: url('${posterUrl}');">
                        <div class="mp-big-play"><span class="material-icons-round" style="font-size:40px; color:white;">play_arrow</span></div>
                    </div>
                    <div class="mp-replay" id="replay-${this.uid}">
                        <div class="mp-big-play"><span class="material-icons-round" style="font-size:40px; color:white;">replay</span></div>
                        <div style="color:white; margin-top:10px; font-weight:bold;">Watch Again</div>
                    </div>
                    <div class="mp-spinner" id="spin-${this.uid}"></div>
                    <div class="mp-feedback" id="feed-${this.uid}"></div>
                    <div class="mp-tap mp-tap-l"><span class="material-icons-round" style="color:white; font-size:40px;">fast_rewind</span></div>
                    <div class="mp-tap mp-tap-r"><span class="material-icons-round" style="color:white; font-size:40px;">fast_forward</span></div>
                    <div class="mp-layer mp-ui mp-hidden" id="ui-${this.uid}">
                        <div class="mp-title">Loading...</div>
                        <div class="mp-btm">
                            <div class="mp-seek-wrap" id="seek-wrap-${this.uid}">
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
            const qHtml = ['auto','hd1080','hd720','large','medium'].map(q => `<div class="mp-item ${q=='auto'?'active':''}" data-val="${q}">${q.toUpperCase()}</div>`).join('');
            this.container.querySelector(`#list-q-${this.uid}`).innerHTML = `<div style="font-weight:bold;color:white;margin-bottom:15px;">Quality</div>` + qHtml;
            const sHtml = [0.5,1,1.5,2].map(s => `<div class="mp-item ${s==1?'active':''}" data-val="${s}">${s}x</div>`).join('');
            this.container.querySelector(`#list-s-${this.uid}`).innerHTML = `<div style="font-weight:bold;color:white;margin-bottom:15px;">Speed</div>` + sHtml;
        }

        playAd() {
            const adLayer = this.container.querySelector(`#ad-layer-${this.uid}`);
            const poster = this.container.querySelector(`#poster-${this.uid}`);
            const skipBtn = this.container.querySelector(`#skip-${this.uid}`);
            const adSlot = this.container.querySelector(`#ad-slot-${this.uid}`);
            poster.style.display = 'none';
            adLayer.classList.add('active');
            adSlot.innerHTML = `<div class="mista-ad" data-cat="Entertainment" style="width:100%;height:100%;"></div>`;
            const s = document.createElement('script'); s.type='module'; s.src="https://MistaFy.pages.dev/ads.js?"+Math.random();
            adSlot.appendChild(s);
            let count = 5;
            skipBtn.innerText = `Skip in ${count}`;
            skipBtn.classList.remove('ready');
            const t = setInterval(() => { count--; if(count > 0) skipBtn.innerText = `Skip in ${count}`; else { clearInterval(t); skipBtn.innerText = "Skip Ad"; skipBtn.classList.add('ready'); } }, 1000);
        }

        events() {
            const c = this.container;
            const poster = c.querySelector(`#poster-${this.uid}`);
            const replay = c.querySelector(`#replay-${this.uid}`);
            const box = c.querySelector(`#box-${this.uid}`);
            const adLayer = c.querySelector(`#ad-layer-${this.uid}`);
            const skipBtn = c.querySelector(`#skip-${this.uid}`);
            const seekWrap = c.querySelector(`#seek-wrap-${this.uid}`);

            const startAll = () => { if(!this.adWatched) this.playAd(); else { poster.style.display = 'none'; replay.classList.remove('visible'); c.querySelector(`#spin-${this.uid}`).style.display = 'block'; this.player.playVideo(); } };

            poster.addEventListener('click', startAll);
            skipBtn.addEventListener('click', (e) => { e.stopPropagation(); adLayer.classList.remove('active'); this.adWatched = true; startAll(); });
            replay.addEventListener('click', () => { this.player.seekTo(0); startAll(); });
            c.querySelector(`#play-${this.uid}`).addEventListener('click', () => this.toggle());

            // --- DRAGGABLE SEEKBAR LOGIC ---
            const handleSeek = (e) => {
                const rect = seekWrap.getBoundingClientRect();
                const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                c.querySelector('.mp-seek-fill').style.width = (pct * 100) + '%';
                c.querySelector('.mp-seek-thumb').style.left = (pct * 100) + '%';
                if(e.type === 'mouseup' || e.type === 'touchend') {
                    this.player.seekTo(this.player.getDuration() * pct, true);
                }
            };

            seekWrap.addEventListener('mousedown', (e) => { this.isDragging = true; seekWrap.classList.add('dragging'); handleSeek(e); });
            seekWrap.addEventListener('touchstart', (e) => { this.isDragging = true; seekWrap.classList.add('dragging'); handleSeek(e); });

            window.addEventListener('mousemove', (e) => { if(this.isDragging) handleSeek(e); });
            window.addEventListener('touchmove', (e) => { if(this.isDragging) handleSeek(e); });

            window.addEventListener('mouseup', (e) => { if(this.isDragging) { this.isDragging = false; seekWrap.classList.remove('dragging'); handleSeek(e); } });
            window.addEventListener('touchend', (e) => { if(this.isDragging) { this.isDragging = false; seekWrap.classList.remove('dragging'); handleSeek(e); } });

            // UI Show/Hide
            let lastTap = 0;
            box.addEventListener('click', (e) => {
                if(poster.style.display !== 'none' || replay.classList.contains('visible') || adLayer.classList.contains('active')) return;
                if(e.target.closest('.mp-btn') || e.target.closest('.mp-seek-wrap') || e.target.closest('.mp-overlay')) return;
                const now = new Date().getTime();
                if(now - lastTap < 300) {
                    const width = box.offsetWidth;
                    const x = e.clientX - box.getBoundingClientRect().left;
                    if(x < width/2) this.seek(-10, '.mp-tap-l'); else this.seek(10, '.mp-tap-r');
                } else {
                    const ui = c.querySelector(`#ui-${this.uid}`);
                    if(ui.classList.contains('mp-hidden')) { ui.classList.remove('mp-hidden'); if(this.isPlaying) this.hideUiDelay(); } 
                    else if(this.isPlaying) ui.classList.add('mp-hidden');
                }
                lastTap = now;
            });

            c.querySelector(`#f-btn-${this.uid}`).addEventListener('click', () => { if(!document.fullscreenElement) box.requestFullscreen(); else document.exitFullscreen(); });

            const qMenu = c.querySelector(`#menu-q-${this.uid}`);
            const sMenu = c.querySelector(`#menu-s-${this.uid}`);
            c.querySelector(`#q-btn-${this.uid}`).addEventListener('click', () => qMenu.classList.add('active'));
            c.querySelector(`#s-btn-${this.uid}`).addEventListener('click', () => sMenu.classList.add('active'));

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
            this.player = new YT.Player(`yt-${this.uid}`, { videoId: this.videoId, playerVars: { controls:0, rel:0, playsinline:1, origin:window.location.origin }, events: { 'onStateChange': (e) => this.stateChange(e) } });
        }

        stateChange(e) {
            const s = e.data; const ui = this.container.querySelector(`#ui-${this.uid}`);
            const spin = this.container.querySelector(`#spin-${this.uid}`);
            const vWrap = this.container.querySelector(`#v-wrap-${this.uid}`);
            const btn = this.container.querySelector(`#play-${this.uid} span`);
            spin.style.display = 'none';
            if(s === YT.PlayerState.PLAYING) { this.isPlaying = true; vWrap.classList.add('active'); btn.innerText = 'pause'; this.feedback('play_arrow'); this.loop(); this.hideUiDelay(); } 
            else if (s === YT.PlayerState.PAUSED) { this.isPlaying = false; btn.innerText = 'play_arrow'; this.feedback('pause'); ui.classList.remove('mp-hidden'); clearInterval(this.timer); } 
            else if (s === YT.PlayerState.BUFFERING) spin.style.display = 'block';
            else if (s === YT.PlayerState.ENDED) { this.isPlaying = false; this.container.querySelector(`#replay-${this.uid}`).classList.add('visible'); ui.classList.add('mp-hidden'); }
        }

        toggle() { if(this.isPlaying) this.player.pauseVideo(); else this.player.playVideo(); }

        seek(sec, sel) { this.player.seekTo(this.player.getCurrentTime() + sec, true); const el = this.container.querySelector(sel); el.style.opacity = 1; setTimeout(() => el.style.opacity = 0, 400); }

        loop() {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                if(this.player && this.player.getCurrentTime && !this.isDragging) {
                    const c = this.player.getCurrentTime(); const d = this.player.getDuration();
                    const pct = (c/d)*100;
                    this.container.querySelector('.mp-seek-fill').style.width = pct + '%';
                    this.container.querySelector('.mp-seek-thumb').style.left = pct + '%';
                    const fmt = (t) => { const m=Math.floor(t/60), s=Math.floor(t%60); return `${m}:${s<10?'0':''}${s}`; };
                    this.container.querySelector(`#time-${this.uid}`).innerText = `${fmt(c)} / ${fmt(d)}`;
                }
            }, 500);
        }

        hideUiDelay() { clearTimeout(this.to); this.to = setTimeout(() => { if(this.isPlaying && !this.isDragging && !this.container.querySelector('.mp-overlay.active')) { this.container.querySelector(`#ui-${this.uid}`).classList.add('mp-hidden'); } }, 3000); }

        feedback(icon) { const el = this.container.querySelector(`#feed-${this.uid}`); el.innerHTML = `<span class="material-icons-round" style="color:white;font-size:40px;">${icon}</span>`; el.classList.add('anim'); setTimeout(() => el.classList.remove('anim'), 300); }

        async getTitle() { try { const r = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${this.videoId}`); const d = await r.json(); if(d.title) this.container.querySelector('.mp-title').innerText = d.title; } catch(e){} }
    }

    const init = () => { document.querySelectorAll('.mista-embed').forEach(el => { if(!el.getAttribute('data-init')) { new MistaPlayer(el); el.setAttribute('data-init', 'true'); } }); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    window.initMistaPlayers = init;
})();
