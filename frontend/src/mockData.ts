import type { CalendarSource, CalendarEvent, FamilyMember, Reminder } from './types';

export const familyMembers: FamilyMember[] = [
  { id: 'mom',   name: 'Mom',   avatar: '👩🏻', color: '#6366f1', isKid: false },
  { id: 'dad',   name: 'Dad',   avatar: '👨🏻', color: '#0ea5e9', isKid: false },
  { id: 'emma',  name: 'Ding',  avatar: '👧🏻', color: '#f59e0b', isKid: true  },
  { id: 'lucas', name: 'Dang', avatar: '💁🏻‍♀️', color: '#10b981', isKid: true  },
];

export const calendarSources: CalendarSource[] = [
  { id: 'mom-personal', name: "Mom's Personal", color: '#818cf8', type: 'google',  connected: true,  owner: familyMembers[0] },
  { id: 'dad-personal', name: "Dad's Personal", color: '#38bdf8', type: 'apple',   connected: false, owner: familyMembers[1] },
  { id: 'emma-school',  name: "Ding's stuff",   color: '#f59e0b', type: 'google',  connected: true,  owner: familyMembers[2] },
  { id: 'lucas-school', name: "Dang things",    color: '#10b981', type: 'google',  connected: true,  owner: familyMembers[3] },
  { id: 'family',       name: 'Medina School calendar', color: '#ec4899', type: 'family',  connected: true,  owner: familyMembers[0] },
];

// Build events relative to today so they always appear in current week
const today = new Date();
today.setHours(0, 0, 0, 0);

function d(dayOffset: number, hour: number, minute = 0) {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + dayOffset);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
}

export const mockEvents: CalendarEvent[] = [
  // Today
  { id: 'e1',  title: 'Team Standup',         start: d(0, 9),   end: d(0, 9, 30),  color: '#6366f1', calendarId: 'mom-personal',     memberId: 'mom'   },
  { id: 'e2',  title: 'Product Review',        start: d(0, 14),  end: d(0, 15, 30), color: '#6366f1', calendarId: 'mom-personal',     memberId: 'mom'   },
  { id: 'e3',  title: 'Soccer Practice',       start: d(0, 16),  end: d(0, 17, 30), color: '#10b981', calendarId: 'lucas-school', memberId: 'lucas' },
  // Tomorrow
  { id: 'e4',  title: 'Dentist Appointment',   start: d(1, 10),  end: d(1, 11),     color: '#ec4899', calendarId: 'family',       memberId: 'mom'   },
  { id: 'e5',  title: 'Client Call',           start: d(1, 13),  end: d(1, 14),     color: '#0ea5e9', calendarId: 'dad-personal',     memberId: 'dad'   },
  { id: 'e6',  title: 'Piano Lesson',          start: d(1, 15),  end: d(1, 16),     color: '#f59e0b', calendarId: 'emma-school',  memberId: 'emma'  },
  // Day after tomorrow
  { id: 'e7',  title: 'Design Sprint',         start: d(2, 9),   end: d(2, 17),     color: '#6366f1', calendarId: 'mom-personal',     memberId: 'mom'   },
  { id: 'e8',  title: 'School Play Rehearsal', start: d(2, 14),  end: d(2, 16),     color: '#f59e0b', calendarId: 'emma-school',  memberId: 'emma'  },
  // 3 days out
  { id: 'e9',  title: 'Gym',                   start: d(3, 7),   end: d(3, 8),      color: '#0ea5e9', calendarId: 'dad-personal', memberId: 'dad'   },
  { id: 'e10', title: 'Board Meeting',         start: d(3, 10),  end: d(3, 12),     color: '#0ea5e9', calendarId: 'dad-personal',     memberId: 'dad'   },
  { id: 'e11', title: 'Soccer Game',           start: d(3, 15),  end: d(3, 17),     color: '#10b981', calendarId: 'lucas-school', memberId: 'lucas' },
  // 4 days out
  { id: 'e12', title: 'Family Dinner',         start: d(4, 18),  end: d(4, 20),     color: '#ec4899', calendarId: 'family',       memberId: 'mom'   },
  { id: 'e13', title: 'Math Tutoring',         start: d(4, 16),  end: d(4, 17),     color: '#f59e0b', calendarId: 'emma-school',  memberId: 'emma'  },
  // 5 days out
  { id: 'e14', title: "Dad's Work Conference", start: d(5, 8),   end: d(5, 18), allDay: false, color: '#0ea5e9', calendarId: 'dad-personal', memberId: 'dad' },
  // All-day events
  { id: 'e15', title: "Emma's Birthday",       start: d(6, 0),   end: d(7, 0),  allDay: true,  color: '#f59e0b', calendarId: 'family', memberId: 'emma'  },
  { id: 'e16', title: 'School Holiday',        start: d(-1, 0),  end: d(1, 0),  allDay: true,  color: '#94a3b8', calendarId: 'family', memberId: 'mom'   },
];

export const smartReminders: Reminder[] = [
  { id: 'r1', text: "Emma's birthday is in 6 days — have you ordered a gift?", urgency: 'high',   relatedEventId: 'e15' },
  { id: 'r2', text: "Lucas has soccer practice today at 4 PM — remember to pack snacks!", urgency: 'high',   relatedEventId: 'e3'  },
  { id: 'r3', text: "You mentioned getting the car serviced — no slot on the calendar yet.", urgency: 'medium' },
  { id: 'r4', text: "Family dinner Friday — anyone checked the restaurant reservation?", urgency: 'medium', relatedEventId: 'e12' },
  { id: 'r5', text: "Dad's conference is Friday — pack luggage the night before.", urgency: 'low',    relatedEventId: 'e14' },
];
