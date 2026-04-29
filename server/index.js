import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("WARNING: VITE_GEMINI_API_KEY is not set in the environment.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "invalid" });
const CHAT_MODEL = "gemini-2.0-flash";

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    // Prepare history for Gemini
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    // Add current message
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: contents,
      config: {
        systemInstruction: "You are VoteReady AI, an assistant for first-time Indian voters. Answer questions about voting process, booth location, documents needed, EVM operation, and voter rights. Be concise and use Indian English."
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    
    // Fallback if API key fails (e.g. quota limit)
    let reply = "⚠️ [Offline Mode: Your Gemini API Key has exhausted its quota or is invalid. Showing automated response] \n\nThat's a great question! For specific legal details, please check the official ECI portal at voters.eci.gov.in.";
    const lowerText = req.body.message.toLowerCase();
    if (lowerText.includes("form 6")) reply = "⚠️ [Offline Mode] Form 6 is for new voter registration. You'll need age proof and address proof.";
    if (lowerText.includes("id") || lowerText.includes("epic")) reply = "⚠️ [Offline Mode] You can download a digital Voter ID (e-EPIC) from the NVSP portal if your mobile is linked.";
    if (lowerText.includes("booth") || lowerText.includes("where")) reply = "⚠️ [Offline Mode] You can find your booth using the 'Booth' tab in this app or by searching on the ECI website.";
    if (lowerText.includes("age")) reply = "⚠️ [Offline Mode] You must be 18 years old on or before the qualifying date to register.";
    if (lowerText.includes("right") || lowerText.includes("intimidation")) reply = "⚠️ [Offline Mode] You have the right to a secret ballot and to vote free from intimidation. If you face issues, you can file a challenged vote or complain to the presiding officer.";

    res.status(200).json({ reply, fallback: true });
  }
});

app.get('/api/config/firebase', (req, res) => {
  res.json({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  });
});

app.get('/api/news', async (req, res) => {
  try {
    const prompt = `Generate 3 current-style news headlines about Indian elections or civic topics. Return ONLY a raw JSON array of objects. Do not wrap in markdown blocks like \`\`\`json. Each object must have:
- title: Short headline
- description: One-line description
- icon: A single relevant emoji
Example: [{"title": "Election Dates Announced", "description": "ECI declares dates for 5 states.", "icon": "📅"}]`;

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text);
    res.json({ items: data });
  } catch (error) {
    console.error("News Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
