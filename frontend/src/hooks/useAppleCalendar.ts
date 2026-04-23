import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface AppleConnection {
  memberId: string;
  appleId: string;
  displayName?: string;
}

export function useAppleCalendar() {
  const [connections, setConnections] = useState<AppleConnection[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/apple/status`);
      if (res.ok) setConnections(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const connect = useCallback(async (memberId: string, appleId: string, appPassword: string, displayName?: string) => {
    const res = await fetch(`${API}/auth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, appleId, appPassword, displayName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Apple connection failed');
    }
    await fetchStatus();
  }, [fetchStatus]);

  const disconnect = useCallback(async (memberId: string) => {
    await fetch(`${API}/auth/apple/${memberId}`, { method: 'DELETE' });
    setConnections(prev => prev.filter(c => c.memberId !== memberId));
  }, []);

  return { connections, connect, disconnect, refetch: fetchStatus };
}
