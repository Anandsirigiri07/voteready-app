# 🗳️ VoteReady India

**VoteReady** is India's #1 First-Time Voter Guide, designed as a beautiful, high-performance Progressive Web App (PWA). It empowers new voters with an interactive EVM simulator, an intelligent booth locator, bilingual support (English & Hindi), readiness checklists, and an AI-powered voting assistant.

> **Built with:** Google Antigravity (AI Studio Build Mode) + Gemini 2.0 Flash + React + Firebase + Tailwind CSS + Leaflet (OpenStreetMap)

## ✨ Features
- **🌍 Bilingual Interface**: Instantly switch between English and Hindi across the entire app.
- **🤖 VoteGuide AI**: Powered by Gemini 2.0 Flash, a smart chat assistant ready to answer any questions about the voting process, required documents, or voter rights.
- **📰 Live Election News**: Current, dynamically generated headlines and updates regarding Indian elections, cached for ultra-fast performance.
- **📱 PWA Ready**: Fully installable on iOS and Android devices with a custom "Add to Home Screen" prompt, offline caching, and native app feel.
- **🗺️ GPS Booth Locator**: Automatically detects your location to find nearby polling stations, with intelligent fallback search for nearby schools or community centers.
- **✅ Readiness Checklist**: A gamified, persistent checklist ensuring you have your Voter ID, slip, and correct pen before heading out.
- **🪷 EVM Simulator**: An interactive practice machine that perfectly mimics the real Electronic Voting Machine (EVM) and VVPAT printer delays.
- **⏰ Smart Reminders**: Set a custom voting day reminder and instantly generate an `.ics` file to add to your calendar.

## 🚀 Live Demo
*(Insert your Vercel or Netlify deployment URL here once deployed!)*

---

## 🛠️ Setup & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/voteready-app.git
cd voteready-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your API keys. **Note:** All API keys are kept securely on the Express backend—none are bundled into the client-side code!

```env
# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Application
Start the Vite frontend and Express backend concurrently:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚢 Deployment Instructions

Because VoteReady consists of a **Vite Frontend** and an **Express Backend**, you need a service that can host both, or deploy them separately.

### Option A: Vercel (Recommended)
1. Ensure your codebase is pushed to GitHub.
2. Go to [Vercel](https://vercel.com/) and import the repository.
3. **Environment Variables**: Add all the `VITE_` variables from your `.env` file into the Vercel dashboard.
4. Set the Build Command to `npm run build` and Output Directory to `dist`.
5. *(Important)*: To ensure the backend Express routes (`/api/*`) work on Vercel, you will need to add a `vercel.json` file configuring the serverless functions, or deploy the frontend to Vercel and the backend to Render/Railway.

### Option B: Render / Railway (Full Stack)
Since you have a custom Node.js server (`server/index.js`), you can deploy the entire app to a Node hosting provider like Render.
1. Change the start script in `package.json` to: `"start": "node server/index.js"` (ensure your server also serves the static `dist` folder in production).
2. Connect your GitHub repository to Render/Railway.
3. Add your Environment Variables.
4. Deploy!
