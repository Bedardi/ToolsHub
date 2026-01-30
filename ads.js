import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get, runTransaction } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const db = getDatabase(initializeApp({
    apiKey: "AIzaSyDX3rgbgGlOxTh_56kmHwtdfhBWH1FDPU0",
    databaseURL: "https://make-money-67e35-default-rtdb.firebaseio.com",
    projectId: "make-money-67e35",
    appId: "1:708431983591:android:bc09f22bfc32b3fc9a8342"
}));

// Global Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.setAttribute('data-visible', 'true');
        else entry.target.setAttribute('data-visible', 'false');
    });
}, { threshold: 0.1 });

(async function init() {
    const slots = document.querySelectorAll('.mista-ad');
    if (slots.length === 0) return;

    if(!document.getElementById('mista-style')) {
        const style = document.createElement('style');
        style.id = 'mista-style';
        style.innerHTML = `
            @keyframes spin { 0% {transform:rotate(0deg)} 100% {transform:rotate(360deg)} }
            .mista-badge { position:absolute; top:0; right:0; background:rgba(0,0,0,0.6); color:#fff; font-size:9px; padding:2px 4px; font-family:sans-serif; z-index:9999; border-bottom-left-radius:4px; pointer-events:none; }
            .mista-ad { transition: height 0.3s ease, width 0.3s ease; } /* Smooth Resize */
        `;
        document.head.appendChild(style);
    }

    // Loader
    slots.forEach(s => {
        observer.observe(s);
        s.innerHTML = `<div style="width:100%;height:100%;background:#050505;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid #222;"><div style="width:20px;height:20px;border:2px solid #333;border-top:2px solid #6366f1;border-radius:50%;animation:spin 1s linear infinite;"></div></div>`;
    });

    try {
        const snap = await get(ref(db, 'mista_v20_ads'));
        if (!snap.exists()) { slots.forEach(s => s.innerHTML=''); return; }
        const ads = snap.val();

        slots.forEach(slot => {
            const id = slot.getAttribute('data-id');
            const cat = slot.getAttribute('data-cat') || 'all';

            if (id) {
                if (ads[id] && ads[id].active == 1) render(slot, {id:id, ...ads[id]});
                else slot.innerHTML = ''; 
            } else {
                // CATEGORY MODE
                const pool = Object.keys(ads).map(k=>({id:k,...ads[k]})).filter(a => a.active == 1 && (cat=='all' || a.cat==cat));
                if (pool.length > 0) {
                    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
                    rotate(slot, pool, 0);
                } else slot.innerHTML = '';
            }
        });
    } catch (e) { console.error(e); slots.forEach(s => s.innerHTML=''); }
})();

function rotate(slot, pool, i) {
    if(!document.body.contains(slot)) return;
    const isVisible = slot.getAttribute('data-visible') === 'true';
    
    if (isVisible) {
        const ad = pool[i];
        render(slot, ad);
        setTimeout(() => rotate(slot, pool, (i+1)%pool.length), (ad.dur||15)*1000);
    } else {
        setTimeout(() => rotate(slot, pool, i), 2000);
    }
}

function render(con, ad) {
    // FIX 3: SMART AUTO-RESIZE
    // Ad data me save kiya hua size (s[0]=width, s[1]=height) use karein
    if(ad.s && ad.s.length >= 2) {
        con.style.width = ad.s[0] + 'px';
        con.style.height = ad.s[1] + 'px';
    }

    con.innerHTML = ''; 
    con.style.position = 'relative'; 
    con.style.overflow = 'hidden'; 
    con.style.background = ad.s[2]; 
    con.style.cursor = 'pointer';

    const badge = document.createElement('div');
    badge.className = 'mista-badge'; badge.innerText = 'Ad';
    con.appendChild(badge);

    ad.l.forEach(l => {
        const el = document.createElement('div');
        const t = ['','txt','img','btn','vid'][l[0]];
        el.style.cssText = `position:absolute;left:${l[1]}px;top:${l[2]}px;z-index:${l[5]};border-radius:${l[9]}px;pointer-events:none;`;

        if(t == 'txt') {
            el.innerText = l[6]; el.style.color = l[7]; 
            el.style.fontSize = (l[4] * 0.6) + 'px'; el.style.fontFamily = 'system-ui, sans-serif'; 
            el.style.whiteSpace = 'nowrap'; el.style.overflow = 'hidden'; el.style.textOverflow = 'ellipsis'; el.style.maxWidth = l[3] + 'px';
        }
        else if(t == 'btn') {
            el.innerText = l[6]; el.style.background = l[8]; el.style.color = l[7];
            el.style.width = l[3] + 'px'; el.style.height = l[4] + 'px';
            el.style.display = 'flex'; el.style.justifyContent = 'center'; el.style.alignItems = 'center'; el.style.fontWeight = 'bold';
        }
        else if(t == 'img') {
            el.style.width = l[3] + 'px'; el.style.height = l[4] + 'px';
            el.style.backgroundImage = `url(${l[6]})`; el.style.backgroundSize = 'cover';
        }
        else if(t == 'vid') {
            el.style.width = l[3] + 'px'; el.style.height = l[4] + 'px';
            el.innerHTML = `<video src="${l[6]}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>`;
        }

        if(l[10] && l[10].length > 1) {
            el.style.pointerEvents = 'auto'; 
            el.onclick = (e) => { e.stopPropagation(); handleClick(ad.id, l[10], el); }
        }
        con.appendChild(el);
    });
}

let isClickProcessing = false;
function handleClick(id, url, el) {
    if(isClickProcessing) return;
    isClickProcessing = true;
    el.style.opacity = '0.7'; setTimeout(() => el.style.opacity = '1', 200);
    window.open(url, '_blank');
    runTransaction(ref(db, 'mista_stats/'+id+'/c'), c => (c||0)+1).then(() => { setTimeout(() => { isClickProcessing = false; }, 1000); });
}
