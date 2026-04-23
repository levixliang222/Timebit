import { DAVClient } from 'tsdav';
import { v4 as uuidv4 } from 'uuid';

export interface AppleCredentials {
  appleId: string;
  appPassword: string;
  displayName?: string;
}

export interface CalDAVEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  calendarId: string;
  calendarName: string;
  memberId: string;
  description?: string;
  location?: string;
  uid: string;
  etag?: string;
  url?: string;
}

// In-memory credential store (swap for DB in production)
const credStore = new Map<string, AppleCredentials & { client?: DAVClient }>();

export function saveAppleCredentials(memberId: string, creds: AppleCredentials) {
  credStore.set(memberId, { ...creds, client: undefined });
}

export function getAppleCredentials(memberId: string): AppleCredentials | null {
  const entry = credStore.get(memberId);
  return entry ? { appleId: entry.appleId, appPassword: entry.appPassword, displayName: entry.displayName } : null;
}

export function removeAppleCredentials(memberId: string) {
  credStore.delete(memberId);
}

export function getAllAppleConnected(): { memberId: string; appleId: string; displayName?: string }[] {
  return Array.from(credStore.entries()).map(([memberId, c]) => ({
    memberId,
    appleId: c.appleId,
    displayName: c.displayName,
  }));
}

async function getClient(memberId: string): Promise<DAVClient | null> {
  const creds = credStore.get(memberId);
  if (!creds) return null;

  if (!creds.client) {
    const client = new DAVClient({
      serverUrl: 'https://caldav.icloud.com',
      credentials: { username: creds.appleId, password: creds.appPassword },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });
    await client.login();
    creds.client = client;
  }
  return creds.client;
}

export async function fetchAppleEvents(memberId: string): Promise<{
  events: CalDAVEvent[];
  calendars: { id: string; name: string; color: string; memberId: string }[];
}> {
  const client = await getClient(memberId);
  if (!client) return { events: [], calendars: [] };

  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), 1);
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const davCalendars = await client.fetchCalendars();
  const calendarsMeta: { id: string; name: string; color: string; memberId: string }[] = [];
  const allEvents: CalDAVEvent[] = [];

  for (const cal of davCalendars) {
    if (!cal.url) continue;
    const calId = `apple-${memberId}-${encodeURIComponent(cal.url)}`;
    const color = (cal as any).calendarColor ?? '#6366f1';
    calendarsMeta.push({ id: calId, name: String(cal.displayName ?? 'iCloud Calendar'), color, memberId });

    try {
      const objects = await client.fetchCalendarObjects({
        calendar: cal,
        timeRange: { start: timeMin.toISOString(), end: timeMax.toISOString() },
      });

      for (const obj of objects) {
        const parsed = parseICalEvent(obj.data ?? '');
        if (!parsed) continue;
        allEvents.push({
          ...parsed,
          color,
          calendarId: calId,
          calendarName: String(cal.displayName ?? 'iCloud Calendar'),
          memberId,
          etag: obj.etag,
          url: obj.url,
        });
      }
    } catch {
      // calendar may be empty or unsupported type
    }
  }

  return { events: allEvents, calendars: calendarsMeta };
}

export async function createAppleEvent(
  memberId: string,
  event: {
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    description?: string;
    location?: string;
    attendeeEmails?: string[];
  }
): Promise<string | null> {
  const client = await getClient(memberId);
  if (!client) return null;

  const calendars = await client.fetchCalendars();
  const defaultCal = calendars.find(c => !(c as any).readOnly) ?? calendars[0];
  if (!defaultCal?.url) return null;

  const uid = uuidv4();
  const ics = buildICS({
    uid,
    title: event.title,
    start: new Date(event.start),
    end: new Date(event.end),
    allDay: event.allDay,
    description: event.description,
    location: event.location,
    attendeeEmails: event.attendeeEmails,
  });

  await client.createCalendarObject({
    calendar: defaultCal,
    filename: `${uid}.ics`,
    iCalString: ics,
  });

  return uid;
}

// Minimal iCal parser — extracts the first VEVENT
function parseICalEvent(ics: string): Omit<CalDAVEvent, 'color' | 'calendarId' | 'calendarName' | 'memberId'> | null {
  const lines = ics.replace(/\r\n /g, '').split(/\r?\n/);
  const get = (key: string) => {
    const line = lines.find(l => l.startsWith(key + ':') || l.startsWith(key + ';'));
    if (!line) return '';
    return line.replace(/^[^:]+:/, '').trim();
  };

  const uid = get('UID');
  const summary = get('SUMMARY');
  if (!uid || !summary) return null;

  const dtstart = get('DTSTART');
  const dtend = get('DTEND');
  const allDay = dtstart.length === 8; // YYYYMMDD only
  const description = get('DESCRIPTION') || undefined;
  const location = get('LOCATION') || undefined;

  return {
    id: uid,
    uid,
    title: summary,
    start: parseICalDate(dtstart),
    end: parseICalDate(dtend || dtstart),
    allDay,
    description,
    location,
  };
}

function parseICalDate(s: string): string {
  if (!s) return new Date().toISOString();
  if (s.includes('T')) {
    // YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
    const clean = s.replace(/[^0-9TZ]/g, '');
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6);
    const day = clean.slice(6, 8);
    const hour = clean.slice(9, 11);
    const min = clean.slice(11, 13);
    const sec = clean.slice(13, 15);
    const utc = clean.endsWith('Z') ? 'Z' : '';
    return `${year}-${month}-${day}T${hour}:${min}:${sec}${utc}`;
  }
  // All-day: YYYYMMDD
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function formatICalDate(d: Date, allDay?: boolean): string {
  if (allDay) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildICS(opts: {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  description?: string;
  location?: string;
  attendeeEmails?: string[];
}): string {
  const now = formatICalDate(new Date());
  const dtType = opts.allDay ? ';VALUE=DATE' : '';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Timebit//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${opts.uid}@timebit`,
    `DTSTAMP:${now}`,
    `DTSTART${dtType}:${formatICalDate(opts.start, opts.allDay)}`,
    `DTEND${dtType}:${formatICalDate(opts.end, opts.allDay)}`,
    `SUMMARY:${opts.title}`,
  ];
  if (opts.description) lines.push(`DESCRIPTION:${opts.description}`);
  if (opts.location) lines.push(`LOCATION:${opts.location}`);
  if (opts.attendeeEmails?.length) {
    for (const email of opts.attendeeEmails) {
      lines.push(`ATTENDEE;RSVP=TRUE:mailto:${email}`);
    }
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}
