const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

const scriptStart = indexHtml.indexOf('<script>');
const scriptEnd = indexHtml.indexOf('</script>', scriptStart);

if (scriptStart !== -1 && scriptEnd !== -1) {
    const scriptContent = indexHtml.substring(scriptStart + 8, scriptEnd);
    
    let newScriptContent = scriptContent;

    // 1. Fix map rendering
    newScriptContent = newScriptContent.replace(
        "if (sectionId === 'booth' && map) {\n                setTimeout(() => {\n                    google.maps.event.trigger(map, 'resize');\n                }, 100);\n            }",
        "if (sectionId === 'booth' && map) {\n                setTimeout(() => {\n                    map.invalidateSize();\n                }, 100);\n            }"
    );
    newScriptContent = newScriptContent.replace(
        "if (sectionId === 'booth' && map) {\n                setTimeout(() => google.maps.event.trigger(map, 'resize'), 200);\n            }",
        ""
    );

    // 2. Fix guide wizard
    newScriptContent = newScriptContent.replace(
        "function setGuideStep(next) {\n            guideStep = next;",
        "function setGuideStep(next) {\n            if (!isNaN(next) && next !== '') {\n                guideStep = Number(next);\n            } else {\n                guideStep = next;\n            }"
    );

    // 3. Import and use Gemini AI
    // We add the import at the top of the script
    const importGenAI = "import { GoogleGenAI } from '@google/genai';\n\n";
    const initGenAI = `const VITE_KEY = import.meta.env.VITE_GEMINI_API_KEY || "DUMMY_KEY";
const ai = new GoogleGenAI({ apiKey: VITE_KEY });
const CHAT_MODEL = "gemini-2.0-flash";
let chatHistory = [];
`;

    newScriptContent = importGenAI + initGenAI + newScriptContent;

    // Replace sendAIQuery
    const oldSendAIQuery = `function sendAIQuery() {
            if (isAITalking) return;
            
            const input = document.getElementById('user-input');
            const text = input.value.trim().toLowerCase();
            if (!text) return;

            addChatMessage('user', text);
            input.value = '';
            isAITalking = true;

            setTimeout(() => {
                let reply = "That's a great question! For specific legal details, please check the official ECI portal at voters.eci.gov.in.";
                
                if (text.includes("form 6")) reply = "Form 6 is for new voter registration. You'll need age proof and address proof.";
                if (text.includes("id") || text.includes("epic")) reply = "You can download a digital Voter ID (e-EPIC) from the NVSP portal if your mobile is linked.";
                if (text.includes("booth") || text.includes("where")) reply = "You can find your booth using the 'Booth' tab in this app or by searching on the ECI website.";
                if (text.includes("age")) reply = "You must be 18 years old on or before the qualifying date to register.";
                
                addChatMessage('bot', reply);
                isAITalking = false;
            }, 1000);
        }`;

    const newSendAIQuery = `async function sendAIQuery() {
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
                botMsgDiv.textContent = "Connection error. Please try again later.";
                chatHistory.pop();
            } finally {
                isAITalking = false;
            }
        }`;

    newScriptContent = newScriptContent.replace(oldSendAIQuery, newSendAIQuery);

    // Make functions global for inline event handlers
    const exportsToWindow = `
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
`;
    newScriptContent += exportsToWindow;

    fs.writeFileSync('src/app.js', newScriptContent);

    // Replace the script block in index.html with the module script tag
    const newHtml = indexHtml.substring(0, scriptStart) + '<script type="module" src="/src/app.js"></script>' + indexHtml.substring(scriptEnd + 9);
    fs.writeFileSync('index.html', newHtml);

    console.log("Refactoring complete.");
} else {
    console.log("Could not find script block.");
}
