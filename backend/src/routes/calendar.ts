import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { getAuthedClient } from '../googleAuth';
import { fetchAppleEvents, getAppleCredentials } from '../appleCalDAV';

const router = Router();

router.get('/events', async (req: Request, res: Response) => {
  const memberId = req.query.memberId as string;
  if (!memberId) {
    res.status(400).json({ error: 'memberId is required' });
    return;
  }

  const googleClient = getAuthedClient(memberId);
  const hasApple = !!getAppleCredentials(memberId);

  if (!googleClient && !hasApple) {
    res.status(401).json({ error: 'Not connected', connected: false });
    return;
  }

  const allEvents: any[] = [];
  const allCalendars: any[] = [];

  // --- Google Calendar ---
  if (googleClient) {
    try {
      const cal = google.calendar({ version: 'v3', auth: googleClient });
      const calListRes = await cal.calendarList.list();
      const calendarItems = calListRes.data.items ?? [];

      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      const eventArrays = await Promise.all(
        calendarItems.map(async c => {
          try {
            const r = await google.calendar({ version: 'v3', auth: googleClient }).events.list({
              calendarId: c.id!,
              timeMin,
              timeMax,
              singleEvents: true,
              orderBy: 'startTime',
              maxResults: 100,
            });
            return (r.data.items ?? []).map(e => ({
              id: e.id!,
              title: e.summary || '(No title)',
              start: e.start?.dateTime ?? e.start?.date ?? '',
              end: e.end?.dateTime ?? e.end?.date ?? '',
              allDay: !e.start?.dateTime,
              color: c.backgroundColor ?? '#6366f1',
              calendarId: `google-${memberId}-${c.id}`,
              calendarName: c.summary ?? 'Calendar',
              memberId,
              description: e.description ?? undefined,
              location: e.location ?? undefined,
              source: 'google',
            }));
          } catch { return []; }
        })
      );

      allEvents.push(...eventArrays.flat());
      allCalendars.push(...calendarItems.map(c => ({
        id: `google-${memberId}-${c.id}`,
        name: c.summary ?? 'Calendar',
        color: c.backgroundColor ?? '#6366f1',
        type: 'google',
        connected: true,
        memberId,
        source: 'google',
      })));
    } catch (err: any) {
      console.error('Google calendar error:', err.message);
    }
  }

  // --- Apple iCloud CalDAV ---
  if (hasApple) {
    try {
      const { events: appleEvents, calendars: appleCals } = await fetchAppleEvents(memberId);
      allEvents.push(...appleEvents.map(e => ({ ...e, source: 'apple' })));
      allCalendars.push(...appleCals.map(c => ({ ...c, type: 'apple', connected: true, source: 'apple' })));
    } catch (err: any) {
      console.error('Apple calendar error:', err.message);
    }
  }

  res.json({ events: allEvents, calendars: allCalendars });
});

export default router;
