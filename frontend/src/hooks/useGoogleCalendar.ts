import { useState, useEffect, useCallback } from 'react';
import type { CalendarEvent, CalendarSource } from '../types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface ConnectionStatus {
  memberId: string;
  email: string;
  name: string;
}

export function useGoogleCalendar() {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [googleCalendars, setGoogleCalendars] = useState<CalendarSource[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/status`);
      if (res.ok) setConnections(await res.json());
    } catch {
      // backend not running yet
    }
  }, []);

  const fetchEventsForMember = useCallback(async (memberId: string) => {
    try {
      const res = await fetch(`${API}/api/calendar/events?memberId=${memberId}`);
      if (!res.ok) return;
      const data = await res.json();
      setGoogleEvents(prev => {
        const filtered = prev.filter(e => e.memberId !== memberId);
        return [...filtered, ...data.events];
      });
      setGoogleCalendars(prev => {
        const filtered = prev.filter(c => !c.id.startsWith(`google-${memberId}`));
        return [...filtered, ...data.calendars];
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Re-fetch events whenever connections change
  useEffect(() => {
    connections.forEach(c => fetchEventsForMember(c.memberId));
  }, [connections, fetchEventsForMember]);

  const connect = useCallback((memberId: string) => {
    setLoading(memberId);
    const url = `${API}/auth/google?memberId=${memberId}`;
    const popup = window.open(url, 'google-auth', 'width=500,height=650,left=400,top=100');

    const handleMessage = async (e: MessageEvent) => {
      const allowedOrigin = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : 'http://localhost:3001';
      if (e.origin !== allowedOrigin && e.origin !== window.location.origin) return;
      if (e.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        setLoading(null);
        await fetchStatus();
        await fetchEventsForMember(e.data.memberId);
        popup?.close();
      }
    };
    window.addEventListener('message', handleMessage);

    // Fallback poll if popup closes without message
    const poll = setInterval(() => {
      if (popup?.closed) {
        clearInterval(poll);
        setLoading(null);
        fetchStatus();
      }
    }, 800);
  }, [fetchStatus, fetchEventsForMember]);

  const disconnect = useCallback(async (memberId: string) => {
    await fetch(`${API}/auth/google/${memberId}`, { method: 'DELETE' });
    setConnections(prev => prev.filter(c => c.memberId !== memberId));
    setGoogleEvents(prev => prev.filter(e => e.memberId !== memberId));
    setGoogleCalendars(prev => prev.filter(c => !c.id.startsWith(`google-${memberId}`)));
  }, []);

  return { connections, googleEvents, googleCalendars, loading, connect, disconnect };
}
