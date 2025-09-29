// Constants
const ENGINES = [
    { name: 'Google', url: 'https://www.google.com/search?q=', category: 'web' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=', category: 'web' },
    { name: 'Google Images', url: 'https://www.google.com/search?tbm=isch&q=', category: 'images' },
    { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', category: 'videos' },
    { name: 'News', url: 'https://news.google.com/search?q=', category: 'news' }
];

const SELECTORS = {
    web: 'div.g, li.b_algo',
    images: 'div.isv-r',
    videos: 'div#dismissable',
    news: 'article'
};

// Utility functions
const $ = (id) => document.getElementById(id);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
const sanitizeInput = (input) => input.replace(/[<>"'&]/g, '').trim();
const suggestSpelling = (query) => {
    const corrections = { 'mausam': 'weather', 'calculetor': 'calculator', 'delhi': 'Delhi' };
    return corrections[query.toLowerCase()] || query;
};

// DOM elements
const els = {
    mainPage: $('main-page'),
    resultsPage: $('results-page'),
    mainSearchForm: $('main-search-form'),
    resultsSearchForm: $('results-search-form'),
    mainSearchInput: $('main-search-input'),
    resultsSearchInput: $('results-search-input'),
    autocompleteSuggestions: $('autocomplete-suggestions'),
    resultsAutocompleteSuggestions: $('results-autocomplete-suggestions'),
    tabsContainer: $('tabs-container'),
    aiSummaryContainer: $('ai-summary-container'),
    instantAnswerContainer: $('instant-answer-container'),
    resultsContainer: $('results-container'),
    relatedSearches: $('related-searches'),
    translateContainer: $('translate-container'),
    findInPageContainer: $('find-in-page-container'),
    themeCheckbox: $('theme-checkbox'),
    menuButton: $('menu-button'),
    closeMenuButton: $('close-menu-button'),
    sideMenu: $('side-menu'),
    overlay: $('overlay'),
    headerLogoHome: $('header-logo-home'),
    menuHomeBtn: $('menu-home-btn'),
    backToTop: $('back-to-top'),
    backToHome: $('back-to-home'),
    voiceSearchBtn: $('voice-search-btn'),
    dateFilter: $('date-filter'),
    locationFilter: $('location-filter'),
    translateTool: $('translate-tool'),
    findInPage: $('find-in-page')
};

// State and settings
let state = { query: '', page: 1, resultsPerPage: 10, tab: 'web' };
let settings = { darkMode: false };
let lastResults = [];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    loadSettings();
    registerServiceWorker();
    setupEventListeners();
});

// Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW error:', err));
    }
}

// Settings
function loadSettings() {
    const saved = localStorage.getItem('mistaFySettings');
    if (saved) {
        settings = JSON.parse(saved);
        document.body.classList.toggle('dark-mode', settings.darkMode);
        els.themeCheckbox.checked = settings.darkMode;
        updateShimmer();
    }
}

function saveSettings() {
    localStorage.setItem('mistaFySettings', JSON.stringify(settings));
}

function updateShimmer() {
    $$('.shimmer').forEach(el => {
        el.style.background = settings.darkMode 
            ? 'linear-gradient(90deg, #2a2a2a 25%, #4a4a4a 50%, #2a2a2a 75%)'
            : 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
    });
}

// Drawer
function toggleDrawer() {
    els.sideMenu.classList.toggle('open');
    els.overlay.classList.toggle('hidden', !els.sideMenu.classList.contains('open'));
}

function closeDrawer() {
    els.sideMenu.classList.remove('open');
    els.overlay.classList.add('hidden');
}

