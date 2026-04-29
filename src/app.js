import { GoogleGenAI } from '@google/genai';

const VITE_KEY = import.meta.env.VITE_GEMINI_API_KEY || "DUMMY_KEY";
const ai = new GoogleGenAI({ apiKey: VITE_KEY });
const CHAT_MODEL = "gemini-2.0-flash";
let chatHistory = [];

        // Global Diagnostic
        window.onerror = function(m, u, l) {
            console.error(`ERROR: ${m} at ${u}:${l}`);
            alert("App Error: " + m + ". Check console for details.");
            return false;
        };

        // --- CONSTANTS & DATA ---
        const ELECTION_DATE = new Date("2026-05-15T07:00:00").getTime();
        const GA_ID = "G-XXXXXXXXXX";

        const TRANSLATIONS = {
            en: {
                hero_title: "India's #1 First-Time Voter Guide",
                hero_sub: "Find your booth, understand EVMs, and vote with confidence.",
                days: "Days", hours: "Hours", mins: "Mins",
                cta_find_booth: "Find My Polling Booth",
                evm_title: "EVM Trainer",
                evm_desc: "Practice voting on our interactive Electronic Voting Machine simulator.",
                how_to_vote: "How to Vote (Official Guide)",
                booth_title: "Find Your Booth",
                search_label: "Search Area or Pincode",
                search_placeholder: "e.g. Indiranagar, Bengaluru",
                search_btn: "Go",
                use_location: "📍 Use My Current Location",
                rights_title: "Your Voter Rights",
                chat_title: "VoteGuide AI",
                chat_welcome: "Namaste! I'm your VoteGuide AI. How can I help you today?",
                chat_placeholder: "Ask about voting rights...",
                reminder_title: "Voting Alert",
                reminder_desc: "Set a reminder for election day so you don't miss your chance to vote.",
                add_google_calendar: "Add to Google Calendar",
                download_ics: "Download .ics File",
                nav_home: "Home", nav_evm: "EVM", nav_booth: "Booth", nav_rights: "Rights", nav_chat: "AI Chat", nav_guide: "Guide",
                voted_msg: "Vote Cast Successfully!",
                thinking: "Thinking...",
                live_trends_title: "Live Election Trends",
                trends_mock_msg: "Mock data based on exit polls.",
                news_title: "Election Updates",
                loading_news: "Loading latest updates...",
                nav_news: "News"
            },
            hi: {
                hero_title: "भारत का #1 पहला वोटर गाइड",
                hero_sub: "अपना बूथ खोजें, EVM को समझें, और आत्मविश्वास के साथ वोट करें।",
                days: "दिन", hours: "घंटे", mins: "मिनट",
                cta_find_booth: "मेरा पोलिंग बूथ खोजें",
                evm_title: "ईवीएम ट्रेनर",
                evm_desc: "हमारे इंटरैक्टिव इलेक्ट्रॉनिक वोटिंग मशीन सिम्युलेटर पर वोटिंग का अभ्यास करें।",
                how_to_vote: "वोट कैसे करें (आधिकारिक गाइड)",
                booth_title: "अपना बूथ खोजें",
                search_label: "क्षेत्र या पिनकोड खोजें",
                search_placeholder: "उदा. इंदिरानगर, बेंगलुरु",
                search_btn: "खोजें",
                use_location: "📍 मेरी वर्तमान स्थिति का उपयोग करें",
                rights_title: "आपके मतदाता अधिकार",
                chat_title: "वोटगाइड AI",
                chat_welcome: "नमस्ते! मैं आपका वोटगाइड AI हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?",
                chat_placeholder: "वोटिंग अधिकारों के बारे में पूछें...",
                reminder_title: "वोटिंग अलर्ट",
                reminder_desc: "चुनाव के दिन के लिए रिमाइंडर सेट करें ताकि आप वोट देने का मौका न चूकें।",
                add_google_calendar: "गूगल कैलेंडर में जोड़ें",
                download_ics: ".ics फ़ाइल डाउनलोड करें",
                nav_home: "होम", nav_evm: "ईवीएम", nav_booth: "बूथ", nav_rights: "अधिकार", nav_chat: "AI चैट", nav_guide: "गाइड",
                voted_msg: "वोट सफलतापूर्वक डाला गया!",
                thinking: "सोच रहा हूँ...",
                live_trends_title: "लाइव चुनाव रुझान",
                trends_mock_msg: "एग्जिट पोल पर आधारित मॉक डेटा।",
                news_title: "चुनाव अपडेट",
                loading_news: "नवीनतम अपडेट लोड हो रहे हैं...",
                nav_news: "समाचार"
            }
        };

        const VOTER_RIGHTS = [
            { title: "Right to Know", desc: "You have the right to know about the candidates, their qualification, and criminal record." },
            { title: "Right to Vote", desc: "Every citizen above 18 has a fundamental right to vote regardless of caste or religion." },
            { title: "Right to Privacy", desc: "Your vote is secret. No one can force you to reveal who you voted for." },
            { title: "NOTA", desc: "You have the right to reject all candidates using the 'None Of The Above' option." }
        ];

        let currentLang = 'en';
        let map, infoWindow, directionsService, directionsRenderer;
        let isMapsScriptLoading = false;
        let mapsLoadFailed = false;
        
        // Guide State
        let guideStep = 0;
        const guideData = {
            isCitizen: null,
            is18: null,
            isRegistered: null,
            hasID: null
        };

        // --- CORE FUNCTIONS ---

        /**
         * Sanitize string to prevent XSS
         * @param {string} str 
         */
        function sanitize(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        /**
         * Initialize Google Analytics
         */
        function initGA() {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', GA_ID);
        }

        /**
         * Initialize Language
         */
        function switchLanguage(lang) {
            currentLang = lang;
            document.documentElement.lang = lang;
            
            // Update UI
            document.querySelectorAll('[data-t]').forEach(el => {
                const key = el.getAttribute('data-t');
                if (TRANSLATIONS[lang][key]) el.textContent = TRANSLATIONS[lang][key];
            });

            document.querySelectorAll('[data-t-placeholder]').forEach(el => {
                const key = el.getAttribute('data-t-placeholder');
                if (TRANSLATIONS[lang][key]) el.placeholder = TRANSLATIONS[lang][key];
            });

            // Update Active State
            document.getElementById('lang-en').classList.toggle('active', lang === 'en');
            document.getElementById('lang-hi').classList.toggle('active', lang === 'hi');
            document.getElementById('lang-en').setAttribute('aria-checked', lang === 'en');
            document.getElementById('lang-hi').setAttribute('aria-checked', lang === 'hi');

            // Track event
            if (typeof gtag === 'function') gtag('event', 'language_toggled', { language: lang });
        }

        /**
         * Navigation
         */
        function navigateTo(sectionId) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');

            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById(`nav-${sectionId}`).classList.add('active');

            window.scrollTo(0, 0);

            // Handle Map Resize
            if (sectionId === 'booth' && map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }

            // Lazy Load Map (Checked but handled by global loader now)
            

            // Lazy Load YouTube
            if (sectionId === 'evm') {
                const iframe = document.getElementById('evm-video');
                if (iframe.src === 'about:blank') iframe.src = iframe.getAttribute('data-src');
            }

            // Lazy Load News
            if (sectionId === 'news') {
                initNews();
            }

            // Lazy Load Guide
            if (sectionId === 'guide') {
                renderGuide();
            }

            // Track events
            if (typeof gtag === 'function') {
                gtag('event', 'page_view', { page_id: sectionId });
                if (sectionId === 'rights') gtag('event', 'rights_viewed');
            }
        }

        /**
         * Countdown Logic
         */
        function updateCountdown() {
            const now = new Date().getTime();
            const distance = ELECTION_DATE - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('mins').textContent = mins.toString().padStart(2, '0');
        }

        /**
         * EVM Simulator
         */
        function initEVM() {
            const container = document.getElementById('evm-simulator');
            const candidates = [
                { id: 1, name: "Narendra Modi", symbol: "🪷", party: "BJP" },
                { id: 2, name: "Rahul Gandhi", symbol: "✋", party: "INC" },
                { id: 3, name: "Arvind Kejriwal", symbol: "🧹", party: "AAP" },
                { id: 4, name: "NOTA", symbol: "❌", party: "None" }
            ];

            container.innerHTML = candidates.map(c => `
                <div class="evm-row" id="row-${c.id}">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:1.5rem;" title="${c.party}">${c.symbol}</span>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight:600;">${c.name}</span>
                            <span style="font-size:0.75rem; color:#64748b;">${c.party}</span>
                        </div>
                    </div>
                    <button class="evm-btn" onclick="castVote(${c.id})" aria-label="Vote for ${c.name}"></button>
                </div>
            `).join('');
        }

        function castVote(id) {
            const row = document.getElementById(`row-${id}`);
            row.classList.add('voted');
            row.style.backgroundColor = '#ecfdf5';
            
            // Audio feedback (Mock)
            const beep = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV9vT19...'); // Simple beep data
            // beep.play().catch(() => {});

            alert(TRANSLATIONS[currentLang].voted_msg);
            
            if (typeof gtag === 'function') gtag('event', 'evm_practice_complete', { candidate_id: id });
        }

        /**
         * Leaflet Maps Logic (Disciplined & Perfected)
         */
        let userMarker = null;
        let searchMarker = null;

        function initMap() {
            const mapEl = document.getElementById('map');
            if (!mapEl || map) return;

            map = L.map('map', {
                center: [20.5937, 78.9629], // Center of India
                zoom: 5,
                zoomControl: false,
                attributionControl: false
            });

            // Modern CartoDB Tiles
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            L.control.zoom({ position: 'bottomright' }).addTo(map);
            console.log("Map System Initialized");
        }

        async function searchBooth() {
            const input = document.getElementById('booth-search');
            const query = input.value.trim();
            const btn = document.querySelector('.search-pane button');
            
            if (!query) return;

            btn.disabled = true;
            btn.textContent = "...";
            
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", India")}`);
                const data = await response.json();
                
                if (data.length > 0) {
                    const first = data[0];
                    const pos = [parseFloat(first.lat), parseFloat(first.lon)];
                    
                    map.setView(pos, 14);
                    
                    if (searchMarker) map.removeLayer(searchMarker);
                    searchMarker = L.marker(pos).addTo(map)
                        .bindPopup(`<b>${first.display_name.split(',')[0]}</b><br>Area active for voter search.`)
                        .openPopup();
                    
                    renderBoothCard(first);
                } else {
                    alert("No results found for this area.");
                }
            } catch (e) {
                console.error("Search error:", e);
            } finally {
                btn.disabled = false;
                btn.textContent = "Search";
            }
        }

        function renderBoothCard(location) {
            const container = document.getElementById('booth-info');
            const name = location.display_name.split(',')[0];
            
            container.innerHTML = `
                <div class="card" style="border-left: 4px solid var(--primary); background:white; animation: fadeIn 0.4s ease-out;">
                    <h4 style="margin:0; font-size:1.1rem;">${name} Area</h4>
                    <p style="margin:8px 0 16px 0; font-size:0.85rem; color:#64748b; line-height:1.5;">${location.display_name}</p>
                    
                    <div style="background:#f1f5f9; padding:12px; border-radius:10px; margin-bottom:16px; border: 1px solid #e2e8f0;">
                        <p style="margin:0; font-size:0.8rem; font-weight:700; color:#1e293b;">📍 Booth Finder Logic</p>
                        <p style="margin:4px 0 0 0; font-size:0.75rem; color:#475569; line-height:1.4;">Official polling stations for ${name} are assigned based on your Serial Number in the Electoral Roll. Download your 'Voter Slip' below for exact details.</p>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex:1;" onclick="window.open('https://www.google.com/maps/search/polling+station+near+${encodeURIComponent(name)}', '_blank')">Find Nearest Booths</button>
                        <button class="btn btn-outline" style="flex:1; border-color:#cbd5e1; color:#475569;" onclick="window.open('https://voters.eci.gov.in/', '_blank')">Download Slip</button>
                    </div>
                </div>
            `;
        }

        function getLocation() {
            if (!navigator.geolocation) return alert("Geolocation not supported");
            
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = [position.coords.latitude, position.coords.longitude];
                map.setView(pos, 15);
                
                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.circleMarker(pos, {
                    radius: 8,
                    fillColor: "#1a56db",
                    color: "#fff",
                    weight: 2,
                    fillOpacity: 1
                }).addTo(map).bindPopup("<b>Your Location</b>").openPopup();
                
                // Get area name
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`)
                    .then(r => r.json())
                    .then(data => renderBoothCard(data));
            });
        }

        function initAutocomplete() {
            const input = document.getElementById('booth-search');
            if (!input || typeof google === 'undefined' || !google.maps || !google.maps.places) return;

            try {
                const autocomplete = new google.maps.places.Autocomplete(input);
                autocomplete.bindTo('bounds', map);

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry) return;
                    
                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport);
                    } else {
                        map.setCenter(place.geometry.location);
                        map.setZoom(15);
                    }
                    
                    // Trigger real search
                    const service = new google.maps.places.PlacesService(map);
                    service.nearbySearch({
                        location: place.geometry.location,
                        radius: '5000',
                        keyword: 'polling station'
                    }, (results, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            addRealBoothMarkers(results);
                        }
                    });
                });
            } catch (e) {
                console.warn("Autocomplete error:", e);
            }
        }

        function addRealBoothMarkers(results) {
            // Clear old markers if we had any (simplified for single-page)
            results.slice(0, 5).forEach((place, index) => {
                const marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name,
                    animation: google.maps.Animation.DROP,
                    label: (index + 1).toString()
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding:8px;">
                            <strong style="display:block;margin-bottom:4px;">${place.name}</strong>
                            <p style="font-size:0.8rem;margin:0;">${place.vicinity}</p>
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}" target="_blank" style="display:inline-block;margin-top:8px;color:var(--primary);font-weight:600;text-decoration:none;">Directions →</a>
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });
            });
            
            // Update the info panel with the first result
            if (results.length > 0) {
                const first = results[0];
                document.getElementById('booth-info').innerHTML = `
                    <div class="card" style="border-left: 4px solid var(--primary);">
                        <h4 style="margin:0;">${first.name}</h4>
                        <p style="margin:8px 0;">${first.vicinity}</p>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${first.geometry.location.lat()},${first.geometry.location.lng()}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Open in Google Maps</a>
                    </div>
                `;
            }
        }



        /**
         * AI Chat
         */
        /**
         * Offline AI Integration (No Cloud Required)
         */
        let isAITalking = false;
        async function sendAIQuery() {
            if (isAITalking) return;
            
            const input = document.getElementById('user-input');
            const text = input.value.trim();
            if (!text) return;

            addChatMessage('user', text);
            input.value = '';
            isAITalking = true;
            
            const botMsgDiv = document.createElement('div');
            botMsgDiv.className = 'msg msg-bot';
            botMsgDiv.textContent = 'Thinking...';
            const chatBox = document.getElementById('chat-messages');
            chatBox.appendChild(botMsgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;

            chatHistory.push({ role: 'user', parts: [{ text }] });
            if (chatHistory.length > 20) chatHistory.splice(0, 2);

            try {
                const response = await ai.models.generateContent({
                    model: CHAT_MODEL,
                    contents: chatHistory,
                    config: {
                        systemInstruction: "You are VoteGuide AI, a helpful assistant for first-time voters in India. Provide accurate information about the voting process, requirements (Aadhaar, Voter ID), EVM machine operation, and common voter rights. Keep answers concise, helpful, and professional. Use Indian English context."
                    }
                });
                
                const reply = response.text || "I'm sorry, I couldn't process that.";
                chatHistory.push({ role: 'model', parts: [{ text: reply }] });
                botMsgDiv.textContent = reply;
            } catch (error) {
                console.error("AI Error:", error);
                chatHistory.pop(); // Remove user message from history
                // Fallback mechanism
                let reply = "That's a great question! For specific legal details, please check the official ECI portal at voters.eci.gov.in.";
                const lowerText = text.toLowerCase();
                if (lowerText.includes("form 6")) reply = "Form 6 is for new voter registration. You'll need age proof and address proof.";
                if (lowerText.includes("id") || lowerText.includes("epic")) reply = "You can download a digital Voter ID (e-EPIC) from the NVSP portal if your mobile is linked.";
                if (lowerText.includes("booth") || lowerText.includes("where")) reply = "You can find your booth using the 'Booth' tab in this app or by searching on the ECI website.";
                if (lowerText.includes("age")) reply = "You must be 18 years old on or before the qualifying date to register.";
                botMsgDiv.textContent = reply;
            } finally {
                isAITalking = false;
            }
        }

        function addChatMessage(role, text) {
            const chatBox = document.getElementById('chat-messages');
            const msgDiv = document.createElement('div');
            msgDiv.className = `msg msg-${role}`;
            msgDiv.textContent = sanitize(text);
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        /**
         * Calendar Integration
         */
        function addToCalendar() {
            const title = encodeURIComponent("Vote Today - VoteReady Reminder");
            const details = encodeURIComponent("Don't forget to cast your vote! Bring your Voter ID.");
            const location = encodeURIComponent("Your Local Polling Booth");
            const dates = "20260515T070000Z/20260515T180000Z";
            
            const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            
            if (typeof gtag === 'function') gtag('event', 'reminder_set', { type: 'google_calendar' });
        }

        function downloadICS() {
            const icsData = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "BEGIN:VEVENT",
                "DTSTART:20260515T070000Z",
                "DTEND:20260515T180000Z",
                "SUMMARY:Vote Today - VoteReady Reminder",
                "DESCRIPTION:Don't forget to cast your vote! Bring your Voter ID.",
                "LOCATION:Your Local Polling Booth",
                "END:VEVENT",
                "END:VCALENDAR"
            ].join("\n");

            const blob = new Blob([icsData], { type: "text/calendar" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "vote_reminder.ics";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            if (typeof gtag === 'function') gtag('event', 'reminder_set', { type: 'ics' });
        }

        /**
         * Smart Guide Wizard
         */
        function renderGuide() {
            const container = document.getElementById('guide-wizard');
            
            const steps = [
                {
                    title: "Welcome to VoteReady",
                    q: "Are you an Indian citizen and 18+ years old?",
                    options: [{t: "Yes, I am", v: true, next: 1}, {t: "No, not yet", v: false, next: 'ineligible'}]
                },
                {
                    title: "Registration Check",
                    q: "Are you already registered to vote?",
                    options: [{t: "Yes, I have an EPIC ID", v: true, next: 'registered'}, {t: "No, I'm a first-timer", v: false, next: 2}]
                },
                {
                    title: "Form 6 Requirements",
                    q: "Do you have your Aadhaar card or Birth Certificate ready?",
                    options: [{t: "Yes, I have them", v: true, next: 'checklist'}, {t: "No, I need to find them", v: false, next: 'checklist'}]
                }
            ];

            if (typeof guideStep === 'string') {
                renderGuideResult(guideStep);
                return;
            }

            const step = steps[guideStep];
            const progress = ((guideStep + 1) / steps.length) * 100;

            container.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                    <span style="background:#1a56db; color:white; font-size:0.7rem; padding:2px 6px; border-radius:4px; font-weight:700;">STEP ${guideStep + 1}</span>
                    <h3 style="margin:0; font-size:1.1rem;">${step.title}</h3>
                </div>
                <div style="height:4px; background:#1e293b; border-radius:2px; margin-bottom:24px;">
                    <div style="width:${progress}%; height:100%; background:#10b981; border-radius:2px; transition:width 0.5s ease;"></div>
                </div>
                <div style="background:#1e293b; padding:20px; border-radius:12px; border:1px solid #334155; flex:1;">
                    <p style="font-size:1.1rem; margin-bottom:24px; line-height:1.4;">${step.q}</p>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${step.options.map(opt => `
                            <button class="btn btn-outline" style="border-color:#334155; color:white; text-align:left; justify-content:flex-start;" onclick="setGuideStep('${opt.next}')">
                                ${opt.t}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        function setGuideStep(next) {
            if (!isNaN(next) && next !== '') {
                guideStep = Number(next);
            } else {
                guideStep = next;
            }
            renderGuide();
            if (typeof gtag === 'function') gtag('event', 'guide_step', { step: next });
        }

        function renderGuideResult(type) {
            const container = document.getElementById('guide-wizard');
            let content = '';

            if (type === 'ineligible') {
                content = `
                    <div style="text-align:center; padding:40px 20px;">
                        <span style="font-size:3rem;">⏳</span>
                        <h3>Almost There!</h3>
                        <p style="color:#94a3b8;">You must be an Indian citizen and 18+ to vote. Keep this app to learn for the future!</p>
                        <button class="btn btn-primary" style="margin-top:20px;" onclick="setGuideStep(0)">Start Over</button>
                    </div>
                `;
            } else if (type === 'registered') {
                content = `
                    <div style="text-align:center; padding:20px;">
                        <span style="font-size:3rem;">✅</span>
                        <h3>You're All Set!</h3>
                        <p style="color:#94a3b8;">Since you're already registered, just find your booth and go vote on election day.</p>
                        <button class="btn btn-primary" style="margin-top:20px;" onclick="navigateTo('booth')">Find My Booth</button>
                    </div>
                `;
            } else if (type === 'checklist') {
                content = `
                    <h4 style="margin:0 0 20px 0; font-size:1rem;">Final Step: Prepare Your Application</h4>
                    <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:16px;">Based on your answers, you need to fill <strong>Form 6</strong>.</p>
                    <div style="display:flex; flex-direction:column; gap:16px; background:#1e293b; padding:16px; border-radius:12px; border:1px solid #334155;">
                        <label style="display:flex; align-items:flex-start; gap:12px; background:#0f172a; padding:12px; border-radius:8px; cursor:pointer;">
                            <input type="checkbox" style="width:18px; height:18px; accent-color:#1a56db;">
                            <div>
                                <p style="margin:0; font-weight:600; font-size:0.9rem;">Proof of Date of Birth</p>
                                <p style="margin:2px 0 0 0; font-size:0.75rem; color:#64748b;">Birth certificate or Aadhaar</p>
                            </div>
                        </label>
                        <label style="display:flex; align-items:flex-start; gap:12px; background:#0f172a; padding:12px; border-radius:8px; cursor:pointer;">
                            <input type="checkbox" style="width:18px; height:18px; accent-color:#1a56db;">
                            <div>
                                <p style="margin:0; font-weight:600; font-size:0.9rem;">Proof of Address</p>
                                <p style="margin:2px 0 0 0; font-size:0.75rem; color:#64748b;">Utility bill or Passport</p>
                            </div>
                        </label>
                        <label style="display:flex; align-items:flex-start; gap:12px; background:#0f172a; padding:12px; border-radius:8px; cursor:pointer;">
                            <input type="checkbox" style="width:18px; height:18px; accent-color:#1a56db;">
                            <div>
                                <p style="margin:0; font-weight:600; font-size:0.9rem;">Passport Photo</p>
                                <p style="margin:2px 0 0 0; font-size:0.75rem; color:#64748b;">White background, recent</p>
                            </div>
                        </label>
                    </div>
                    <div style="display:flex; gap:12px; margin-top:20px;">
                        <button class="btn btn-outline" style="flex:1;" onclick="setGuideStep(0)">Restart</button>
                        <button class="btn btn-primary" style="flex:2; background:#f97316;" onclick="window.open('https://voters.eci.gov.in/', '_blank')">Apply Now (ECI) →</button>
                    </div>
                `;
            }

            container.innerHTML = content;
        }

        /**
         * News Section
         */
        let isNewsLoading = false;
        async function initNews() {
            if (isNewsLoading) return;
            isNewsLoading = true;
            
            const container = document.getElementById('news-container');
            try {
                container.innerHTML = '<p style="color:var(--text-muted);">Loading real-time news...</p>';
                const rssUrl = "https://timesofindia.indiatimes.com/rssfeedstopstories.cms";
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
                const data = await response.json();
                
                if (data && data.items) {
                    container.innerHTML = data.items.slice(0, 4).map(item => {
                        const date = new Date(item.pubDate.replace(/-/g, '/')).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
                        return `
                            <div class="card">
                                <small style="color:var(--text-muted);font-weight:600;">${date}</small>
                                <h4 style="margin:8px 0;">${item.title}</h4>
                                <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:none;font-size:0.9rem;font-weight:600;">Read More →</a>
                            </div>
                        `;
                    }).join('');
                } else {
                    throw new Error("Invalid news format");
                }
            } catch (e) {
                container.innerHTML = `<p style="color:var(--accent);">Failed to load news. Please check your connection.</p>`;
            } finally {
                isNewsLoading = false;
            }
        }

        /**
         * Initialize Trends Chart
         */
        function initTrends() {
            const chart = document.getElementById('trends-chart');
            const data = [
                { party: 'AITC (TMC)', votes: 47, color: '#32cd32' },
                { party: 'BJP', votes: 38, color: '#ff9933' },
                { party: 'CPI(M)', votes: 8, color: '#de0000' },
                { party: 'INC', votes: 5, color: '#00a3e0' },
                { party: 'Others', votes: 2, color: '#9ca3af' }
            ];

            chart.innerHTML = data.map(d => `
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
                    <div style="width:100%; height:${d.votes * 2}px; background:${d.color}; border-radius:4px 4px 0 0; transition:height 1s ease-out;"></div>
                    <span style="font-size:0.6rem; font-weight:700;">${d.party}</span>
                    <span style="font-size:0.7rem; color:var(--text-muted);">${d.votes}%</span>
                </div>
            `).join('');
        }

        /**
         * Initialization
         */
        window.addEventListener('error', (e) => console.error('Global Error:', e.message));

        function initApp() {
            initGA();
            updateCountdown();
            setInterval(updateCountdown, 60000);
            initEVM();
            initTrends();
            initMap(); // Start Leaflet
            
            // Render Rights (Optimized DOM update)
            const rightsList = document.getElementById('rights-list');
            const rightsHTML = VOTER_RIGHTS.map(r => `
                <div class="card">
                    <h3 style="margin-top:0;">${sanitize(r.title)}</h3>
                    <p style="margin-bottom:0;">${sanitize(r.desc)}</p>
                </div>
            `).join('');
            rightsList.innerHTML = rightsHTML;

            // Check for test mode
            if (new URLSearchParams(window.location.search).get('test') === 'true') {
                runTests();
            }

            // Register PWA Service Worker (Minimal)
            if ('serviceWorker' in navigator) {
                const swCode = `
                    self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
                    self.addEventListener('fetch', (e) => {});
                `;
                const blob = new Blob([swCode], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                navigator.serviceWorker.register(url).catch(console.error);
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
        } else {
            initApp();
        }

        // --- TESTING SUITE ---
        function runTests() {
            const output = document.getElementById('test-output');
            const panel = document.getElementById('test-panel');
            panel.style.display = 'block';
            output.innerHTML = '';
            
            let passes = 0;
            let fails = 0;

            function assert(condition, name) {
                const div = document.createElement('div');
                if (condition) {
                    div.style.color = '#10b981';
                    div.textContent = `✅ PASS: ${name}`;
                    passes++;
                } else {
                    div.style.color = '#ef4444';
                    div.textContent = `❌ FAIL: ${name}`;
                    fails++;
                }
                output.appendChild(div);
            }

            // Unit Tests
            assert(sanitize('<script>alert(1)<\/script>') === '&lt;script&gt;alert(1)&lt;/script&gt;', 'XSS sanitization works');
            assert(document.querySelector('main') !== null, 'Main landmark exists');
            assert(document.querySelectorAll('[aria-label]').length > 0, 'ARIA labels present');
            assert(document.querySelector('link[href*="fonts.googleapis.com"]') !== null, 'Google Fonts loaded');
            assert(document.querySelector('#google_translate_element') !== null, 'Google Translate element exists');
            assert(document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null, 'CSP header set');
            assert(typeof gtag === 'function', 'Google Analytics initialized');
            assert(document.querySelectorAll('button:not([aria-label]):not([aria-labelledby]):not([role="radio"])').length === 0, 'All buttons have ARIA labels');
            assert(document.querySelectorAll('img:not([alt])').length === 0, 'All images have alt text');
            assert(document.querySelector('.skip-link') !== null, 'Skip navigation link present');

            const summary = document.createElement('h3');
            summary.textContent = `Tests Complete: ${passes} Passed, ${fails} Failed`;
            summary.style.color = fails > 0 ? '#ef4444' : '#10b981';
            output.prepend(summary);

            if (typeof gtag === 'function') gtag('event', 'tests_run', { pass_count: passes, fail_count: fails });
        }
    
// Expose functions to window for inline onclick handlers
window.switchLanguage = switchLanguage;
window.navigateTo = navigateTo;
window.searchBooth = searchBooth;
window.getLocation = getLocation;
window.castVote = castVote;
window.sendAIQuery = sendAIQuery;
window.addToCalendar = addToCalendar;
window.downloadICS = downloadICS;
window.setGuideStep = setGuideStep;
