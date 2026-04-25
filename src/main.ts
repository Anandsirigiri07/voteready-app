import { GoogleGenAI } from "@google/genai";
import * as L from "leaflet";

// --- MAP & ROUTING ---
let mapInstance: L.Map | null = null;
let watchId: number | null = null;
let liveLocation: { lat: number, lng: number } | null = null;
let destLocation: { lat: number, lng: number } | null = null;
let liveMarker: L.Marker | null = null;
let destMarker: L.Marker | null = null;
let boothMarkers: L.Marker[] = [];
let routeLine: L.Polyline | null = null;
let isTracking = false;

const stationIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function initMap(lat: number, lng: number) {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    
    if (!mapInstance) {
        mapEl.innerHTML = '';
        mapInstance = L.map('map').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapInstance);
        
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }
}

async function geocode(query: string): Promise<{lat: number, lng: number} | null> {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json`);
        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) {
        console.error("Geocoding failed for", query);
    }
    return null;
}

async function updateRoute() {
    if (!mapInstance) return;
    
    if (liveMarker) liveMarker.remove();
    if (destMarker) destMarker.remove();
    if (routeLine) routeLine.remove();
    
    if (liveLocation) {
        liveMarker = L.marker([liveLocation.lat, liveLocation.lng]).addTo(mapInstance).bindPopup("Origin");
    }
    
    if (destLocation) {
        destMarker = L.marker([destLocation.lat, destLocation.lng], { icon: stationIcon }).addTo(mapInstance).bindPopup("Destination");
    }
    
    if (liveLocation && destLocation) {
        document.getElementById('route-info-view')!.style.display = 'block';
        document.getElementById('route-status')!.innerText = 'Calculating route...';
        
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${liveLocation.lng},${liveLocation.lat};${destLocation.lng},${destLocation.lat}?overview=full&geometries=geojson`;
            
            // Add a timeout to the fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            const data = await res.json();
            
            if (data.routes && data.routes.length > 0) {
                const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                routeLine = L.polyline(coords, { color: '#1A56DB', weight: 5 }).addTo(mapInstance);
                
                if (!isTracking) {
                    mapInstance.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
                }
                
                const dist = (data.routes[0].distance / 1000).toFixed(1);
                const duration = Math.round(data.routes[0].duration / 60);
                document.getElementById('route-status')!.innerText = `${dist} km • ${duration} min drive`;
            } else {
                document.getElementById('route-status')!.innerText = 'No route found between these points.';
            }
        } catch (e) {
            document.getElementById('route-status')!.innerText = 'Routing service unavailable. Please try again.';
        }
    } else if (liveLocation && !isTracking) {
        mapInstance.setView([liveLocation.lat, liveLocation.lng], 14);
    }
}

async function findNearbyBooths() {
    const pincode = (document.getElementById('pincode-input') as HTMLInputElement).value.trim();
    if (!pincode) {
        alert("Please enter a Pincode or Area.");
        return;
    }

    const resultsContainer = document.getElementById('booth-results')!;
    resultsContainer.innerHTML = '<p style="font-size: 14px; font-weight: 700; color: var(--primary);">Locating area...</p>';

    const coords = await geocode(pincode);
    if (!coords) {
        alert("Could not locate the area. Please try a different pincode.");
        resultsContainer.innerHTML = '';
        return;
    }

    if (!mapInstance) initMap(coords.lat, coords.lng);
    mapInstance!.setView([coords.lat, coords.lng], 15);

    // Clear previous booth markers
    boothMarkers.forEach(m => m.remove());
    boothMarkers = [];
    if (destMarker) destMarker.remove();
    if (routeLine) routeLine.remove();
    document.getElementById('route-info-view')!.style.display = 'none';

    resultsContainer.innerHTML = '<p style="font-size: 14px; font-weight: 700; color: var(--primary);">Searching for booths...</p>';

    try {
        // Use Nominatim search for "polling station" near the geocoded pincode area
        const searchUrl = `https://nominatim.openstreetmap.org/search?q=polling+station+near+${encodeURIComponent(pincode)}&format=json&addressdetails=1&limit=5`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        let booths = data.map((el: any) => ({
            name: el.display_name.split(',')[0] || "Polling Station",
            lat: parseFloat(el.lat),
            lng: parseFloat(el.lon),
            address: el.display_name.split(',').slice(1, 3).join(',').trim() || "Nearby Area"
        }));

        // Fallback to simulated data if no real data found or search failed
        if (booths.length === 0) {
            booths = [
                { name: "Govt. High School (Booth #42)", lat: coords.lat + 0.0015, lng: coords.lng + 0.0008, address: "Main Road, Sector 2" },
                { name: "Public Community Hall (Booth #43)", lat: coords.lat - 0.0012, lng: coords.lng + 0.0025, address: "Near Central Park" },
                { name: "District Primary School (Booth #44)", lat: coords.lat + 0.0009, lng: coords.lng - 0.0018, address: "Station Area" }
            ];
        }

        renderBoothList(booths, pincode);

    } catch (e) {
        console.error("Booth search failed:", e);
        const fallbackBooths = [
            { name: "Govt. School (Booth #42)", lat: coords.lat + 0.0015, lng: coords.lng + 0.0008, address: "Main Road, Sector 2" },
            { name: "Public Community Hall (Booth #43)", lat: coords.lat - 0.0012, lng: coords.lng + 0.0025, address: "Near Central Park" }
        ];
        renderBoothList(fallbackBooths, pincode);
    }
}

