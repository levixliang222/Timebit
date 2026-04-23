import type { CalendarEvent, CalendarSource, FamilyMember } from '../types';
import { format, parseISO } from 'date-fns';

interface EventModalProps {
  event: CalendarEvent | null;
  calendars: CalendarSource[];
  members: FamilyMember[];
  onClose: () => void;
}

export default function EventModal({ event, calendars, members, onClose }: EventModalProps) {
  if (!event) return null;

  const calendar = calendars.find(c => c.id === event.calendarId);
  const member = members.find(m => m.id === event.memberId);
  const start = parseISO(event.start);
  const end = parseISO(event.end);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Color bar */}
        <div className="w-12 h-1.5 rounded-full mb-4" style={{ backgroundColor: event.color }} />

        <h2 className="text-lg font-semibold text-slate-800 mb-1">{event.title}</h2>

        <div className="space-y-2 mt-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span>{format(start, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          {!event.allDay && (
            <div className="flex items-center gap-2">
              <span className="text-base">🕐</span>
              <span>{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span>{event.location}</span>
            </div>
          )}
          {member && (
            <div className="flex items-center gap-2">
              <span className="text-base">{member.avatar}</span>
              <span>{member.name}</span>
            </div>
          )}
          {calendar && (
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: calendar.color }}
              />
              <span>{calendar.name}</span>
            </div>
          )}
          {event.description && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-slate-500">{event.description}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button className="flex-1 text-sm border border-slate-200 rounded-lg py-2 text-slate-600 hover:bg-slate-50 transition-colors">
            Edit
          </button>
          <button className="flex-1 text-sm bg-red-50 border border-red-200 rounded-lg py-2 text-red-600 hover:bg-red-100 transition-colors">
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 text-sm bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
