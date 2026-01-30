/* Mista Ads Final v25 - Video Fixed & Optimized */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get, runTransaction } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// 🟢 CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyDX3rgbgGlOxTh_56kmHwtdfhBWH1FDPU0",
    databaseURL: "https://make-money-67e35-default-rtdb.firebaseio.com",
    projectId: "make-money-67e35",
    appId: "1:708431983591:android:bc09f22bfc32b3fc9a8342"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

(async function initMistaAds() {
    // 1. Find all ad slots
    const slots = document.querySelectorAll('.mista-ad');
    if (slots.length === 0) return;

    // 2. Show Loading Placeholder immediately
    slots.forEach(s => {
        s.innerHTML = '<div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:10px;">Ad Loading...</div>';
    });

    // 3. Fetch Data from Firebase
    try {
        const snap = await get(ref(db, 'mista_v20_ads'));
        if (!snap.exists()) {
            slots.forEach(s => s.innerHTML = ''); // Hide if no ads
            return;
        }
        const allAds = snap.val();

        // 4. Process Each Slot
        slots.forEach(slot => {
            const reqId = slot.getAttribute('data-id');
            const reqCat = slot.getAttribute('data-cat') || 'all';

            // MODE A: Specific Ad ID
            if (reqId) {
                if (allAds[reqId] && allAds[reqId].active === 1) {
                    renderAd(slot, { id: reqId, ...allAds[reqId] });
                } else {
                    slot.innerHTML = ''; // Hide if inactive
                }
            } 
            // MODE B: Category Rotation
            else {
                const pool = Object.keys(allAds)
                    .map(k => ({ id: k, ...allAds[k] }))
                    .filter(a => a.active === 1 && (reqCat === 'all' || a.cat === reqCat));

                if (pool.length > 0) {
                    pool.sort(() => Math.random() - 0.5); // Shuffle
                    rotateAds(slot, pool, 0);
                } else {
                    slot.innerHTML = ''; // No ads for this category
                }
            }
        });
    } catch (error) {
        console.error("MistaAds Error:", error);
    }
})();

// --- ROTATION LOGIC ---
function rotateAds(slot, pool, idx) {
    const ad = pool[idx];
    renderAd(slot, ad);
    
    // Set timer for next ad
    setTimeout(() => {
        // Only rotate if element still exists in DOM
        if (document.body.contains(slot)) {
            const nextIdx = (idx + 1) % pool.length;
            rotateAds(slot, pool, nextIdx);
        }
    }, (ad.dur || 15) * 1000);
}

// --- RENDER LOGIC (Video Logic Added Here) ---
function renderAd(con, ad) {
    con.innerHTML = ''; // Clear loading/previous ad
    con.style.position = 'relative';
    con.style.overflow = 'hidden';
    con.style.background = ad.s[2]; // Background Color
    con.style.cursor = 'default';

    // Loop through layers
    ad.l.forEach(l => {
        const el = document.createElement('div');
        // l structure: [type, x, y, w, h, z, content, col, bg, rad, url]
        const type = ['','txt','img','btn','vid'][l[0]];
        
        // Common Styles
        el.style.position = 'absolute';
        el.style.left = l[1] + 'px';
        el.style.top = l[2] + 'px';
        el.style.zIndex = l[5];
        el.style.borderRadius = l[9] + 'px';
        el.style.pointerEvents = 'none'; // Click passes through unless url exists

        // --- TYPE SPECIFIC RENDERING ---
        if (type === 'txt') {
            el.innerText = l[6]; 
            el.style.color = l[7];
            el.style.fontSize = (l[4] * 0.6) + 'px'; // Height based font size
            el.style.whiteSpace = 'nowrap';
            el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        } 
        else if (type === 'btn') {
            el.innerText = l[6]; 
            el.style.background = l[8]; 
            el.style.color = l[7];
            el.style.width = l[3] + 'px'; 
            el.style.height = l[4] + 'px';
            el.style.display = 'flex'; 
            el.style.justifyContent = 'center'; 
            el.style.alignItems = 'center'; 
            el.style.fontWeight = 'bold';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        } 
        else if (type === 'img') {
            el.style.width = l[3] + 'px'; 
            el.style.height = l[4] + 'px';
            el.style.backgroundImage = `url(${l[6]})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
        }
        else if (type === 'vid') {
            // 🔥 FIXED: Video Support
            el.style.width = l[3] + 'px'; 
            el.style.height = l[4] + 'px';
            el.style.overflow = 'hidden';
            el.innerHTML = `<video src="${l[6]}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>`;
        }

        // --- CLICK HANDLING ---
        // Agar layer pe URL set hai (Editor me "Link URL" dala tha)
        if (l[10] && l[10].length > 4) {
            el.style.pointerEvents = 'auto'; // Enable clicks
            el.style.cursor = 'pointer';
            el.onclick = (e) => { 
                e.stopPropagation(); 
                trackClick(ad.id, l[10]); 
            };
        }

        con.appendChild(el);
    });
}

// --- CLICK TRACKING ---
function trackClick(id, url) {
    // 1. Open Link Immediately (UX ke liye fast hona chahiye)
    window.open(url, '_blank');

    // 2. Count Click in Background
    const clickRef = ref(db, 'mista_stats/' + id + '/c');
    runTransaction(clickRef, (currentClicks) => {
        return (currentClicks || 0) + 1;
    });
}
