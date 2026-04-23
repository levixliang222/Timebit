import { useState } from 'react';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import type { RoutineActivity, CalendarEvent, CalendarSource, FamilyMember } from '../types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface ScheduleRoutineModalProps {
  activity: RoutineActivity;
  member: FamilyMember;
  allMembers: FamilyMember[];
  calendars: CalendarSource[];
  googleConnectedIds: string[];
  appleConnectedIds: string[];
  onAdd: (event: Omit<CalendarEvent, 'id'>) => void;
  onClose: () => void;
}

export default function ScheduleRoutineModal({
  activity, member, allMembers, calendars,
  googleConnectedIds, appleConnectedIds,
  onAdd, onClose,
}: ScheduleRoutineModalProps) {
  const memberCalendars = calendars.filter(c => c.owner.id === member.id);
  const defaultCal = memberCalendars[0] ?? calendars[0];

  // Default: today at the next round hour
  const now = new Date();
  const defaultStart = setMinutes(setHours(now, now.getHours() + 1), 0);

  const [date, setDate] = useState(format(defaultStart, 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(defaultStart, 'HH:mm'));
  const [durationHours, setDurationHours] = useState(1);
  const [calendarId, setCalendarId] = useState(defaultCal?.id ?? '');
  const [note, setNote] = useState('');
  const [syncGoogle, setSyncGoogle] = useState(googleConnectedIds.includes(member.id));
  const [syncApple, setSyncApple] = useState(appleConnectedIds.includes(member.id));
  const [inviteIds, setInviteIds] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const startDt = new Date(`${date}T${time}`);
  const endDt = addHours(startDt, durationHours);
  const otherMembers = allMembers.filter(m => m.id !== member.id);

  const toggleInvite = (id: string) =>
    setInviteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAdd = async () => {
    setSyncing(true);
    setSyncError('');

    // Add to local calendar view immediately
    onAdd({
      title: activity.name,
      start: startDt.toISOString(),
      end: endDt.toISOString(),
      color: activity.color,
      calendarId,
      memberId: member.id,
      description: note || undefined,
    });

    // Sync to external calendars
    if (syncGoogle || syncApple) {
      try {
        await fetch(`${API}/api/calendar/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: activity.name,
            start: startDt.toISOString(),
            end: endDt.toISOString(),
            description: note || undefined,
            organizerMemberId: member.id,
            attendeeMemberIds: inviteIds,
            syncToGoogle: syncGoogle,
            syncToApple: syncApple,
          }),
        });
      } catch (e: any) {
        setSyncError('Saved locally. External sync failed: ' + e.message);
        setSyncing(false);
        return;
      }
    }

    setSyncing(false);
    onClose();
  };

  const durationLabel = durationHours === 1 ? '1 hour' :
    durationHours < 1 ? `${durationHours * 60} min` : `${durationHours} hours`;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header strip */}
        <div
          className="rounded-t-2xl px-5 py-4 flex items-center gap-3"
          style={{ backgroundColor: activity.color + '18' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-sm"
            style={{ backgroundColor: activity.color + '30' }}
          >
            {activity.icon}
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base leading-tight">{activity.name}</h2>
            <p className="text-xs text-slate-500">Schedule for {member.avatar} {member.name}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Start time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-500">Duration</label>
              <span className="text-xs font-bold" style={{ color: activity.color }}>{durationLabel}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={durationHours}
              onChange={e => setDurationHours(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: activity.color }}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>30 min</span>
              <span>4 hrs</span>
            </div>
          </div>

          {/* Time summary */}
          <div
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
            style={{ backgroundColor: activity.color + '12' }}
          >
            <span className="text-slate-500">Time block</span>
            <span className="font-semibold text-slate-700">
              {format(startDt, 'h:mm a')} – {format(endDt, 'h:mm a')}
            </span>
          </div>

          {/* Calendar picker */}
          {memberCalendars.length > 1 && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Calendar</label>
              <select
                value={calendarId}
                onChange={e => setCalendarId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {memberCalendars.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Optional note */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Note (optional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Chapter 5, page 30–40"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-300"
            />
          </div>

          {/* Invite family members */}
          {otherMembers.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Invite family members</label>
              <div className="flex flex-wrap gap-1.5">
                {otherMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleInvite(m.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                      inviteIds.includes(m.id)
                        ? 'text-white border-transparent'
                        : 'text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                    style={inviteIds.includes(m.id) ? { backgroundColor: m.color } : {}}
                  >
                    <span>{m.avatar}</span><span>{m.name}</span>
                    {inviteIds.includes(m.id) && <span className="ml-0.5">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sync toggles */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Sync to</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSyncGoogle(v => !v)}
                disabled={!googleConnectedIds.includes(member.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border transition-all ${
                  syncGoogle && googleConnectedIds.includes(member.id)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-slate-200 text-slate-400'
                } disabled:opacity-30`}
              >
                <GoogleIcon /> Google
              </button>
              <button
                onClick={() => setSyncApple(v => !v)}
                disabled={!appleConnectedIds.includes(member.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border transition-all ${
                  syncApple && appleConnectedIds.includes(member.id)
                    ? 'bg-slate-100 border-slate-400 text-slate-700'
                    : 'border-slate-200 text-slate-400'
                } disabled:opacity-30`}
              >
                🍎 Apple
              </button>
            </div>
            {!googleConnectedIds.includes(member.id) && !appleConnectedIds.includes(member.id) && (
              <p className="text-xs text-slate-400 mt-1">Connect a calendar in the sidebar to enable sync</p>
            )}
          </div>

          {syncError && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{syncError}</div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-sm border border-slate-200 rounded-xl py-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={syncing}
            className="flex-1 text-sm text-white rounded-xl py-2.5 font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: activity.color }}
          >
            {syncing ? 'Saving…' : 'Add to calendar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
