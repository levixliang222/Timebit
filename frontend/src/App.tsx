import { useState, useMemo } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import VoiceButton from './components/VoiceButton';
import AvailabilityChecker from './components/AvailabilityChecker';
import SmartReminders from './components/SmartReminders';
import EventModal from './components/EventModal';
import AddEventModal from './components/AddEventModal';
import RoutineTracker from './components/RoutineTracker';
import ScheduleRoutineModal from './components/ScheduleRoutineModal';
import AppleConnectModal from './components/AppleConnectModal';
import type { CalendarEvent, CalendarSource, RoutineActivity, FamilyMember } from './types';
import { familyMembers, calendarSources, mockEvents, smartReminders as initialReminders } from './mockData';
import { useGoogleCalendar } from './hooks/useGoogleCalendar';
import { useAppleCalendar } from './hooks/useAppleCalendar';
import { useRoutines } from './hooks/useRoutines';
import './index.css';

type Tab = 'calendar' | 'routines';
const kids = familyMembers.filter(m => m.isKid);

function findMatchingActivity(title: string, memberId: string, activities: RoutineActivity[]) {
  const t = title.toLowerCase().trim();
  return activities.find(a =>
    a.memberId === memberId &&
    (t.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(t))
  );
}

function eventDurationHours(start: string, end: string): number {
  const mins = differenceInMinutes(parseISO(end), parseISO(start));
  return Math.round((mins / 60) * 2) / 2;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  const [activeMemberIds, setActiveMemberIds] = useState(familyMembers.map(m => m.id));
  const [activeCalendarIds, setActiveCalendarIds] = useState(calendarSources.map(c => c.id));
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [reminders, setReminders] = useState(initialReminders);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [schedulingActivity, setSchedulingActivity] = useState<RoutineActivity | null>(null);
  const [appleConnectingMember, setAppleConnectingMember] = useState<FamilyMember | null>(null);

  const { connections: googleConns, googleEvents, googleCalendars, loading: googleLoading, connect: googleConnect, disconnect: googleDisconnect } = useGoogleCalendar();
  const { connections: appleConns, connect: appleConnect, disconnect: appleDisconnect } = useAppleCalendar();
  const { activities, setDayHours, getMemberActivities } = useRoutines();

  const kidActivities = useMemo(() =>
    Object.fromEntries(kids.map(k => [k.id, getMemberActivities(k.id)])),
    [activities]
  );

  const allCalendars: CalendarSource[] = [
    ...calendarSources,
    ...googleCalendars.filter(gc => !calendarSources.some(c => c.id === gc.id)),
  ];

  const allActiveCalendarIds = [
    ...activeCalendarIds,
    ...googleCalendars.map(gc => gc.id).filter(id => !activeCalendarIds.includes(id)),
  ];

  const toggleMember = (id: string) =>
    setActiveMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleCalendar = (id: string) => {
    if (allActiveCalendarIds.includes(id)) {
      setActiveCalendarIds(prev => [
        ...prev.filter(x => x !== id),
        ...googleCalendars.map(gc => gc.id).filter(gid => gid !== id && !prev.includes(gid)),
      ]);
    } else {
      setActiveCalendarIds(prev => [...prev, id]);
    }
  };

  const allEvents = [...events, ...googleEvents];
  const visibleEvents = allEvents.filter(e =>
    allActiveCalendarIds.includes(e.calendarId) && activeMemberIds.includes(e.memberId)
  );

  const completedIds = useMemo(
    () => new Set(allEvents.filter(e => e.completed).map(e => e.id)),
    [allEvents]
  );

  const handleToggleComplete = (event: CalendarEvent) => {
    const nowCompleted = !event.completed;
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, completed: nowCompleted } : e));
    const member = familyMembers.find(m => m.id === event.memberId);
    if (!member?.isKid || !nowCompleted || event.allDay) return;
    const match = findMatchingActivity(event.title, event.memberId, activities);
    if (!match) return;
    const date = format(parseISO(event.start), 'yyyy-MM-dd');
    const hours = eventDurationHours(event.start, event.end);
    if (hours > 0) setDayHours(match.id, match.memberId, date, hours);
  };

  const handleAddEvent = (newEvent: Omit<CalendarEvent, 'id'>) =>
    setEvents(prev => [...prev, { ...newEvent, id: `e${Date.now()}` }]);

  const eventCalendars = [
    ...calendarSources,
    ...googleCalendars.filter(gc => !calendarSources.some(c => c.id === gc.id)),
  ];

  const googleConnectedIds = googleConns.map(c => c.memberId);
  const appleConnectedIds = appleConns.map(c => c.memberId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        members={familyMembers}
        calendars={allCalendars}
        activeMemberIds={activeMemberIds}
        onToggleMember={toggleMember}
        activeCalendarIds={allActiveCalendarIds}
        onToggleCalendar={toggleCalendar}
        googleConnections={googleConns}
        onGoogleConnect={googleConnect}
        onGoogleDisconnect={googleDisconnect}
        connectingId={googleLoading}
        appleConnections={appleConns}
        onAppleConnect={id => setAppleConnectingMember(familyMembers.find(m => m.id === id) ?? null)}
        onAppleDisconnect={appleDisconnect}
        activeTab={tab}
        onTabChange={setTab}
        kidActivities={kidActivities}
        onScheduleRoutine={setSchedulingActivity}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === 'calendar' ? (
          <>
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div>
                <h1 className="text-base font-semibold text-slate-800 m-0">Family Calendar</h1>
                <p className="text-xs text-slate-400 m-0">
                  {visibleEvents.length} event{visibleEvents.length !== 1 ? 's' : ''} visible
                  {googleEvents.length > 0 && <span className="ml-1 text-emerald-500">· {googleEvents.length} from Google</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {familyMembers.filter(m => activeMemberIds.includes(m.id)).map(m => (
                    <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-sm"
                      style={{ backgroundColor: m.color + '20' }} title={m.name}>
                      {m.avatar}
                    </div>
                  ))}
                </div>
                <button onClick={() => setPendingTranscript('')}
                  className="bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                  + Add Event
                </button>
              </div>
            </header>

            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <CalendarView events={visibleEvents} completedIds={completedIds}
                  onEventClick={setSelectedEvent} onToggleComplete={handleToggleComplete} />
              </div>
              <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-lg">🎙</span>
                    <h2 className="font-semibold text-slate-800 text-sm m-0">Voice Add</h2>
                  </div>
                  <p className="text-xs text-slate-400 text-center m-0">Press and speak to add an event naturally</p>
                  <VoiceButton onTranscript={text => setPendingTranscript(text)} />
                </div>
                <AvailabilityChecker events={visibleEvents} />
                <SmartReminders reminders={reminders}
                  onDismiss={id => setReminders(prev => prev.filter(r => r.id !== id))} />
              </div>
            </div>
          </>
        ) : (
          <RoutineTracker kids={kids} />
        )}
      </div>

      {selectedEvent && (
        <EventModal event={selectedEvent} calendars={eventCalendars} members={familyMembers} onClose={() => setSelectedEvent(null)} />
      )}
      {pendingTranscript !== null && (
        <AddEventModal transcriptText={pendingTranscript || undefined} calendars={eventCalendars}
          onAdd={handleAddEvent} onClose={() => setPendingTranscript(null)} />
      )}
      {schedulingActivity && (
        <ScheduleRoutineModal
          activity={schedulingActivity}
          member={familyMembers.find(m => m.id === schedulingActivity.memberId)!}
          allMembers={familyMembers}
          calendars={eventCalendars}
          googleConnectedIds={googleConnectedIds}
          appleConnectedIds={appleConnectedIds}
          onAdd={handleAddEvent}
          onClose={() => setSchedulingActivity(null)}
        />
      )}
      {appleConnectingMember && (
        <AppleConnectModal
          member={appleConnectingMember}
          onConnect={(appleId, appPassword) => appleConnect(appleConnectingMember.id, appleId, appPassword)}
          onClose={() => setAppleConnectingMember(null)}
        />
      )}
    </div>
  );
}
