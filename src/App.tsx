import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Pocket, MapPin, Scale, MessageSquare, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import HomeScreen from './screens/HomeScreen';
import EVMScreen from './screens/EVMScreen';
import BoothScreen from './screens/BoothScreen';
import RightsScreen from './screens/RightsScreen';
import ChatScreen from './screens/ChatScreen';
import RemindersScreen from './screens/RemindersScreen';

function MainApp() {
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/evm', label: t('nav.evm'), icon: Pocket },
    { path: '/booth', label: t('nav.booth'), icon: MapPin },
    { path: '/rights', label: t('nav.rights'), icon: Scale },
    { path: '/chat', label: t('nav.chat'), icon: MessageSquare },
    { path: '/reminders', label: t('nav.reminders'), icon: Bell },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-xl relative pb-20 overflow-x-hidden">
      <header className="bg-primary text-white p-4 sticky top-0 z-50 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2" aria-label={t('app.title')}>
          🗳️ {t('app.title')}
        </h1>
        <div className="bg-white/20 rounded-full p-1 flex gap-1">
          <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-full text-xs font-bold transition-colors ${lang === 'en' ? 'bg-white text-primary' : 'text-white/70'}`} aria-label="English">EN</button>
          <button onClick={() => setLang('hi')} className={`px-2 py-1 rounded-full text-xs font-bold transition-colors ${lang === 'hi' ? 'bg-white text-primary' : 'text-white/70'}`} aria-label="Hindi">हि</button>
        </div>
      </header>

      {deferredPrompt && (
        <div className="bg-blue-50 border-b border-blue-100 p-3 flex justify-between items-center" role="alert">
          <span className="text-xs font-semibold text-blue-800">{t('app.install')}</span>
          <button onClick={installPWA} className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm">{t('app.installBtn')}</button>
        </div>
      )}

      <main className="p-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/evm" element={<EVMScreen />} />
              <Route path="/booth" element={<BoothScreen />} />
              <Route path="/rights" element={<RightsScreen />} />
              <Route path="/chat" element={<ChatScreen />} />
              <Route path="/reminders" element={<RemindersScreen />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex justify-around p-2 z-50" aria-label="Bottom Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Icon size={20} className={isActive ? 'text-primary' : ''} aria-hidden="true" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
