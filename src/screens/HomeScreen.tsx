import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pocket, MapPin, Scale, MessageSquare, Loader2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function HomeScreen() {
  const { t } = useLanguage();
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(0);
  const [news, setNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  
  const [checklist, setChecklist] = useState({
    voterId: false,
    aadhaar: false,
    slip: false,
    pen: false,
    phone: false
  });

  useEffect(() => {
    const electionDate = new Date("2026-11-03T07:00:00").getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = electionDate - now;
      if (distance < 0) return;
      setDays(Math.floor(distance / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setMins(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchNews() {
      try {
        const cacheRaw = localStorage.getItem('voteready_news_cache');
        if (cacheRaw) {
          const cacheData = JSON.parse(cacheRaw);
          if (cacheData.timestamp > Date.now() - 3600000) {
            setNews(cacheData.items);
            setIsLoadingNews(false);
            return;
          }
        }

        const res = await fetch('/api/news');
        const data = await res.json();
        
        if (data.items) {
          setNews(data.items);
          localStorage.setItem('voteready_news_cache', JSON.stringify({ items: data.items, timestamp: Date.now() }));
        }
      } catch (e) {
        console.error("Failed to fetch news", e);
      } finally {
        setIsLoadingNews(false);
      }
    }
    fetchNews();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('voteready_checklist');
    if (saved) {
      setChecklist(JSON.parse(saved));
    }
  }, []);

  const toggleChecklist = (key: keyof typeof checklist) => {
    const newChecklist = { ...checklist, [key]: !checklist[key] };
    setChecklist(newChecklist);
    localStorage.setItem('voteready_checklist', JSON.stringify(newChecklist));
  };

  const completedItems = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(checklist).length;
  const progressPct = (completedItems / totalItems) * 100;
  const isAllReady = completedItems === totalItems;

  const quickActions = [
    { path: '/evm', label: t('home.quickActions') + ': ' + t('nav.evm'), shortLabel: t('nav.evm'), icon: Pocket, color: 'bg-orange-100 text-orange-600' },
    { path: '/booth', label: t('home.quickActions') + ': ' + t('nav.booth'), shortLabel: t('nav.booth'), icon: MapPin, color: 'bg-blue-100 text-blue-600' },
    { path: '/rights', label: t('home.quickActions') + ': ' + t('nav.rights'), shortLabel: t('nav.rights'), icon: Scale, color: 'bg-green-100 text-green-600' },
    { path: '/chat', label: t('home.quickActions') + ': ' + t('nav.chat'), shortLabel: t('nav.chat'), icon: MessageSquare, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-primary text-white p-6 rounded-2xl shadow-lg text-center relative overflow-hidden" aria-label={t('home.electionDay')}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <h2 className="text-xl font-bold mb-4" aria-hidden="true">{t('home.electionDay')}</h2>
        <div className="flex justify-center gap-4" aria-hidden="true">
          <div className="flex flex-col"><span className="text-3xl font-bold">{days}</span><span className="text-xs uppercase tracking-wider opacity-80">{t('home.days')}</span></div>
          <div className="text-3xl font-bold opacity-50">:</div>
          <div className="flex flex-col"><span className="text-3xl font-bold">{hours}</span><span className="text-xs uppercase tracking-wider opacity-80">{t('home.hours')}</span></div>
          <div className="text-3xl font-bold opacity-50">:</div>
          <div className="flex flex-col"><span className="text-3xl font-bold">{mins}</span><span className="text-xs uppercase tracking-wider opacity-80">{t('home.mins')}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4" aria-label={t('home.quickActions')}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.path} to={action.path} aria-label={action.label} className={`p-4 rounded-xl flex flex-col items-center gap-2 ${action.color} transition-transform active:scale-95 shadow-sm`}>
              <Icon size={28} aria-hidden="true" />
              <span className="font-semibold text-sm">{action.shortLabel}</span>
            </Link>
          )
        })}
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2" aria-label={t('home.checklist')}>📝 {t('home.checklist')}</h3>
          
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0" aria-label={`${completedItems} out of ${totalItems} ${t('home.ready')}`}>
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * progressPct) / 100}
                className={`transition-all duration-500 ease-out ${isAllReady ? 'text-green-500' : 'text-primary'}`}
              />
            </svg>
            <span className={`absolute text-xs font-bold ${isAllReady ? 'text-green-600' : 'text-gray-700'}`}>{completedItems}/{totalItems}</span>
          </div>
        </div>

        <div className="space-y-3" role="group" aria-label="Checklist items">
          {[
            { id: 'voterId', label: t('home.voterId') },
            { id: 'aadhaar', label: t('home.aadhaar') },
            { id: 'slip', label: t('home.slip') },
            { id: 'pen', label: t('home.pen') },
            { id: 'phone', label: t('home.phone') }
          ].map((item) => (
            <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input 
                type="checkbox" 
                checked={checklist[item.id as keyof typeof checklist]}
                onChange={() => toggleChecklist(item.id as keyof typeof checklist)}
                aria-label={item.label}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
              />
              <span className={`text-sm ${checklist[item.id as keyof typeof checklist] ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2" aria-label={t('home.news')}>📰 {t('home.news')}</h3>
        <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar" aria-live="polite">
          {isLoadingNews ? (
            <>
              <div className="min-w-[250px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse flex flex-col gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
              </div>
              <div className="min-w-[250px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse flex flex-col gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
              </div>
            </>
          ) : (
            news.map((n, i) => (
              <div key={i} className="min-w-[250px] max-w-[250px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 snap-center shrink-0 flex flex-col">
                <span className="text-2xl mb-1" aria-hidden="true">{n.icon}</span>
                <p className="text-sm font-bold mt-1 line-clamp-2">{n.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
