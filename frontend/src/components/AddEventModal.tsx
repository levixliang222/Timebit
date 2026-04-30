import { useState } from 'react';
import type { CalendarEvent, CalendarSource } from '../types';

interface AddEventModalProps {
  transcriptText?: string;
  defaultStart?: string; // ISO string
  defaultEnd?: string;   // ISO string
  calendars: CalendarSource[];
  onAdd: (event: Omit<CalendarEvent, 'id'>) => void;
  onClose: () => void;
}

function parseTranscript(text: string): Partial<CalendarEvent> {
  const result: Partial<CalendarEvent> = { title: text };
  const today = new Date();

  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  const lower = text.toLowerCase();
  let targetDate = new Date(today);

  if (lower.includes('tomorrow')) {
    targetDate.setDate(today.getDate() + 1);
  } else {
    for (const [day, idx] of Object.entries(dayMap)) {
      if (lower.includes(day)) {
        const current = today.getDay();
        const diff = (idx - current + 7) % 7 || 7;
        targetDate.setDate(today.getDate() + diff);
        break;
      }
    }
  }

  const timeMatch = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const min = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3];
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    targetDate.setHours(hour, min, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(hour + 1, min, 0, 0);
    result.start = targetDate.toISOString();
    result.end = endDate.toISOString();

    const titleMatch = text.match(/^(.*?)(?:\s+at\s+\d)/i);
    if (titleMatch) result.title = titleMatch[1].trim();
  }

  return result;
}

export default function AddEventModal({ transcriptText, defaultStart, defaultEnd, calendars, onAdd, onClose }: AddEventModalProps) {
  const parsed = transcriptText ? parseTranscript(transcriptText) : {};
  const today = new Date();
  const fallbackStart = new Date(today.setHours(9, 0, 0, 0));
  const fallbackEnd = new Date(today.setHours(10, 0, 0, 0));

  const [title, setTitle] = useState(parsed.title || '');
  const [start, setStart] = useState(
    parsed.start
      ? new Date(parsed.start).toISOString().slice(0, 16)
      : defaultStart
      ? new Date(defaultStart).toISOString().slice(0, 16)
      : fallbackStart.toISOString().slice(0, 16)
  );
  const [end, setEnd] = useState(
    parsed.end
      ? new Date(parsed.end).toISOString().slice(0, 16)
      : defaultEnd
      ? new Date(defaultEnd).toISOString().slice(0, 16)
      : fallbackEnd.toISOString().slice(0, 16)
  );
  const [calendarId, setCalendarId] = useState(calendars[0]?.id || '');

  const handleSubmit = () => {
    if (!title.trim()) return;
    const cal = calendars.find(c => c.id === calendarId);
    onAdd({
      title,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      color: cal?.color || '#6366f1',
      calendarId,
      memberId: cal?.owner.id || 'mom',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Add Event</h2>
        {transcriptText && (
          <p className="text-xs text-indigo-500 italic mb-4">From voice: "{transcriptText}"</p>
        )}

        <div className="space-y-3 mt-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Event title"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Calendar</label>
            <select
              value={calendarId}
              onChange={e => setCalendarId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {calendars.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 text-sm border border-slate-200 rounded-lg py-2 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 text-sm bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}
