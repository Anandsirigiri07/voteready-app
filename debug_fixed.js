
        // --- CONSTANTS & DATA ---
        const ELECTION_DATE = new Date("2026-05-15T07:00:00").getTime();
        const GOOGLE_MAPS_KEY = "YOUR_MAPS_API_KEY";
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
                nav_home: "Home", nav_evm: "EVM", nav_booth: "Booth", nav_rights: "Rights", nav_chat: "AI Chat",
                voted_msg: "Vote Cast Successfully!",
                thinking: "सोच रहा हूँ...",
                live_trends_title: "Live Election Trends",
                trends_mock_msg: "Mock data based on exit polls."
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
                nav_home: "होम", nav_evm: "ईवीएम", nav_booth: "बूथ", nav_rights: "अधिकार", nav_chat: "AI चैट",
                voted_msg: "वोट सफलतापूर्वक डाला गया!",
                thinking: "सोच रहा हूँ...",
                live_trends_title: "लाइव चुनाव रुझान",
                trends_mock_msg: "एग्जिट पोल पर आधारित मॉक डेटा।"
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

            // Lazy Load Map
            if (sectionId === 'booth' && !map) {
                loadGoogleMaps();
            }

            // Lazy Load YouTube
            if (sectionId === 'evm') {
                const iframe = document.getElementById('evm-video');
                if (iframe.src === 'about:blank') iframe.src = iframe.getAttribute('data-src');
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
                { id: 1, name: "Candidate A", symbol: "🍎" },
                { id: 2, name: "Candidate B", symbol: "🌻" },
                { id: 3, name: "Candidate C", symbol: "🪁" },
                { id: 4, name: "NOTA", symbol: "❌" }
            ];

            container.innerHTML = candidates.map(c => `
                <div class="evm-row" id="row-${c.id}">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:1.5rem;">${c.symbol}</span>
                        <span style="font-weight:600;">${c.name}</span>
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
         * Google Maps
         */
        function loadGoogleMaps() {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=initMap`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        window.initMap = function() {
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 20.5937, lng: 78.9629 }, // Center of India
                zoom: 5,
                disableDefaultUI: true,
                zoomControl: true
            });

            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);

            initAutocomplete();
        };

        function searchBooth() {
            const input = document.getElementById('booth-search');
            const query = input.value.trim();
            
            if (!query) {
                input.setAttribute('aria-invalid', 'true');
                alert("Please enter a location.");
                return;
            }
            
            input.setAttribute('aria-invalid', 'false');
            if (typeof gtag === 'function') {
                gtag('event', 'booth_search', { search_term: query });
            }
            // Mock behavior as autocomplete handles real searching
            alert("Searching for: " + query);
        }

        function initAutocomplete() {
            const input = document.getElementById('booth-search');
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
                addMockBoothMarker(place.geometry.location);
            });
        }

        function addMockBoothMarker(location) {
            new google.maps.Marker({
                position: location,
                map: map,
                title: "Your Polling Booth",
                animation: google.maps.Animation.DROP
            });
            
            document.getElementById('booth-info').innerHTML = `
                <div class="card" style="border-left: 4px solid var(--primary);">
                    <h4>Polling Station #102</h4>
                    <p>Government High School, Block A</p>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${location.lat()},${location.lng()}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Open in Google Maps</a>
                </div>
            `;
        }

        function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(pos);
                    map.setZoom(15);
                    addMockBoothMarker(pos);
                }, () => {
                    alert("Error: Geolocation failed.");
                });
            }
        }

        /**
         * AI Chat
         */
        let isAITalking = false;
        function sendAIQuery() {
            if (isAITalking) return;
            
            const input = document.getElementById('user-input');
            const text = input.value.trim();
            if (!text) {
                input.setAttribute('aria-invalid', 'true');
                return;
            }

            input.setAttribute('aria-invalid', 'false');
            addChatMessage('user', text);
            input.value = '';
            
            isAITalking = true;
            document.getElementById('send-btn').disabled = true;

            // Mock AI response
            setTimeout(() => {
                const responses = [
                    "To vote, you need your Voter ID or any government-approved ID like Aadhaar card.",
                    "The polling starts at 7:00 AM and usually goes on until 6:00 PM.",
                    "You can find your name in the electoral roll on the official ECI website.",
                    "If you're a first-time voter, make sure to check your polling station details in the 'Booth' section."
                ];
                const reply = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('bot', reply);
                
                isAITalking = false;
                document.getElementById('send-btn').disabled = false;
                
                if (typeof gtag === 'function') gtag('event', 'ai_question_asked', { query: text });
            }, 2000);
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
         * Initialize Trends Chart
         */
        function initTrends() {
            const chart = document.getElementById('trends-chart');
            const data = [
                { party: 'Party A', votes: 45, color: '#1a56db' },
                { party: 'Party B', votes: 30, color: '#ff5a1f' },
                { party: 'Party C', votes: 15, color: '#10b981' },
                { party: 'Others', votes: 10, color: '#9ca3af' }
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
        window.addEventListener('DOMContentLoaded', () => {
            initGA();
            updateCountdown();
            setInterval(updateCountdown, 60000);
            initEVM();
            initTrends();
            
            // Render Rights
            const rightsList = document.getElementById('rights-list');
            VOTER_RIGHTS.forEach(r => {
                rightsList.innerHTML += `
                    <div class="card">
                        <h3 style="margin-top:0;">${r.title}</h3>
                        <p style="margin-bottom:0;">${r.desc}</p>
                    </div>
                `;
            });

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
        });

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
    