function renderBoothList(booths: any[], pincode: string) {
    const resultsContainer = document.getElementById('booth-results')!;
    resultsContainer.innerHTML = `<p style="font-size: 12px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Found ${booths.length} Booths near ${pincode}</p>`;
    
    booths.forEach((booth: any) => {
        const marker = L.marker([booth.lat, booth.lng], { icon: stationIcon })
            .addTo(mapInstance!)
            .bindPopup(`<b>${booth.name}</b><br>${booth.address}`);
        boothMarkers.push(marker);

        const card = document.createElement('div');
        card.className = 'card';
        card.style.margin = '0';
        card.style.padding = '14px';
        card.style.cursor = 'pointer';
        card.style.borderLeft = '4px solid var(--primary)';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.innerHTML = `
            <div>
                <div style="font-weight: 900; font-size: 14px; color: var(--primary);">${booth.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${booth.address}</div>
            </div>
            <div style="background: #EFF6FF; color: var(--primary); padding: 8px; border-radius: 8px; font-size: 12px;">→</div>
        `;
        card.onclick = () => routeToBooth(booth.lat, booth.lng);
        resultsContainer.appendChild(card);
    });
}

async function routeToBooth(lat: number, lng: number) {
    const originInput = (document.getElementById('origin-input') as HTMLInputElement).value.trim();
    
    if (originInput && !liveLocation) {
        document.getElementById('route-info-view')!.style.display = 'block';
        document.getElementById('route-status')!.innerText = 'Geocoding origin...';
        const originCoords = await geocode(originInput);
        if (originCoords) {
            liveLocation = originCoords;
        } else {
            alert("Could not locate your origin address.");
            document.getElementById('route-info-view')!.style.display = 'none';
            return;
        }
    }

    if (!liveLocation && !isTracking) {
        alert("Please enable GPS or enter your location in 'My Location' field.");
        return;
    }
    destLocation = { lat, lng };
    updateRoute();
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
}

