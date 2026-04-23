export interface CalendarSource {
  id: string;
  name: string;
  color: string;
  type: 'google' | 'outlook' | 'apple' | 'family';
  connected: boolean;
  owner: FamilyMember;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isKid: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  color: string;
  calendarId: string;
  memberId: string;
  description?: string;
  location?: string;
  completed?: boolean;
}

export interface Reminder {
  id: string;
  text: string;
  urgency: 'high' | 'medium' | 'low';
  relatedEventId?: string;
}

export interface RoutineActivity {
  id: string;
  memberId: string;
  name: string;
  icon: string;
  color: string;
  weeklyTargetHours: number;
}

export interface RoutineLog {
  id: string;
  activityId: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  hours: number;
}