// Event Listeners
function setupEventListeners() {
    els.themeCheckbox.addEventListener('change', () => {
        settings.darkMode = els.themeCheckbox.checked;
        saveSettings();
        loadSettings();
    });

    els.menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDrawer();
    });

    els.closeMenuButton.addEventListener('click', closeDrawer);
    $$('a', els.sideMenu).forEach(link => link.addEventListener('click', closeDrawer));
    els.overlay.addEventListener('click', closeDrawer);

    document.addEventListener('click', (e) => {
        if (els.sideMenu.classList.contains('open') && !els.sideMenu.contains(e.target) && !els.menuButton.contains(e.target)) {
            closeDrawer();
        }
        if (!els.mainSearchInput.contains(e.target) && !els.autocompleteSuggestions.contains(e.target)) {
            els.autocompleteSuggestions.classList.add('hidden');
        }
        if (!els.resultsSearchInput.contains(e.target) && !els.resultsAutocompleteSuggestions.contains(e.target)) {
            els.resultsAutocompleteSuggestions.classList.add('hidden');
        }
    });

    els.mainSearchForm.addEventListener('submit', (e) => search(e, els.mainSearchInput));
    els.resultsSearchForm.addEventListener('submit', (e) => search(e, els.resultsSearchInput));

    [els.mainSearchInput, els.resultsSearchInput].forEach(input => {
        input.addEventListener('input', debounce((e) => {
            fetchAutocomplete(e.target.value, input === els.mainSearchInput ? els.autocompleteSuggestions : els.resultsAutocompleteSuggestions);
        }, 300));
    });

    els.tabsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            $$('.tab-button', els.tabsContainer).forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            state.tab = e.target.getAttribute('data-tab');
            els.resultsContainer.classList.add('shimmer');
            setTimeout(() => {
                els.resultsContainer.classList.remove('shimmer');
                displayResults(lastResults);
            }, 500);
        }
    });

    window.addEventListener('scroll', () => {
        [els.backToTop, els.backToHome].forEach(btn => btn.classList.toggle('hidden', document.documentElement.scrollTop <= 50));
        if (document.documentElement.scrollTop + window.innerHeight >= document.documentElement.scrollHeight - 100 && state.page * state.resultsPerPage < 50) {
            els.resultsContainer.classList.add('shimmer');
            fetchResults();
        }
    });

    [els.headerLogoHome, els.menuHomeBtn, els.backToHome].forEach(el => el.addEventListener('click', () => {
        els.resultsPage.classList.add('hidden');
        els.mainPage.classList.remove('hidden');
        [els.translateContainer, els.findInPageContainer, els.autocompleteSuggestions, els.resultsAutocompleteSuggestions].forEach(el => el.classList.add('hidden'));
        closeDrawer();
    }));

    els.backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    setupVoiceSearch();

    els.translateTool.addEventListener('click', () => {
        els.translateContainer.classList.remove('hidden');
        els.findInPageContainer.classList.add('hidden');
        els.translateContainer.innerHTML = `
            <div class="widget-card">
                <h3>Translate</h3>
                <input type="text" id="translate-input" placeholder="Text">
                <select id="translate-to">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                </select>
                <button onclick="performTranslation()">Translate</button>
                <p id="translate-result"></p>
            </div>`;
        closeDrawer();
    });

    els.findInPage.addEventListener('click', () => {
        els.findInPageContainer.classList.remove('hidden');
        els.translateContainer.classList.add('hidden');
        els.findInPageContainer.innerHTML = `
            <div class="widget-card">
                <h3>Find in Page</h3>
                <input type="text" id="find-input" placeholder="Text">
                <button onclick="performFindInPage()">Find</button>
                <p id="find-result"></p>
            </div>`;
        closeDrawer();
    });

    [els.dateFilter, els.locationFilter].forEach(filter => filter.addEventListener('change', () => {
        applyFilters();
        els.resultsContainer.classList.add('shimmer');
        fetchResults();
    }));
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Voice Search
function setupVoiceSearch() {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        els.voiceSearchBtn.addEventListener('click', () => {
            const recognition = new SpeechRecognition();
            recognition.lang = 'hi-IN';
            recognition.start();
            els.mainSearchInput.placeholder = 'बोलें...';
            recognition.onresult = (e) => {
                els.mainSearchInput.value = e.results[0][0].transcript;
                els.mainSearchForm.requestSubmit();
            };
            recognition.onerror = () => els.mainSearchInput.placeholder = 'सुन नहीं पाया।';
            recognition.onend = () => els.mainSearchInput.placeholder = 'खोजें...';
        });
    } else {
        els.voiceSearchBtn.classList.add('hidden');
    }
}

// Search
async function search(e, input) {
    e.preventDefault();
    state.query = sanitizeInput(input.value);
    if (!state.query) return;
    state.query = suggestSpelling(state.query);
    applyFilters();
    [els.mainSearchInput.value, els.resultsSearchInput.value] = [state.query, state.query];
    [els.aiSummaryContainer, els.instantAnswerContainer, els.resultsContainer, els.tabsContainer, els.relatedSearches].forEach(el => {
        el.innerHTML = '';
        el.classList.add('shimmer');
    });
    [els.translateContainer, els.findInPageContainer].forEach(el => el.classList.add('hidden'));
    state.page = 1;
    await handleInstantAnswer(state.query) || await fetchResults();
    els.resultsPage.classList.remove('hidden');
    els.mainPage.classList.add('hidden');
    closeDrawer();
}

function applyFilters() {
    state.query = state.query.replace(/(after|near):[^ ]+/g, '') + 
        ` ${els.dateFilter.value ? `after:${els.dateFilter.value}` : ''} ${els.locationFilter.value ? `near:${els.locationFilter.value}` : ''}`.trim();
}

