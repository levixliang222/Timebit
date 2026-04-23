import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventContentArg } from '@fullcalendar/core';
import type { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  completedIds: Set<string>;
  onEventClick: (event: CalendarEvent) => void;
  onToggleComplete: (event: CalendarEvent) => void;
}

function EventContent({ arg, completed, onToggle }: {
  arg: EventContentArg;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between w-full gap-1 px-1 overflow-hidden min-h-0">
      <div className="flex-1 overflow-hidden min-w-0">
        {arg.timeText && (
          <div className="text-[10px] opacity-80 leading-tight whitespace-nowrap">{arg.timeText}</div>
        )}
        <div
          className="text-xs font-medium leading-tight truncate"
          style={{ textDecoration: completed ? 'line-through' : 'none', opacity: completed ? 0.7 : 1 }}
        >
          {arg.event.title}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        title={completed ? 'Mark incomplete' : 'Mark complete'}
        className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
          completed
            ? 'bg-green-500 border-green-500'
            : 'border-white/70 bg-transparent hover:bg-white/20'
        }`}
      >
        {completed && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}

export default function CalendarView({ events, completedIds, onEventClick, onToggleComplete }: CalendarViewProps) {
  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-hidden">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        events={events.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          allDay: e.allDay,
          backgroundColor: e.completed ? '#86efac' : e.color,
          borderColor: e.completed ? '#22c55e' : e.color,
          extendedProps: { original: e },
        }))}
        eventContent={arg => (
          <EventContent
            arg={arg}
            completed={completedIds.has(arg.event.id)}
            onToggle={() => onToggleComplete(arg.event.extendedProps.original as CalendarEvent)}
          />
        )}
        eventClick={info => onEventClick(info.event.extendedProps.original as CalendarEvent)}
        height="100%"
        nowIndicator
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        dayMaxEvents={3}
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
      />
    </div>
  );
}
