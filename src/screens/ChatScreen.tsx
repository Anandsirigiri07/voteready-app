import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

type Message = { role: 'user' | 'model'; text: string };

export default function ChatScreen() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! I am VoteReady AI. How can I help you with your first voting experience?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-10) }) // Limit to last 10
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "How do I vote?",
    "What ID do I need?",
    "Know my rights",
    "Find my booth"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-y-auto mb-4 flex flex-col gap-3" aria-live="polite" role="log" aria-label="Chat history">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`} aria-hidden="true">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 self-start max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0" aria-hidden="true"><Bot size={16} /></div>
            <div className="p-3 rounded-2xl text-sm bg-gray-100 text-gray-800 rounded-tl-sm flex gap-1 items-center h-[44px]" aria-label="AI is typing...">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 justify-center" aria-label="Quick prompts">
        {quickPrompts.map(p => (
          <button key={p} onClick={() => sendMessage(p)} className="bg-white border border-gray-200 text-primary text-xs px-3 py-1.5 rounded-full hover:bg-gray-50 active:scale-95 transition-transform shadow-sm font-medium">
            {p}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('chat.placeholder')} 
          aria-label={t('chat.placeholder')}
          className="flex-1 border border-gray-300 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-primary shadow-sm"
        />
        <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message" className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50 shrink-0 shadow-md transition-colors hover:bg-primary-dark">
          <Send size={18} className="ml-1" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