function toggleLiveTracking() {
    const btn = document.getElementById('live-track-btn')!;
    
    if (isTracking) {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        isTracking = false;
        btn.style.background = "#F1F5F9";
        btn.style.color = "var(--text-muted)";
        return;
    }
    
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }
    
    btn.style.background = "var(--primary)";
    btn.style.color = "white";
    isTracking = true;
    (document.getElementById('origin-input') as HTMLInputElement).value = '';
    
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            liveLocation = { lat, lng };
            if (!mapInstance) initMap(lat, lng);
            if (isTracking) mapInstance!.setView([lat, lng], 16);
            updateRoute();
        },
        (error) => {
            toggleLiveTracking();
            let msg = "Unable to retrieve your location. Please ensure location permissions are granted.";
            if (error.code === 1) msg = "Location access denied.";
            if (error.code === 2) msg = "Position unavailable. Please type your origin manually.";
            if (error.code === 3) msg = "Location request timed out.";
            alert(msg);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

// --- STATE ---
const UI_DATE = new Date('2026-04-15T07:00:00');
const state = {
    lang: localStorage.getItem('vr-lang') || 'en',
    progress: JSON.parse(localStorage.getItem('vr-progress') || 'null') || {
        voterId: false, aadhaar: false, slip: false, pen: false, phone: false
    },
    reminder: JSON.parse(localStorage.getItem('vr-rem') || 'null') || null,
    votes: JSON.parse(localStorage.getItem('vr-votes') || 'null') || [42, 68, 31, 12],
    candidates: [
        { name: 'Dr. Rahul Mehta', party: 'Development Party', color: '#3B82F6' },
        { name: 'Smt. Kavita Rao', party: 'Social Front', color: '#10B981' },
        { name: 'Shri Amit Singh', party: 'National Alliance', color: '#EF4444' },
        { name: 'NOTA', party: 'None Of The Above', color: '#64748B' }
    ],
    rights: [
        { q: 'My name is missing from the list', a: 'Ask for a "Challenged Vote" from the Presiding Officer. You can vote if you prove your identity is genuine via Aadhaar or Voter ID.' },
        { q: 'I feel pressured by someone here', a: 'Electoral intimidation is a crime. Inform the security forces or observers at the booth immediately.' },
        { q: 'The electronic machine failed', a: 'Inform the polling officer. A replacement unit will be arranged for your booth instantly.' }
    ],
    news: [
        { id: 1, title: "Election Commission Announces Polling Dates", desc: "Phase 1 of voting to begin on April 15th across 12 states.", icon: "📅" },
        { id: 2, title: "New Voter ID Registration Deadline Extended", desc: "First-time voters can now register until the end of the month.", icon: "🆔" },
        { id: 3, title: "EVM Security Measures Tightened", desc: "ECI confirms three-layer security for all balloting units.", icon: "🛡️" }
    ]
};

// --- i18n ---
const i18n = {
    en: {
        election: "Election Day",
        daysToGo: "Days To Go",
        namaste: "Namaste, Voter",
        readyTitle: "Almost Voter Ready!",
        readySub: "Update your booth checklist",
        findBooth: "Find Booth",
        trainEvm: "Train EVM",
        myRights: "My Rights",
        results: "Results",
        actionRem: "Action Required",
        missSlot: "Never miss your slot",
        setAlert: "Set Alert",
        evmTitle: "EVM Trainer",
        evmMsg: "Unit is ready to receive vote",
        boothTitle: "Booth Locator",
        rightsTitle: "Know Your Rights",
        resultsTitle: "Live Trends",
        remTitle: "Set Voting Alert",
        lblName: "Your Full Name",
        lblTime: "Reminder Date & Time",
        saveRem: "Lock Reminder",
        remOk: "Reminder Active!",
        chatTitle: "VoteGuide AI",
        chatSub: "Ask questions about voting, candidates, or help.",
        navChat: "AI Chat",
        navHome: "Home",
        navEvm: "EVM",
        navBooth: "Booth",
        navRights: "Rights"
    },
    hi: {
        election: "चुनाव का दिन",
        daysToGo: "दिन शेष",
        namaste: "नमस्ते, मतदाता",
        readyTitle: "वोट के लिए लगभग तैयार!",
        readySub: "अपनी बूथ चेकलिस्ट अपडेट करें",
        findBooth: "बूथ खोजें",
        trainEvm: "EVM ट्रेनिंग",
        myRights: "मेरे अधिकार",
        results: "परिणाम",
        actionRem: "कार्य आवश्यक",
        missSlot: "अपना समय कभी न चूकें",
        setAlert: "अलर्ट सेट करें",
        evmTitle: "EVM प्रशिक्षण",
        evmMsg: "मसीह वोट लेने के लिए तैयार है",
        boothTitle: "अपना बूथ खोजें",
        rightsTitle: "अधिकार जानें",
        resultsTitle: "लाइव रुझान",
        remTitle: "वोटिंग अलर्ट सेट करें",
        lblName: "आपका पूरा नाम",
        lblTime: "समय और तारीख",
        saveRem: "रिमाइंडर लॉक करें",
        remOk: "रिमाइंडर सक्रिय!",
        chatTitle: "वोटगाइड AI",
        chatSub: "वोटिंग, उम्मीदवारों या तकनीकी मदद के लिए पूछें।",
        navChat: "AI चैट",
        navHome: "होम",
        navEvm: "EVM",
        navBooth: "बूथ",
        navRights: "अधिकार"
    }
};

// --- GEMINI AI ---
const VITE_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: VITE_KEY || "DUMMY_KEY" });
const chatModel = "gemini-2.0-flash";

