(function() {
    const css = `
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

        .mp-container { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'Poppins', sans-serif; user-select: none; border-radius: 12px; aspect-ratio: 16/9; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
        .mp-layer { position: absolute; inset: 0; width: 100%; height: 100%; }

        /* Video Masking to hide YouTube Branding */
        .mp-video-wrap { z-index: 1; pointer-events: none; opacity: 0; transition: opacity 0.5s; overflow:hidden; }
        .mp-video-wrap.active { opacity: 1; }
        .mp-video { width: 100%; height: 100%; transform: scale(1.35); border: none; }

        /* Premium Ads Style */
        .mp-ad-layer { z-index: 200; background: #000; display: none; flex-direction: column; align-items: center; justify-content: center; }
        .mp-ad-layer.active { display: flex; }
        .mp-ad-banner { width: 80%; height: 60%; background: #1a1a1a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #555; position: relative; overflow: hidden; cursor: pointer; }
        .mp-skip-btn { position: absolute; bottom: 20px; right: 0; background: rgba(0,0,0,0.8); color: #fff; border: 1px solid #444; padding: 8px 15px; font-size: 13px; cursor: pointer; border-right: none; }

        /* Custom Bottom Sheet (App Style) */
        .mp-sheet-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 300; opacity: 0; pointer-events: none; transition: 0.3s; backdrop-filter: blur(2px); }
        .mp-sheet-overlay.active { opacity: 1; pointer-events: auto; }
        .mp-sheet { position: absolute; bottom: 0; left: 0; width: 100%; background: #1c1c1e; border-radius: 20px 20px 0 0; z-index: 301; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding-bottom: 20px; }
        .mp-sheet-overlay.active .mp-sheet { transform: translateY(0); }
        .mp-sheet-header { padding: 15px; text-align: center; color: #8e8e93; font-size: 14px; border-bottom: 1px solid #2c2c2e; }
        .mp-sheet-item { padding: 15px 25px; color: #fff; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s; }
        .mp-sheet-item:active { background: #2c2c2e; }
        .mp-sheet-item .material-icons-round { font-size: 22px; color: #e50914; }
        .mp-sheet-item.active { background: rgba(229, 9, 20, 0.1); color: #e50914; font-weight: 600; }

        /* UI Elements */
        .mp-ui { z-index: 100; background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 50%, rgba(0,0,0,0.8) 100%); transition: 0.3s; }
        .mp-ui.mp-hidden { opacity: 0; pointer-events: none; }
        .mp-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 10px; display: flex; align-items: center; }
        
        /* Seekbar Premium */
        .mp-seek-wrap { width: 100%; height: 30px; display: flex; align-items: center; cursor: pointer; position: relative; z-index: 110; margin-top: -15px; }
        .mp-seek-bg { width: 100%; height: 4px; background: rgba(255,255,255,0.2); position: relative; }
        .mp-seek-fill { height: 100%; background: #e50914; width: 0%; position: relative; }
        .mp-seek-thumb { width: 12px; height: 12px; background: #e50914; border-radius: 50%; position: absolute; right: -6px; top: -4px; box-shadow: 0 0 10px rgba(229,9,20,0.5); }

        .mp-2x-badge { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: none; z-index: 150; border: 1px solid rgba(255,255,255,0.2); }
        .mp-spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #e50914; border-radius: 50%; animation: spin 0.8s infinite linear; position: absolute; top:50%; left:50%; margin:-20px; display: none; z-index: 140; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    if(!document.getElementById('mista-premium-css')) {
        const s = document.createElement('style');
        s.id = 'mista-premium-css';
        s.innerHTML = css;
        document.head.appendChild(s);
    }

    class MistaPlayer {
        constructor(el) {
            this.container = el;
            this.videoId = this.extractID(el.getAttribute('data-vid'));
            this.uid = Math.random().toString(36).substr(2, 9);
            this.adFrequency = 3; // Change this to show ads after X videos
            this.player = null;
            this.isPlaying = false;
            this.isLocked = false;
            this.isDragging = false;
            this.render();
            this.initYT();
        }

        extractID(src) {
            const match = src.match(/(?:v=|\/|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/);
            return match ? match[1] : src;
        }

        shouldShowAd() {
            let count = parseInt(localStorage.getItem('mp_vid_count') || '0');
            count++;
            localStorage.setItem('mp_vid_count', count);
            if(count >= this.adFrequency) {
                localStorage.setItem('mp_vid_count', '0');
                return true;
            }
            return false;
        }

        render() {
            const poster = `https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg`;
            this.container.innerHTML = `
                <div class="mp-container" id="box-${this.uid}">
                    <div class="mp-layer mp-video-wrap" id="v-wrap-${this.uid}">
                        <div id="yt-${this.uid}" class="mp-video"></div>
                    </div>

                    <div class="mp-2x-badge" id="badge-2x-${this.uid}">2X Speed Active</div>
                    <div class="mp-spinner" id="spin-${this.uid}"></div>

                    <div class="mp-layer mp-ad-layer" id="ad-layer-${this.uid}">
                        <div class="mp-ad-banner" onclick="window.open('https://mistafy.pages.dev','_blank')">
                            <span class="material-icons-round" style="font-size:50px;">ads_click</span>
                            <div style="position:absolute; bottom:10px; width:100%; text-align:center; font-size:12px;">Visit Sponsor</div>
                        </div>
                        <button class="mp-skip-btn" id="skip-${this.uid}">Skip in 5</button>
                    </div>

                    <div class="mp-layer mp-poster" id="poster-${this.uid}" style="background:url('${poster}') center/cover; display:flex; align-items:center; justify-content:center; z-index:50;">
                        <div style="width:70px; height:70px; background:rgba(229,9,20,0.9); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                            <span class="material-icons-round" style="font-size:45px; color:#fff;">play_arrow</span>
                        </div>
                    </div>

                    <div class="mp-layer mp-ui mp-hidden" id="ui-${this.uid}">
                        <div style="padding:15px; color:#fff; font-size:14px; font-weight:500;" id="title-${this.uid}">Loading...</div>
                        
                        <div style="position:absolute; bottom:0; width:100%; padding-bottom:5px;">
                            <div class="mp-seek-wrap" id="seek-wrap-${this.uid}">
                                <div class="mp-seek-bg"><div class="mp-seek-fill"><div class="mp-seek-thumb"></div></div></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:0 10px;">
                                <div style="display:flex; align-items:center;">
                                    <button class="mp-btn" id="play-${this.uid}"><span class="material-icons-round">play_arrow</span></button>
                                    <span style="color:#fff; font-size:11px; margin-left:5px;" id="time-${this.uid}">0:00 / 0:00</span>
                                </div>
                                <div style="display:flex;">
                                    <button class="mp-btn" id="lock-btn-${this.uid}"><span class="material-icons-round">lock_open</span></button>
                                    <button class="mp-btn" id="settings-btn-${this.uid}"><span class="material-icons-round">tune</span></button>
                                    <button class="mp-btn" id="fs-btn-${this.uid}"><span class="material-icons-round">fullscreen</span></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mp-sheet-overlay" id="sheet-overlay-${this.uid}">
                        <div class="mp-sheet">
                            <div class="mp-sheet-header">Video Settings</div>
                            <div id="sheet-content-${this.uid}"></div>
                        </div>
                    </div>
                </div>
            `;
            this.events();
        }

        showBottomSheet(type) {
            const content = this.container.querySelector(`#sheet-content-${this.uid}`);
            const overlay = this.container.querySelector(`#sheet-overlay-${this.uid}`);
            let html = '';

            if(type === 'main') {
                html = `
                    <div class="mp-sheet-item" id="opt-quality"><span class="material-icons-round">high_quality</span> Quality</div>
                    <div class="mp-sheet-item" id="opt-speed"><span class="material-icons-round">speed</span> Speed</div>
                `;
            } else if(type === 'quality') {
                const qs = this.player.getAvailableQualityLevels();
                html = qs.map(q => `<div class="mp-sheet-item q-set ${this.player.getPlaybackQuality()===q?'active':''}" data-val="${q}"><span class="material-icons-round">check_circle</span> ${q.toUpperCase()}</div>`).join('');
            } else if(type === 'speed') {
                const rates = [0.5, 1, 1.5, 2];
                html = rates.map(r => `<div class="mp-sheet-item s-set ${this.player.getPlaybackRate()===r?'active':''}" data-val="${r}"><span class="material-icons-round">bolt</span> ${r}x Speed</div>`).join('');
            }

            content.innerHTML = html;
            overlay.classList.add('active');

            // Listeners for Sheet Items
            if(type === 'main') {
                content.querySelector('#opt-quality').onclick = () => this.showBottomSheet('quality');
                content.querySelector('#opt-speed').onclick = () => this.showBottomSheet('speed');
            } else {
                content.querySelectorAll('.mp-sheet-item').forEach(item => {
                    item.onclick = () => {
                        const val = item.getAttribute('data-val');
                        if(type === 'quality') {
                            const cur = this.player.getCurrentTime();
                            this.player.setPlaybackQuality(val);
                            this.player.seekTo(cur, true);
                        } else {
                            this.player.setPlaybackRate(parseFloat(val));
                        }
                        overlay.classList.remove('active');
                    };
                });
            }
        }

        events() {
            const c = this.container;
            const box = c.querySelector(`#box-${this.uid}`);
            const ui = c.querySelector(`#ui-${this.uid}`);

            // Play/Ad Logic
            c.querySelector(`#poster-${this.uid}`).onclick = () => {
                if(this.shouldShowAd()) {
                    this.startAd();
                } else {
                    this.startVideo();
                }
            };

            // Long Press 2x
            let lpTimer;
            box.onmousedown = box.ontouchstart = (e) => {
                if(this.isLocked || !this.isPlaying) return;
                lpTimer = setTimeout(() => {
                    this.player.setPlaybackRate(2);
                    c.querySelector(`#badge-2x-${this.uid}`).style.display = 'block';
                }, 500);
            };
            const stop2x = () => {
                clearTimeout(lpTimer);
                if(this.player) {
                    this.player.setPlaybackRate(1);
                    c.querySelector(`#badge-2x-${this.uid}`).style.display = 'none';
                }
            };
            box.onmouseup = box.onmouseleave = box.ontouchend = stop2x;

            // Double Tap to Seek
            let lastTap = 0;
            box.onclick = (e) => {
                if(this.isLocked) return;
                const now = Date.now();
                if(now - lastTap < 300) {
                    const rect = box.getBoundingClientRect();
                    const x = (e.clientX || e.pageX) - rect.left;
                    if(x < rect.width / 2) this.player.seekTo(this.player.getCurrentTime() - 10);
                    else this.player.seekTo(this.player.getCurrentTime() + 10);
                } else {
                    ui.classList.toggle('mp-hidden');
                }
                lastTap = now;
            };

            // Seekbar Drag
            const sw = c.querySelector(`#seek-wrap-${this.uid}`);
            const handleSeek = (e) => {
                const rect = sw.getBoundingClientRect();
                const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
                const pct = Math.max(0, Math.min(1, x / rect.width));
                this.player.seekTo(this.player.getDuration() * pct, true);
            };
            sw.onmousedown = sw.ontouchstart = () => { this.isDragging = true; };
            window.addEventListener('mousemove', (e) => { if(this.isDragging) handleSeek(e); });
            window.addEventListener('touchmove', (e) => { if(this.isDragging) handleSeek(e); });
            window.addEventListener('mouseup', () => { this.isDragging = false; });
            window.addEventListener('touchend', () => { this.isDragging = false; });

            // Settings & UI
            c.querySelector(`#settings-btn-${this.uid}`).onclick = () => this.showBottomSheet('main');
            c.querySelector(`#sheet-overlay-${this.uid}`).onclick = (e) => {
                if(e.target.id.includes('sheet-overlay')) e.target.classList.remove('active');
            };

            c.querySelector(`#lock-btn-${this.uid}`).onclick = () => {
                this.isLocked = true;
                ui.classList.add('mp-hidden');
                // Temporary unlock logic
                const unlock = document.createElement('div');
                unlock.innerHTML = '<span class="material-icons-round">lock</span>';
                unlock.style = "position:absolute; top:20px; right:20px; z-index:500; color:#fff; background:rgba(0,0,0,0.5); padding:10px; border-radius:50%; cursor:pointer;";
                box.appendChild(unlock);
                unlock.onclick = () => { this.isLocked = false; unlock.remove(); ui.classList.remove('mp-hidden'); };
            };

            c.querySelector(`#play-${this.uid}`).onclick = () => {
                if(this.isPlaying) this.player.pauseVideo(); else this.player.playVideo();
            };
        }

        startAd() {
            const layer = this.container.querySelector(`#ad-layer-${this.uid}`);
            const skip = this.container.querySelector(`#skip-${this.uid}`);
            layer.classList.add('active');
            let sec = 5;
            const t = setInterval(() => {
                sec--;
                if(sec > 0) skip.innerText = `Skip in ${sec}`;
                else {
                    clearInterval(t);
                    skip.innerText = "Skip Ad";
                    skip.onclick = () => {
                        layer.classList.remove('active');
                        this.startVideo();
                    };
                }
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
                videoId: this.videoId,
                playerVars: { controls:0, rel:0, playsinline:1, modestbranding:1, disablekb:1 },
                events: {
                    'onReady': () => this.getTitle(),
                    'onStateChange': (e) => {
                        const spin = this.container.querySelector(`#spin-${this.uid}`);
                        const btn = this.container.querySelector(`#play-${this.uid} span`);
                        if(e.data === 1) { // Playing
                            this.isPlaying = true;
                            spin.style.display = 'none';
                            btn.innerText = 'pause';
                            this.container.querySelector(`#v-wrap-${this.uid}`).classList.add('active');
                            this.loop();
                        } else if(e.data === 2) { // Paused
                            this.isPlaying = false;
                            btn.innerText = 'play_arrow';
                        } else if(e.data === 3) { // Buffering
                            spin.style.display = 'block';
                        }
                    }
                }
            });
        }

        loop() {
            const timer = setInterval(() => {
                if(!this.player || !this.isPlaying) { clearInterval(timer); return; }
                const cur = this.player.getCurrentTime();
                const dur = this.player.getDuration();
                const pct = (cur/dur) * 100;
                this.container.querySelector('.mp-seek-fill').style.width = pct + '%';
                const fmt = (s) => new Date(s * 1000).toISOString().substr(14, 5);
                this.container.querySelector(`#time-${this.uid}`).innerText = `${fmt(cur)} / ${fmt(dur)}`;
            }, 500);
        }

        async getTitle() {
            try {
                const r = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${this.videoId}`);
                const d = await r.json();
                this.container.querySelector(`#title-${this.uid}`).innerText = d.title;
            } catch(e) {}
        }
    }

    const init = () => { document.querySelectorAll('.mista-embed').forEach(el => { if(!el.getAttribute('data-init')) { new MistaPlayer(el); el.setAttribute('data-init', 'true'); } }); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
