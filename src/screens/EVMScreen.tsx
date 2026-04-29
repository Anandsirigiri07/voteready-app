import { useState } from 'react';
import { useLanguage } from '../LanguageContext';

export default function EVMScreen() {
  const { t } = useLanguage();
  const [isBusy, setIsBusy] = useState(false);
  const [vvpat, setVvpat] = useState<{ name: string; party: string; symbol: string } | null>(null);
  const [votes, setVotes] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });

  const candidates = [
    { id: 1, name: "Narendra Modi", symbol: "🪷", party: "BJP", color: '#ff9933' },
    { id: 2, name: "Rahul Gandhi", symbol: "✋", party: "INC", color: '#00a3e0' },
    { id: 3, name: "Arvind Kejriwal", symbol: "🧹", party: "AAP", color: '#0066a4' },
    { id: 4, name: "NOTA", symbol: "❌", party: "None", color: '#9ca3af' }
  ];

  const handleVote = (id: number) => {
    if (isBusy) return;
    setIsBusy(true);
    
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
      setVvpat(candidate);
      setVotes(prev => ({ ...prev, [id]: prev[id] + 1 }));
      
      setTimeout(() => {
        setVvpat(null);
        setIsBusy(false);
      }, 3000);
    }
  };

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="font-bold text-lg mb-2">{t('evm.title')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('evm.desc')}</p>
        
        <div className="bg-gray-800 p-4 rounded-xl border-4 border-gray-900 shadow-inner" aria-label="Electronic Voting Machine Simulator">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
            <span className="text-gray-400 text-xs font-mono tracking-widest">{t('evm.ballot')}</span>
            <div className={`w-3 h-3 rounded-full ${isBusy ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-gray-600'}`} aria-label={isBusy ? 'Busy light on' : 'Busy light off'}></div>
          </div>
          
          <div className="space-y-2">
            {candidates.map((c) => (
              <div key={c.id} className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-6 text-center" aria-hidden="true">{c.symbol}</span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-gray-900 leading-tight">{c.name}</span>
                    <span className="text-xs text-gray-600 font-medium">{c.party}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleVote(c.id)}
                  disabled={isBusy}
                  className="w-10 h-10 rounded-full bg-blue-600 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:active:border-b-4 disabled:active:translate-y-0"
                  aria-label={`Vote for ${c.name}`}
                ></button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center" aria-label="VVPAT Printer">
          <div className="w-32 h-8 bg-gray-900 rounded-t-lg relative overflow-hidden flex justify-center">
            <div className="w-24 h-1 bg-gray-700 mt-2 rounded"></div>
          </div>
          <div className="w-32 h-32 bg-gray-100 border-x-4 border-b-4 border-gray-900 rounded-b-lg flex items-start justify-center overflow-hidden p-2 relative">
            {vvpat ? (
              <div className="bg-white border border-gray-300 w-full p-2 text-center shadow-sm animate-slide-down" aria-live="polite">
                <span className="text-2xl block mb-1">{vvpat.symbol}</span>
                <span className="font-bold text-xs block truncate">{vvpat.name}</span>
                <span className="text-[10px] text-gray-500">{vvpat.party}</span>
              </div>
            ) : (
              <span className="text-gray-400 text-xs mt-8">{t('evm.vvpat')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100" aria-label="Voting Results Bar Chart">
        <h3 className="font-bold mb-4">{t('evm.trends')}</h3>
        <div className="flex items-end justify-around h-32 gap-2">
          {candidates.map(c => {
            const heightPct = Math.max((votes[c.id] / totalVotes) * 100, 5);
            return (
              <div key={c.id} className="flex flex-col items-center flex-1 gap-2">
                <div 
                  className="w-full rounded-t-md transition-all duration-500 ease-out flex items-start justify-center pt-1"
                  style={{ height: `${heightPct}%`, backgroundColor: c.color }}
                  aria-label={`${c.name} has ${votes[c.id]} votes`}
                >
                  <span className="text-white text-[10px] font-bold">{votes[c.id]}</span>
                </div>
                <span className="text-[10px] font-bold truncate w-full text-center">{c.party}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