console.log("VoteReady Initializing...");
if (!VITE_KEY) console.warn("VITE_GEMINI_API_KEY missing - AI Chat will not function.");

// --- ATTACH GLOBALS EARLY ---
// This ensures that onclick handlers in index.html work immediately after the script loads.
(window as any).setLang = setLang;
(window as any).navigate = navigate;
(window as any).triggerVote = triggerVote;
(window as any).resetEVM = resetEVM;
(window as any).sendChatMessage = sendChatMessage;
(window as any).findNearbyBooths = findNearbyBooths;
(window as any).routeToBooth = routeToBooth;
(window as any).toggleLiveTracking = toggleLiveTracking;
(window as any).downloadICS = () => {
    const r = state.reminder;
    if (!r) return;
    const start = new Date(r.time).toISOString().replace(/-|:|\.\d+/g, "");
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start}\nSUMMARY:Voting - VoteReady\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], {type: 'text/calendar'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'vote.ics'; a.click();
};
(window as any).handleReminder = (e: Event) => {
    e.preventDefault();
    state.reminder = { 
        name: (document.getElementById('rem-name') as HTMLInputElement).value, 
        time: (document.getElementById('rem-time') as HTMLInputElement).value 
    };
    localStorage.setItem('vr-rem', JSON.stringify(state.reminder));
    (document.getElementById('reminder-form') as HTMLElement).style.display = 'none';
    (document.getElementById('reminder-success') as HTMLElement).style.display = 'block';
};


// --- UTILS ---
function updateUIStrings() {
    const t = i18n[state.lang as keyof typeof i18n];
    (document.getElementById('label-election') as HTMLElement).innerText = t.election;
    (document.getElementById('label-days-to-go') as HTMLElement).innerText = t.daysToGo;
    (document.getElementById('btn-booth') as HTMLElement).innerText = t.findBooth;
    (document.getElementById('btn-evm') as HTMLElement).innerText = t.trainEvm;
    (document.getElementById('btn-rights') as HTMLElement).innerText = t.myRights;
    (document.getElementById('btn-results') as HTMLElement).innerText = t.results;
    (document.getElementById('label-reminder') as HTMLElement).innerText = t.actionRem;
    (document.getElementById('reminder-box-title') as HTMLElement).innerText = t.missSlot;
    (document.getElementById('evm-title') as HTMLElement).innerText = t.evmTitle;
    (document.getElementById('evm-msg') as HTMLElement).innerText = t.evmMsg;
    (document.getElementById('booth-title') as HTMLElement).innerText = t.boothTitle;
    (document.getElementById('rights-title') as HTMLElement).innerText = t.rightsTitle;
    (document.getElementById('results-title') as HTMLElement).innerText = t.resultsTitle;
    (document.getElementById('rem-title') as HTMLElement).innerText = t.remTitle;
    (document.getElementById('lbl-name') as HTMLElement).innerText = t.lblName;
    (document.getElementById('lbl-time') as HTMLElement).innerText = t.lblTime;
    (document.getElementById('btn-save-rem') as HTMLElement).innerText = t.saveRem;
    (document.getElementById('txt-rem-ok') as HTMLElement).innerText = t.remOk;
    
    // New labels
    (document.getElementById('chat-title') as HTMLElement).innerText = t.chatTitle;
    (document.getElementById('chat-sub') as HTMLElement).innerText = t.chatSub;
    (document.getElementById('nav-lbl-home') as HTMLElement).innerText = t.navHome;
    (document.getElementById('nav-lbl-evm') as HTMLElement).innerText = t.navEvm;
    (document.getElementById('nav-lbl-booth') as HTMLElement).innerText = t.navBooth;
    (document.getElementById('nav-lbl-rights') as HTMLElement).innerText = t.navRights;
    (document.getElementById('nav-lbl-chat') as HTMLElement).innerText = t.navChat;

    // News feed label
    const newsLabel = document.getElementById('label-news-feed');
    if (newsLabel) newsLabel.innerText = state.lang === 'hi' ? 'लाइव समाचार अपडेट' : 'Live News Feed';
}

