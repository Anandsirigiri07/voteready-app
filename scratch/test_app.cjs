const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const dom = new JSDOM(html, { 
    runScripts: 'dangerously', 
    resources: 'usable',
    url: 'http://localhost/'
});

const { window } = dom;

// Mock window.scrollTo
window.scrollTo = () => {};

// Mock Audio
window.Audio = class {
    constructor() {}
    play() { return Promise.resolve(); }
};

// Wait for scripts to load and DOMContentLoaded
window.addEventListener('load', () => {
    console.log('DOM Loaded');
    
    // Give some time for initializations
    setTimeout(() => {
        try {
            // 1. Check Countdown
            const days = window.document.getElementById('days').textContent;
            console.log('Countdown Days:', days);
            if (days === '00') {
                console.warn('Warning: Countdown still 00. This might be because the election date is too close or negative?');
            }

            // 2. Check Navigation
            window.navigateTo('evm');
            const evmActive = window.document.getElementById('evm').classList.contains('active');
            console.log('EVM Section Active:', evmActive);
            if (!evmActive) throw new Error('Navigation to EVM failed');

            // 3. Check EVM Initialization
            const evmRows = window.document.querySelectorAll('.evm-row');
            console.log('EVM Rows Found:', evmRows.length);
            if (evmRows.length === 0) throw new Error('EVM simulator rows not found');

            // 4. Check Language Switch
            window.switchLanguage('hi');
            const hiTitle = window.document.querySelector('[data-t="hero_title"]').textContent;
            console.log('Hindi Hero Title:', hiTitle);
            if (!hiTitle.includes('वोटर')) throw new Error('Hindi translation check failed');

            // 5. Check Voter Rights Rendering
            const rightsItems = window.document.querySelectorAll('#rights-list .card');
            console.log('Rights Items Found:', rightsItems.length);
            if (rightsItems.length === 0) throw new Error('Voter Rights not rendered');

            // 6. Check AI Chat
            const chatInput = window.document.getElementById('user-input');
            const sendBtn = window.document.getElementById('send-btn');
            chatInput.value = 'How to vote?';
            window.sendAIQuery();
            
            console.log('AI Query Sent. Waiting for response...');
            
            // Wait for mock AI response (2000ms in code)
            setTimeout(() => {
                const messages = window.document.querySelectorAll('#chat-messages .msg');
                console.log('Chat Messages Count:', messages.length);
                const lastMsg = messages[messages.length - 1];
                console.log('Last Message:', lastMsg.textContent);
                if (messages.length < 2) throw new Error('AI Chat response not received');
                
                // 7. Check Maps Injection
                window.navigateTo('booth');
                const mapsScript = window.document.querySelector('script[src*="maps.googleapis.com"]');
                console.log('Maps Script Injected:', !!mapsScript);
                if (!mapsScript) throw new Error('Google Maps script not injected on navigation');

                // 8. Run Inline Test Suite
                console.log('Running Inline Test Suite...');
                window.runTests();
                const testOutput = window.document.getElementById('test-output').textContent;
                console.log('Test Output:', testOutput);
                
                if (testOutput.includes('FAIL')) {
                    throw new Error('Inline test suite failed: ' + testOutput);
                }

                console.log('✅ ALL TESTS (INCLUDING INLINE SUITE) PASSED');
                process.exit(0);
            }, 2500);
        } catch (err) {
            console.error('❌ TEST FAILED:', err.message);
            process.exit(1);
        }
    }, 1000);
});
