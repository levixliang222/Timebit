import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { getAuthedClient, getAllConnected } from '../googleAuth';
import { createAppleEvent, getAppleCredentials } from '../appleCalDAV';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface CreateEventBody {
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  description?: string;
  location?: string;
  organizerMemberId: string;       // who is creating
  attendeeMemberIds?: string[];    // other family members to invite
  syncToGoogle?: boolean;
  syncToApple?: boolean;
}

// Map memberId → email from connected Google accounts
function getMemberEmail(memberId: string): string | null {
  const connected = getAllConnected();
  return connected.find(c => c.memberId === memberId)?.email ?? null;
}

router.post('/', async (req: Request, res: Response) => {
  const body = req.body as CreateEventBody;
  const { title, start, end, allDay, description, location,
    organizerMemberId, attendeeMemberIds = [], syncToGoogle = true, syncToApple = true } = body;

  if (!title || !start || !end || !organizerMemberId) {
    res.status(400).json({ error: 'title, start, end, organizerMemberId are required' });
    return;
  }

  // Collect attendee emails from connected Google accounts
  const attendeeEmails = attendeeMemberIds
    .map(id => getMemberEmail(id))
    .filter((e): e is string => !!e);

  const results: { google?: string; apple?: string; errors: string[] } = { errors: [] };

  // --- Google Calendar ---
  if (syncToGoogle) {
    const authClient = getAuthedClient(organizerMemberId);
    if (authClient) {
      try {
        const cal = google.calendar({ version: 'v3', auth: authClient });
        const event = await cal.events.insert({
          calendarId: 'primary',
          sendUpdates: attendeeEmails.length > 0 ? 'all' : 'none',
          requestBody: {
            summary: title,
            description,
            location,
            start: allDay
              ? { date: start.slice(0, 10) }
              : { dateTime: start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end: allDay
              ? { date: end.slice(0, 10) }
              : { dateTime: end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            attendees: attendeeEmails.map(email => ({ email })),
          },
        });
        results.google = event.data.id ?? undefined;
      } catch (err: any) {
        results.errors.push(`Google: ${err.message}`);
      }
    } else {
      results.errors.push('Google: not connected for organizer');
    }
  }

  // --- Apple iCloud CalDAV ---
  if (syncToApple) {
    const appleCreds = getAppleCredentials(organizerMemberId);
    if (appleCreds) {
      try {
        const uid = await createAppleEvent(organizerMemberId, {
          title, start, end, allDay, description, location,
          attendeeEmails,
        });
        results.apple = uid ?? undefined;
      } catch (err: any) {
        results.errors.push(`Apple: ${err.message}`);
      }
    } else {
      results.errors.push('Apple: not connected for organizer');
    }
  }

  res.json({ ok: true, ...results });
});

export default router;
