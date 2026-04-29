import { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function RemindersScreen() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState('');
  const [reminders, setReminders] = useState<any[]>([]);

  const loadReminders = () => {
    const saved = localStorage.getItem('voteready_reminders');
    if (saved) {
      setReminders(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const saveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !time) return;

    setStatus('saving');
    try {
      const dt = new Date(`${date}T${time}`);
      const newReminder = {
        id: Date.now().toString(),
        name,
        datetime: dt.toISOString(),
        createdAt: new Date().toISOString()
      };
      
      const newReminders = [...reminders, newReminder];
      setReminders(newReminders);
      localStorage.setItem('voteready_reminders', JSON.stringify(newReminders));
      
      setStatus('success');
      setName('');
      setDate('');
      setTime('');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const downloadICS = (reminder: any) => {
    const dt = new Date(reminder.datetime);
    const start = dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDt = new Date(dt.getTime() + 60 * 60 * 1000); // 1 hour later
    const end = endDt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:VoteReady: ${reminder.name}'s Voting Day!
DESCRIPTION:Don't forget your Voter ID and Aadhaar card.
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'voteready_reminder.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">{t('reminders.title')}</h2>
        
        <form onSubmit={saveReminder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="vname">{t('reminders.name')}</label>
            <input 
              id="vname"
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. Rahul Kumar"
              aria-label={t('reminders.name')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="vdate">{t('reminders.date')}</label>
              <input 
                id="vdate"
                type="date" 
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                aria-label={t('reminders.date')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="vtime">{t('reminders.time')}</label>
              <input 
                id="vtime"
                type="time" 
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                aria-label={t('reminders.time')}
              />
            </div>
          </div>
          
          <button type="submit" disabled={status === 'saving'} aria-label={status === 'saving' ? t('reminders.saving') : t('reminders.save')} className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
            {status === 'saving' ? t('reminders.saving') : t('reminders.save')}
          </button>
          
          {status === 'success' && <p className="text-green-600 text-sm font-semibold text-center mt-2" role="alert">Reminder saved successfully!</p>}
          {status === 'error' && <p className="text-red-600 text-sm font-semibold text-center mt-2" role="alert">Error saving reminder.</p>}
        </form>
      </div>

      {reminders.length > 0 && (
        <div className="space-y-3" aria-label="List of reminders">
          <h3 className="font-bold">{t('reminders.list')}</h3>
          {reminders.map(r => (
            <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">{r.name}</p>
                <p className="text-xs text-gray-500">{new Date(r.datetime).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => downloadICS(r)}
                aria-label={`Add reminder for ${r.name} to calendar`}
                className="text-xs bg-blue-50 text-primary px-3 py-2 rounded-lg font-bold border border-blue-100 active:bg-blue-100"
              >
                {t('reminders.addCal')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