function navigate(view: string) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`)?.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`nav-${view}`)?.classList.add('active');
    
    if (view === 'results') renderResults();
    if (view === 'home') renderNews();
    window.scrollTo(0,0);
}

// --- NEWS FEED ---
function renderNews() {
    const container = document.getElementById('home-news-container');
    if (!container) return;
    container.innerHTML = '';
    state.news.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.minWidth = '220px';
        div.style.padding = '16px';
        div.style.background = 'white';
        div.style.margin = '0';
        div.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 12px;">${item.icon}</div>
            <h5 style="font-size: 13px; font-weight: 900; margin: 0 0 6px; letter-spacing: -0.5px; line-height: 1.2;">${item.title}</h5>
            <p style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin: 0; line-height: 1.4;">${item.desc}</p>
        `;
        container.appendChild(div);
    });
}

// --- AI CHAT ---
async function sendChatMessage() {
    const input = document.getElementById('chat-input') as HTMLInputElement;
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage(msg, 'user');
    input.value = '';
    
    const loadingId = appendMessage('...', 'assistant', true);

    try {
        const response = await ai.models.generateContent({
            model: chatModel,
            contents: msg,
            config: {
                systemInstruction: "You are VoteReady AI, a helpful assistant for first-time voters in India. Provide accurate information about the voting process, requirements (Aadhaar, Voter ID), EVM machine operation, and common voter rights. Keep answers concise, helpful, and professional. Use Indian English context."
            }
        });
        
        const text = response.text || "I'm sorry, I couldn't process that.";
        updateMessage(loadingId, text);
    } catch (error) {
        console.error("AI Error:", error);
        updateMessage(loadingId, "Connection error. Please try again later.");
    }
}

function appendMessage(text: string, sender: 'user' | 'assistant', isLoading = false) {
    const container = document.getElementById('chat-messages');
    if (!container) return '';
    const id = 'msg-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.style.padding = '14px 18px';
    div.style.borderRadius = sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px';
    div.style.maxWidth = '85%';
    div.style.fontSize = '14px';
    div.style.fontWeight = '600';
    div.style.lineHeight = '1.5';
    div.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
    div.style.background = sender === 'user' ? 'var(--primary)' : '#F1F5F9';
    div.style.color = sender === 'user' ? 'white' : 'var(--primary)';
    
    if (isLoading) {
        div.innerHTML = `<span class="animate-pulse">● ● ●</span>`;
    } else {
        div.innerText = text;
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

function updateMessage(id: string, text: string) {
    const div = document.getElementById(id);
    if (div) {
        div.innerText = text;
        const container = document.getElementById('chat-messages');
        if (container) container.scrollTop = container.scrollHeight;
    }
}

// --- EXISTING LOGIC ---
function renderResults() {
    const list = document.getElementById('results-list') as HTMLElement;
    list.innerHTML = '';
    const total = state.votes.reduce((a: number, b: number) => a + b, 0);
    state.candidates.forEach((c, i) => {
        const count = state.votes[i];
        const pct = Math.round((count / total) * 100);
        const div = document.createElement('div');
        div.className = 'space-y-2';
        div.innerHTML = `
            <div class="flex justify-between font-bold text-sm">
                <span>${c.name}</span>
                <span>${count} Votes (${pct}%)</span>
            </div>
            <div class="chart-bar"><div class="chart-fill" style="width: ${pct}%; background: ${c.color}"></div></div>
        `;
        list.appendChild(div);
    });
}

function initEVM() {
    const list = document.getElementById('evm-list');
    if (!list) return;
    list.innerHTML = '';
    state.candidates.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = 'candidate-row';
        div.id = `cand-${i}`;
        div.innerHTML = `
            <div class="row-idx">${(i+1).toString().padStart(2, '0')}</div>
            <div class="cand-symbol" style="background: ${c.color}"></div>
            <div class="row-info">
                <span class="cand-name">${c.name}</span>
                <span class="cand-party">${c.party}</span>
            </div>
            <div class="vote-btn-shell"><button class="vote-btn" data-idx="${i}">VOTE</button></div>
        `;
        list.appendChild(div);
    });
    
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt((e.target as HTMLElement).getAttribute('data-idx') || '0');
            triggerVote(idx);
        });
    });
}

