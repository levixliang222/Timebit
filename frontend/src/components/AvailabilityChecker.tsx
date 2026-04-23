import { useState } from 'react';
import type { CalendarEvent } from '../types';
import { format, parseISO } from 'date-fns';

interface AvailabilityCheckerProps {
  events: CalendarEvent[];
}

const suggestions = [
  'Do I have time to go to the gym today?',
  'Am I free tomorrow afternoon?',
  'Can I schedule a 2-hour meeting on Thursday?',
  'Do I have any conflicts this Friday?',
];

function checkAvailability(query: string, events: CalendarEvent[]): string {
  const q = query.toLowerCase();
  const today = new Date();

  let targetDate = new Date(today);
  if (q.includes('tomorrow')) targetDate.setDate(today.getDate() + 1);
  else if (q.includes('thursday')) { while (targetDate.getDay() !== 4) targetDate.setDate(targetDate.getDate() + 1); }
  else if (q.includes('friday')) { while (targetDate.getDay() !== 5) targetDate.setDate(targetDate.getDate() + 1); }

  const dayStr = format(targetDate, 'EEEE, MMM d');
  const dayEvents = events.filter(e => {
    const start = parseISO(e.start);
    return start.toDateString() === targetDate.toDateString();
  });

  if (dayEvents.length === 0) {
    return `✅ **${dayStr}** looks completely clear — no events scheduled. You're free to plan anything!`;
  }

  const eventList = dayEvents.map(e => {
    const start = format(parseISO(e.start), 'h:mm a');
    const end = format(parseISO(e.end), 'h:mm a');
    return `• ${e.title} (${start}–${end})`;
  }).join('\n');

  if (q.includes('gym') || q.includes('1 hour') || q.includes('one hour')) {
    const conflict = dayEvents.find(e => {
      const s = parseISO(e.start).getHours();
      return s >= 6 && s <= 9;
    });
    if (conflict) {
      return `⚠️ **${dayStr}**: You have ${dayEvents.length} event(s) but your morning is busy.\n\n${eventList}\n\nTry scheduling the gym for **after 6 PM** — that slot looks open!`;
    }
    return `✅ **${dayStr}**: Your morning is free! Great time for the gym (7–8 AM looks good).\n\n**Other events today:**\n${eventList}`;
  }

  if (q.includes('afternoon')) {
    const afternoonEvents = dayEvents.filter(e => parseISO(e.start).getHours() >= 12 && parseISO(e.start).getHours() < 18);
    if (afternoonEvents.length === 0) {
      return `✅ **${dayStr} afternoon** is free! You have other events, but afternoon is clear.\n\n**Full schedule:**\n${eventList}`;
    }
    const aeList = afternoonEvents.map(e => `• ${e.title} (${format(parseISO(e.start), 'h:mm a')})`).join('\n');
    return `❌ **${dayStr} afternoon** has ${afternoonEvents.length} commitment(s):\n\n${aeList}\n\nMorning or evening might work better.`;
  }

  return `📅 **${dayStr}** has **${dayEvents.length} event(s)**:\n\n${eventList}\n\nCheck for gaps between events to fit something in!`;
}

export default function AvailabilityChecker({ events }: AvailabilityCheckerProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheck = (q: string = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setResult('');
    setTimeout(() => {
      setResult(checkAvailability(q, events));
      setLoading(false);
    }, 700);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h2 className="font-semibold text-slate-800 text-sm">Availability Check</h2>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
          placeholder="Do I have time for…?"
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-300"
        />
        <button
          onClick={() => handleCheck()}
          disabled={loading || !query.trim()}
          className="bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '…' : 'Ask'}
        </button>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => { setQuery(s); handleCheck(s); }}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-full px-2.5 py-1 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {result && (
        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-line leading-relaxed border border-slate-100">
          {result.split('\n').map((line, i) => (
            <p key={i} className={line.startsWith('•') ? 'ml-2' : ''}>
              {line.replace(/\*\*(.*?)\*\*/g, '$1')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