// Instant Answers
async function handleInstantAnswer(query) {
    const q = query.toLowerCase();
    const removeShimmer = () => els.instantAnswerContainer.classList.remove('shimmer');

    if (/my ip/i.test(q)) {
        removeShimmer();
        els.instantAnswerContainer.innerHTML = '<div class="widget-card"><h3>आपका IP</h3><p>ऑफलाइन: IP नहीं दिखाया जा सकता।</p></div>';
        return true;
    }
    if (/calculator/i.test(q)) {
        removeShimmer();
        els.instantAnswerContainer.innerHTML = `
            <div class="widget-card">
                <h3>कैलकुलेटर</h3>
                <input type="number" id="calc-num1" placeholder="संख्या 1">
                <input type="number" id="calc-num2" placeholder="संख्या 2">
                <select id="calc-op"><option value="+">+</option><option value="-">-</option><option value="*">×</option><option value="/">÷</option></select>
                <button onclick="calculate()">हिसाब करें</button>
                <p id="calc-result"></p>
            </div>`;
        return true;
    }
    if (/(\d+)\s*([\+\-\*\/])\s*(\d+)/i.test(q)) {
        const [, num1, operator, num2] = q.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
        const result = eval(`${parseInt(num1)}${operator}${parseInt(num2)}`);
        removeShimmer();
        els.instantAnswerContainer.innerHTML = `<div class="widget-card"><h3>कैलकुलेटर</h3><p>${num1} ${operator} ${num2} = ${result}</p></div>`;
        return true;
    }
    if (/(weather|mausam)\s(in|mein)\s(.+)/i.test(q)) {
        const city = q.match(/(weather|mausam)\s(in|mein)\s(.+)/)[3];
        removeShimmer();
        els.instantAnswerContainer.innerHTML = `<div class="widget-card"><h3>${city} का मौसम</h3><p>ऑफलाइन: 25°C, साफ़</p></div>`;
        return true;
    }
    if (/news\s(.+)/i.test(q)) {
        const topic = q.match(/news\s(.+)/)[1];
        removeShimmer();
        els.instantAnswerContainer.innerHTML = `<div class="widget-card"><h3>${topic} की खबरें</h3><p>ऑफलाइन: कोई लाइव अपडेट नहीं</p></div>`;
        return true;
    }
    return false;
}

// Fetch Results
async function fetchResults() {
    try {
        const results = (await Promise.allSettled(ENGINES.map(engine => fetchData(engine, state.query))))
            .flatMap(r => r.status === 'fulfilled' ? [r.value] : []).flat();
        lastResults = results;
        if (results.length) {
            generateSummary(results);
            displayResults(results);
            generateTabs(results);
            await fetchAutocomplete(state.query, els.relatedSearches, true);
        } else {
            els.resultsContainer.classList.remove('shimmer');
            els.resultsContainer.innerHTML = '<div class="result-item">कोई परिणाम नहीं।</div>';
        }
        state.page++;
    } catch (err) {
        console.error('Fetch error:', err);
        els.resultsContainer.classList.remove('shimmer');
        els.resultsContainer.innerHTML = '<div class="result-item">ऑफलाइन: इंटरनेट नहीं है।</div>';
    }
}

function generateSummary(results) {
    const summary = results.map(r => r.snippet).filter(s => s).slice(0, 3).join(' ').substring(0, 100) + '...' || 'No summary.';
    els.aiSummaryContainer.classList.remove('shimmer');
    els.aiSummaryContainer.innerHTML = `<div class="summary-card"><h3>Summary</h3><p>${summary}</p></div>`;
}

function generateTabs(results) {
    const categories = [...new Set(results.map(r => r.category))];
    els.tabsContainer.innerHTML = categories.map(tab => `
        <button class="tab-button ${tab === state.tab ? 'active' : ''}" data-tab="${tab}">
            ${tab === 'web' ? 'सभी' : tab === 'images' ? 'छवियां' : tab === 'videos' ? 'वीडियो' : 'खबरें'}
        </button>`).join('');
}

function displayResults(results) {
    els.resultsContainer.classList.remove('shimmer');
    els.resultsContainer.innerHTML = results
        .filter(item => state.tab === 'all' || item.category === state.tab)
        .slice(0, state.page * state.resultsPerPage)
        .map(item => `
            <div class="result-item" data-category="${item.category}">
                ${item.thumbnail && item.category !== 'videos' ? `<img src="${item.thumbnail}" class="thumbnail" alt="${item.title}">` : ''}
                ${item.category === 'videos' ? `<video src="${item.thumbnail}" class="thumbnail" controls muted></video>` : ''}
                <div class="result-content">
                    <a href="${item.link || '#'}" target="_blank">
                        <img src="${item.favicon || 'https://www.google.com/favicon.ico'}" class="favicon" alt="favicon">
                        ${item.title || 'कोई शीर्षक नहीं'}
                    </a>
                    <p>${item.snippet || 'कोई विवरण नहीं'}</p>
                    <small>स्रोत: ${item.source || 'अज्ञात'}</small>
                    ${item.time ? `<div class="time">प्रकाशित: ${item.time}</div>` : ''}
                </div>
            </div>`).join('') || '<div class="result-item">कोई परिणाम नहीं।</div>';
}

