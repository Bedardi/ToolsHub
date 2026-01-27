// MistaHub v23 Nexus SDK (Final Production)
(function() {
    // 🟢 DATABASE CONFIG
    const DB_URL = "https://make-money-67e35-default-rtdb.firebaseio.com";
    
    // 🟢 DEFAULTS (Must match Admin Panel to decode '0' values)
    const DEF = {
        1: { w:120, h:30, col:'#000000', bg:'transparent', rad:0, op:100 }, // Text
        2: { w:100, h:100, col:'#000000', bg:'#eeeeee', rad:0, op:100 },    // Image
        3: { w:100, h:40, col:'#ffffff', bg:'#4f46e5', rad:8, op:100 },    // Button
        4: { w:120, h:80, col:'#000000', bg:'#000000', rad:0, op:100 }     // Video
    };

    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .ma-box { position:relative; overflow:hidden; font-family:system-ui, sans-serif; opacity:0; transition:opacity 0.5s ease; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
        .ma-box.show { opacity:1; }
        .ma-el { position:absolute; display:flex; align-items:center; justify-content:center; transition:transform 0.1s; background-position:center; background-size:cover; }
        .ma-el:active { transform:scale(0.98); }
        .ma-bdg { position:absolute; top:0; right:0; background:rgba(255,255,255,0.7); color:#000; font-size:9px; padding:2px 5px; z-index:999; pointer-events:none; border-bottom-left-radius:4px; }
        .ma-err { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#fee2e2; color:#ef4444; font-size:12px; font-weight:bold; text-align:center; border:1px dashed #ef4444; }
    `;
    document.head.appendChild(style);

    // 2. Analytics Helper (Non-blocking)
    function track(id, type) {
        try {
            // Using transaction-like increment
            const url = `${DB_URL}/mista_stats/${id}/${type}.json`;
            fetch(url).then(r=>r.json()).then(curr => {
                fetch(url, { method: 'PUT', body: (curr || 0) + 1 });
            });
        } catch(e) { console.warn("Analytics Error", e); }
    }

    // 3. Main Function
    window.MistaAd = function(adId, containerId) {
        const box = document.getElementById(containerId);
        if(!box) { console.error(`Container #${containerId} not found`); return; }

        // Fetch Ad Data
        fetch(`${DB_URL}/mista_v20_ads/${adId}.json`)
            .then(r => r.json())
            .then(data => {
                if(!data) {
                    box.innerHTML = `<div class="ma-err">Ad ID "${adId}"<br>Not Found</div>`;
                    box.style.height = "100px";
                    return;
                }

                // Track View
                track(adId, 'v');

                // Setup Stage
                const [w, h, bg] = data.s;
                const stage = document.createElement('div');
                stage.className = 'ma-box';
                stage.style.cssText = `width:${w}px; height:${h}px; background:${bg};`;

                // Render Layers
                if(data.l) {
                    data.l.forEach(l => {
                        // Unpack compressed array
                        const [typeId, x, y, dw, dh, z, txt, dcol, dbg, drad, url, dop] = l;
                        
                        // Apply Defaults if value is 0 or missing
                        const def = DEF[typeId] || DEF[1];
                        const wid = dw || def.w;
                        const hei = dh || def.h;
                        const col = dcol || def.col;
                        const bgCol = dbg || def.bg;
                        const rad = drad || def.rad;
                        const op = (dop || def.op) / 100;

                        // Create Element
                        const el = document.createElement('div');
                        el.className = 'ma-el';
                        el.style.cssText = `
                            left:${x}px; top:${y}px; z-index:${z};
                            width:${typeId===1 ? 'auto' : wid+'px'};
                            height:${typeId===1 ? 'auto' : hei+'px'};
                            border-radius:${rad}px; opacity:${op};
                        `;

                        // Content Logic
                        if(typeId === 1) { // Text
                            el.innerText = txt; 
                            el.style.color = col; 
                            el.style.fontSize = (hei/1.5) + 'px'; 
                            el.style.whiteSpace = 'nowrap';
                        }
                        else if(typeId === 2) { // Image
                            el.style.backgroundImage = `url(${txt})`;
                        }
                        else if(typeId === 3) { // Button
                            el.innerText = txt; 
                            el.style.background = bgCol; 
                            el.style.color = col; 
                            el.style.fontSize = '12px'; 
                            el.style.fontWeight = 'bold'; 
                            el.style.cursor = 'pointer';
                        }
                        else if(typeId === 4) { // Video
                            el.innerHTML = `<video src="${txt}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;border-radius:${rad}px"></video>`;
                        }

                        // Click Logic
                        if(url && url.length > 4) {
                            el.style.cursor = 'pointer';
                            el.onclick = (e) => {
                                e.stopPropagation();
                                track(adId, 'c'); // Track Click
                                window.open(url, '_blank');
                            };
                        }

                        stage.appendChild(el);
                    });
                }

                // Add Badge & Show
                stage.insertAdjacentHTML('beforeend', '<span class="ma-bdg">Ad</span>');
                box.innerHTML = '';
                box.appendChild(stage);
                
                // Fade In
                requestAnimationFrame(() => stage.classList.add('show'));
            })
            .catch(err => {
                box.innerHTML = `<div class="ma-err">Network Error</div>`;
            });
    }
})();