function triggerVote(idx: number) {
    const cand = state.candidates[idx];
    document.querySelectorAll('.vote-btn').forEach(b => (b as HTMLButtonElement).disabled = true);
    document.getElementById(`cand-${idx}`)?.classList.add('active');
    
    const ledReady = document.getElementById('led-ready');
    const ledBusy = document.getElementById('led-busy');
    if (ledReady) ledReady.style.opacity = '0.2';
    if (ledBusy) ledBusy.style.opacity = '1';
    
    state.votes[idx]++;
    localStorage.setItem('vr-votes', JSON.stringify(state.votes));

    const vvpat = document.getElementById('vvpat') as HTMLElement;
    (document.getElementById('vv-name') as HTMLElement).innerText = cand.name;
    (document.getElementById('vv-party') as HTMLElement).innerText = cand.party;
    setTimeout(() => vvpat.classList.add('show'), 400);

    setTimeout(() => {
        vvpat.classList.remove('show');
        (document.getElementById('reset-btn') as HTMLElement).style.display = 'block';
    }, 3000);
}

function resetEVM() {
    (document.getElementById('reset-btn') as HTMLElement).style.display = 'none';
    (document.getElementById('led-ready') as HTMLElement).style.opacity = '1';
    (document.getElementById('led-busy') as HTMLElement).style.opacity = '0.2';
    initEVM();
}

function initBooth() {
    const list = document.getElementById('booth-checklist');
    if (!list) return;
    list.innerHTML = '';
    const labelsMap: any = {
        en: { voterId: 'Voter ID', aadhaar: 'Aadhaar', slip: 'Printed Slip', pen: 'Blue Pen', phone: 'Phone' },
        hi: { voterId: 'वोटर आईडी', aadhaar: 'आधार कार्ड', slip: 'प्रिंटेड पर्ची', pen: 'पेन', phone: 'फोन' }
    };
    const labels = labelsMap[state.lang];
    Object.keys(state.progress).forEach((key: any) => {
        const chip = document.createElement('div');
        chip.className = `chip ${state.progress[key as keyof typeof state.progress] ? 'active' : ''}`;
        chip.innerHTML = `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${state.progress[key as keyof typeof state.progress] ? 'white' : '#CBD5E1'}"></div>${labels[key]}`;
        chip.onclick = () => {
            state.progress[key as keyof typeof state.progress] = !state.progress[key as keyof typeof state.progress];
            initBooth();
            renderProgress();
        };
        list.appendChild(chip);
    });
}

function renderProgress() {
    const vals = Object.values(state.progress);
    const count = vals.filter(v => v).length;
    const percent = Math.round((count / vals.length) * 100);
    (document.getElementById('prog-text') as HTMLElement).innerText = percent + '%';
    const circle = document.getElementById('prog-circle') as unknown as SVGCircleElement;
    const circumference = 24 * 2 * Math.PI;
    if (circle) circle.style.strokeDashoffset = (circumference - (percent / 100) * circumference).toString();
    localStorage.setItem('vr-progress', JSON.stringify(state.progress));
}

function setLang(l: string) {
    state.lang = l;
    localStorage.setItem('vr-lang', l);
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`lang-${l}`)?.classList.add('active');
    updateUIStrings();
    initBooth();
}



// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    setLang(state.lang);
    
    // Countdown
    const updateCountdown = () => {
        const diff = UI_DATE.getTime() - new Date().getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const el = document.getElementById('home-countdown');
        if (el) el.innerText = days.toString();
    };
    updateCountdown(); setInterval(updateCountdown, 3600000);
    
    renderProgress();
    initEVM();
    initBooth();
    renderNews();

    // Rights
    const container = document.getElementById('rights-container');
    if (container) {
        state.rights.forEach(item => {
            const div = document.createElement('div');
            div.className = 'acc-item';
            div.innerHTML = `<div class="acc-head" onclick="this.parentElement.classList.toggle('open')">${item.q}<span>▼</span></div><div class="acc-body">${item.a}</div>`;
            container.appendChild(div);
        });
    }

    if(state.reminder) {
        (document.getElementById('reminder-form') as HTMLElement).style.display = 'none';
        (document.getElementById('reminder-success') as HTMLElement).style.display = 'block';
    }

    // Chat Enter listener
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e: any) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
});
