import type { FamilyMember, CalendarSource, RoutineActivity } from '../types';
import type { ConnectionStatus } from '../hooks/useGoogleCalendar';
import type { AppleConnection } from '../hooks/useAppleCalendar';

interface SidebarProps {
  members: FamilyMember[];
  calendars: CalendarSource[];
  activeMemberIds: string[];
  onToggleMember: (id: string) => void;
  activeCalendarIds: string[];
  onToggleCalendar: (id: string) => void;
  googleConnections: ConnectionStatus[];
  onGoogleConnect: (memberId: string) => void;
  onGoogleDisconnect: (memberId: string) => void;
  connectingId: string | null;
  appleConnections: AppleConnection[];
  onAppleConnect: (memberId: string) => void;
  onAppleDisconnect: (memberId: string) => void;
  activeTab: 'calendar' | 'routines';
  onTabChange: (tab: 'calendar' | 'routines') => void;
  kidActivities: Record<string, RoutineActivity[]>;
  onScheduleRoutine: (activity: RoutineActivity) => void;
}

const sourceIcon: Record<string, string> = {
  google: 'G',
  outlook: '⊞',
  apple: '',
  family: '♥',
};

export default function Sidebar({
  members, calendars, activeMemberIds, onToggleMember,
  activeCalendarIds, onToggleCalendar,
  googleConnections, onGoogleConnect, onGoogleDisconnect, connectingId,
  appleConnections, onAppleConnect, onAppleDisconnect,
  activeTab, onTabChange,
  kidActivities, onScheduleRoutine,
}: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <span className="text-lg font-bold text-slate-800">Timebit</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">AI Family Calendar</p>
      </div>

      {/* Nav tabs */}
      <div className="px-3 pt-3 pb-1 flex gap-1">
        <button
          onClick={() => onTabChange('calendar')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          📅 Calendar
        </button>
        <button
          onClick={() => onTabChange('routines')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'routines' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          ⭐ Routines
        </button>
      </div>

      {/* Family members */}
      <div className="px-4 pt-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Family</h3>
        <div className="space-y-2">
          {members.map(m => {
            const active = activeMemberIds.includes(m.id);
            const activities = kidActivities[m.id] ?? [];

            const googleConn = googleConnections.find(c => c.memberId === m.id);
            const appleConn = appleConnections.find(c => c.memberId === m.id);
            const isConnecting = connectingId === m.id;

            return (
              <div key={m.id} className="rounded-xl border border-slate-100 overflow-hidden">
                {/* Name row */}
                <button
                  onClick={() => onToggleMember(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-all ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg leading-none">{m.avatar}</span>
                  <span className="font-medium flex-1 text-left">{m.name}</span>
                  {m.isKid && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">kid</span>
                  )}
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                </button>

                {/* Routine chips — kids only, calendar tab only */}
                {m.isKid && activeTab === 'calendar' && activities.length > 0 && (
                  <div className="px-2.5 pt-1 pb-1 flex flex-wrap gap-1">
                    {activities.map(act => (
                      <button
                        key={act.id}
                        onClick={() => onScheduleRoutine(act)}
                        title={`Schedule ${act.name}`}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all hover:scale-105 hover:shadow-sm active:scale-95"
                        style={{ backgroundColor: act.color + '18', borderColor: act.color + '50', color: act.color }}
                      >
                        <span className="text-sm leading-none">{act.icon}</span>
                        <span>{act.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Google + Apple connect rows */}
                <div className="px-2.5 pb-2 space-y-1 pt-1">
                  {/* Google */}
                  {googleConn ? (
                    <div className="flex items-center gap-1.5">
                      <GoogleIcon />
                      <span className="text-xs text-emerald-600 flex-1 truncate">{googleConn.email}</span>
                      <button onClick={() => onGoogleDisconnect(m.id)} className="text-slate-300 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onGoogleConnect(m.id)}
                      disabled={isConnecting}
                      className="w-full flex items-center justify-center gap-1.5 text-xs border border-slate-200 rounded-md py-1 text-slate-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {isConnecting ? <span className="animate-pulse">Connecting…</span> : <><GoogleIcon /> Google Calendar</>}
                    </button>
                  )}

                  {/* Apple */}
                  {appleConn ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🍎</span>
                      <span className="text-xs text-emerald-600 flex-1 truncate">{appleConn.appleId}</span>
                      <button onClick={() => onAppleDisconnect(m.id)} className="text-slate-300 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAppleConnect(m.id)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs border border-slate-200 rounded-md py-1 text-slate-500 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <span>🍎</span> Apple Calendar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendars */}
      <div className="px-4 pt-4 pb-4 flex-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Calendars</h3>
        <div className="space-y-1">
          {calendars.map(cal => {
            const active = activeCalendarIds.includes(cal.id);
            return (
              <button
                key={cal.id}
                onClick={() => onToggleCalendar(cal.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  active ? 'text-slate-700' : 'text-slate-400'
                } hover:bg-slate-50`}
              >
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: active ? cal.color : '#cbd5e1' }}
                />
                <span className={`flex-1 text-left truncate ${active ? 'font-medium' : ''}`}>{cal.name}</span>
                <span className="text-slate-300 font-mono text-xs">{sourceIcon[cal.type]}</span>
                {!cal.connected && (
                  <span className="text-xs text-amber-500" title="Not connected">⚠</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
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