// API Calls
async function fetchData(engine, query) {
    try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(engine.url + encodeURIComponent(query))}`, {
            mode: 'cors',
            cache: 'no-cache'
        });
        const data = await res.json();
        return data.contents ? parseResults(new DOMParser().parseFromString(data.contents, 'text/html'), engine.category) : [];
    } catch (err) {
        console.error(`Fetch error for ${engine.name}:`, err);
        return [{ title: 'ऑफलाइन', link: '#', snippet: 'कोई कनेक्शन नहीं', source: '-', category: engine.category, favicon: '', time: '' }];
    }
}

async function fetchAutocomplete(query, container, show = false) {
    if (!query || query.length < 2) {
        if (show) els.relatedSearches.innerHTML = '';
        container.classList.add('hidden');
        return;
    }
    try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://suggestqueries.google.com/complete/search?client=firefox&q=' + encodeURIComponent(query))}`);
        const suggestions = JSON.parse((await res.json()).contents)[1].slice(0, 5);
        const html = suggestions.map(s => `<div class="suggestion-item" onclick="selectSuggestion('${s}')">${s}</div>`).join('');
        if (show) els.relatedSearches.innerHTML = html;
        container.innerHTML = html;
        container.classList.toggle('hidden', !suggestions.length);
    } catch (err) {
        console.error('Autocomplete error:', err);
        if (show) els.relatedSearches.innerHTML = '<div class="suggestion-item">ऑफलाइन: सुझाव नहीं।</div>';
        container.classList.add('hidden');
    }
}

function parseResults(doc, category) {
    return $$(SELECTORS[category], doc).map(item => {
        const title = item.querySelector(category === 'web' ? 'h3, h2' : 'h3, h2, a div');
        const link = item.querySelector('a');
        const snippet = item.querySelector(category === 'web' ? 'span.st, p' : category === 'images' ? 'div' : category === 'videos' ? 'div#result-stats' : 'div.snippet');
        const thumbnail = item.querySelector('img, video')?.src || '';
        const time = item.querySelector('time, span.datetime')?.textContent || '';
        const favicon = `https://www.google.com/s2/favicons?domain=${link?.hostname || ''}`;
        return title && link ? { title: title.textContent, link: link.href, snippet: snippet?.textContent || '', thumbnail, source: link.hostname, category, favicon, time } : null;
    }).filter(item => item);
}

// Global functions
window.selectSuggestion = (suggestion) => {
    [els.mainSearchInput.value, els.resultsSearchInput.value] = [suggestion, suggestion];
    [els.autocompleteSuggestions, els.resultsAutocompleteSuggestions].forEach(el => el.classList.add('hidden'));
    els.mainSearchForm.requestSubmit();
    closeDrawer();
};

window.calculate = () => {
    const num1 = $('calc-num1')?.value || 0;
    const num2 = $('calc-num2')?.value || 0;
    const operator = $('calc-op')?.value || '+';
    $('calc-result').textContent = eval(`${num1} ${operator} ${num2}`) || 'त्रुटि';
};

window.performTranslation = async () => {
    const text = $('translate-input')?.value;
    const toLang = $('translate-to')?.value;
    if (text && toLang) {
        try {
            const res = await fetch(`https://api.popcat.xyz/translate?text=${encodeURIComponent(text)}&to=${toLang}`);
            $('translate-result').textContent = (await res.json()).translated || 'Translation failed.';
        } catch {
            $('translate-result').textContent = 'Translation failed.';
        }
    }
};

window.performFindInPage = () => {
    const text = $('find-input')?.value;
    if (text) {
        const regex = new RegExp(text, 'gi');
        $('find-result').innerHTML = `Found ${document.body.innerHTML.match(regex)?.length || 0} occurrences.`;
        $$('.highlight').forEach(el => el.classList.remove('highlight'));
        const walker = document.createTreeWalker(document.body, Node.TEXT_NODE);
        let node;
        while ((node = walker.nextNode())) {
            if (regex.test(node.textContent)) {
                const span = document.createElement('span');
                span.className = 'highlight';
                span.innerHTML = node.textContent.replace(regex, match => `<mark>${match}</mark>`);
                node.parentNode.replaceChild(span, node);
            }
        }
    }
};
