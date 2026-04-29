import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.home": { en: "Home", hi: "होम" },
  "nav.evm": { en: "EVM", hi: "ईवीएम" },
  "nav.booth": { en: "Booth", hi: "बूथ" },
  "nav.rights": { en: "Rights", hi: "अधिकार" },
  "nav.chat": { en: "AI Chat", hi: "एआई चैट" },
  "nav.reminders": { en: "Reminders", hi: "रिमाइंडर" },
  
  // App
  "app.title": { en: "VoteReady India", hi: "वोटरेडी इंडिया" },
  "app.install": { en: "Add to Home Screen for the best experience!", hi: "बेहतर अनुभव के लिए होम स्क्रीन में जोड़ें!" },
  "app.installBtn": { en: "Install", hi: "इंस्टॉल करें" },

  // Home
  "home.electionDay": { en: "Election Day: Nov 3, 2026", hi: "चुनाव का दिन: 3 नवंबर 2026" },
  "home.days": { en: "Days", hi: "दिन" },
  "home.hours": { en: "Hours", hi: "घंटे" },
  "home.mins": { en: "Mins", hi: "मिनट" },
  "home.quickActions": { en: "Quick Actions", hi: "त्वरित कार्रवाई" },
  "home.checklist": { en: "Readiness Checklist", hi: "तैयारी चेकलिस्ट" },
  "home.ready": { en: "items ready", hi: "आइटम तैयार" },
  "home.voterId": { en: "Voter ID (EPIC)", hi: "वोटर आईडी (EPIC)" },
  "home.aadhaar": { en: "Aadhaar Card", hi: "आधार कार्ड" },
  "home.slip": { en: "Voter Information Slip", hi: "मतदाता सूचना पर्ची" },
  "home.pen": { en: "Blue/Black Pen", hi: "नीला/काला पेन" },
  "home.phone": { en: "Phone (Not allowed inside booth)", hi: "फोन (बूथ के अंदर वर्जित)" },
  "home.news": { en: "Live Updates", hi: "लाइव अपडेट" },
  "home.loadingNews": { en: "Fetching real-time news...", hi: "रीयल-टाइम समाचार प्राप्त कर रहा है..." },

  // EVM
  "evm.title": { en: "EVM Simulator", hi: "ईवीएम सिम्युलेटर" },
  "evm.desc": { en: "Practice voting. The red light stays on for 3 seconds while the VVPAT prints your receipt.", hi: "वोट देने का अभ्यास करें। VVPAT रसीद प्रिंट होने तक 3 सेकंड के लिए लाल बत्ती जलती रहती है।" },
  "evm.ballot": { en: "BALLOT UNIT", hi: "बैलट यूनिट" },
  "evm.vvpat": { en: "VVPAT Screen", hi: "वीवीपैट स्क्रीन" },
  "evm.trends": { en: "Live Polling Trends", hi: "लाइव पोलिंग ट्रेंड" },

  // Booth
  "booth.title": { en: "Find Your Booth", hi: "अपना बूथ खोजें" },
  "booth.placeholder": { en: "Enter Pincode or Area Name", hi: "पिनकोड या क्षेत्र का नाम दर्ज करें" },
  "booth.search": { en: "Search", hi: "खोजें" },
  "booth.searching": { en: "Searching...", hi: "खोज रहा है..." },
  "booth.gps": { en: "Use my GPS location", hi: "मेरे जीपीएस का उपयोग करें" },
  "booth.navigate": { en: "Navigate", hi: "रास्ता देखें" },

  // Chat
  "chat.placeholder": { en: "Ask anything about voting...", hi: "वोटिंग के बारे में कुछ भी पूछें..." },

  // Reminders
  "reminders.title": { en: "Set Voting Reminder", hi: "वोटिंग रिमाइंडर सेट करें" },
  "reminders.name": { en: "Voter Name", hi: "मतदाता का नाम" },
  "reminders.date": { en: "Date", hi: "तारीख" },
  "reminders.time": { en: "Time", hi: "समय" },
  "reminders.save": { en: "Set Reminder", hi: "रिमाइंडर सेट करें" },
  "reminders.saving": { en: "Saving...", hi: "सहेजा जा रहा है..." },
  "reminders.list": { en: "Your Reminders", hi: "आपके रिमाइंडर" },
  "reminders.addCal": { en: "+ Add to Calendar", hi: "+ कैलेंडर में जोड़ें" }
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('voteready_lang');
    if (saved === 'en' || saved === 'hi') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('voteready_lang', newLang);
  };

  const t = (key: string) => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
