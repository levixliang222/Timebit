import { useState, useCallback } from 'react';
import type { RoutineActivity, RoutineLog } from '../types';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, parseISO, isWithinInterval, format,
} from 'date-fns';

const DEFAULT_ACTIVITIES: RoutineActivity[] = [
  { id: 'ding-judo',     memberId: 'emma', name: 'Judo',      icon: '🥋', color: '#6366f1', weeklyTargetHours: 3 },
  { id: 'ding-math',     memberId: 'emma', name: 'Math',      icon: '🔢', color: '#0ea5e9', weeklyTargetHours: 5 },
  { id: 'ding-chinese',  memberId: 'emma', name: 'Chinese',   icon: '🈶', color: '#f59e0b', weeklyTargetHours: 4 },
  { id: 'ding-duolingo', memberId: 'emma', name: 'Duolingo',  icon: '🦉', color: '#10b981', weeklyTargetHours: 2 },
  { id: 'ding-homework', memberId: 'emma', name: 'Homework',  icon: '📚', color: '#8b5cf6', weeklyTargetHours: 7 },

  { id: 'dang-chess',    memberId: 'lucas', name: 'Chess',    icon: '♟️', color: '#64748b', weeklyTargetHours: 2 },
  { id: 'dang-math',     memberId: 'lucas', name: 'Math',     icon: '🔢', color: '#0ea5e9', weeklyTargetHours: 5 },
  { id: 'dang-duolingo', memberId: 'lucas', name: 'Duolingo', icon: '🦉', color: '#10b981', weeklyTargetHours: 2 },
  { id: 'dang-homework', memberId: 'lucas', name: 'Homework', icon: '📚', color: '#8b5cf6', weeklyTargetHours: 7 },
  { id: 'dang-chinese',  memberId: 'lucas', name: 'Chinese',  icon: '🈶', color: '#f59e0b', weeklyTargetHours: 4 },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useRoutines() {
  const [activities, setActivities] = useState<RoutineActivity[]>(() =>
    loadFromStorage('timebit_activities', DEFAULT_ACTIVITIES)
  );
  const [logs, setLogs] = useState<RoutineLog[]>(() =>
    loadFromStorage('timebit_logs', [])
  );

  const saveActivities = useCallback((next: RoutineActivity[]) => {
    setActivities(next);
    saveToStorage('timebit_activities', next);
  }, []);

  const saveLogs = useCallback((next: RoutineLog[]) => {
    setLogs(next);
    saveToStorage('timebit_logs', next);
  }, []);

  const addActivity = useCallback((act: RoutineActivity) => {
    saveActivities([...activities, act]);
  }, [activities, saveActivities]);

  const updateActivity = useCallback((updated: RoutineActivity) => {
    saveActivities(activities.map(a => a.id === updated.id ? updated : a));
  }, [activities, saveActivities]);

  const deleteActivity = useCallback((id: string) => {
    saveActivities(activities.filter(a => a.id !== id));
    saveLogs(logs.filter(l => l.activityId !== id));
  }, [activities, logs, saveActivities, saveLogs]);

  const logHours = useCallback((activityId: string, memberId: string, date: string, hours: number) => {
    const existing = logs.find(l => l.activityId === activityId && l.date === date);
    let next: RoutineLog[];
    if (existing) {
      const newHours = Math.max(0, existing.hours + hours);
      next = newHours === 0
        ? logs.filter(l => !(l.activityId === activityId && l.date === date))
        : logs.map(l => l.activityId === activityId && l.date === date ? { ...l, hours: newHours } : l);
    } else if (hours > 0) {
      next = [...logs, { id: `log-${Date.now()}`, activityId, memberId, date, hours }];
    } else {
      return;
    }
    saveLogs(next);
  }, [logs, saveLogs]);

  const setDayHours = useCallback((activityId: string, memberId: string, date: string, hours: number) => {
    let next: RoutineLog[];
    if (hours <= 0) {
      next = logs.filter(l => !(l.activityId === activityId && l.date === date));
    } else {
      const existing = logs.find(l => l.activityId === activityId && l.date === date);
      if (existing) {
        next = logs.map(l => l.activityId === activityId && l.date === date ? { ...l, hours } : l);
      } else {
        next = [...logs, { id: `log-${Date.now()}`, activityId, memberId, date, hours }];
      }
    }
    saveLogs(next);
  }, [logs, saveLogs]);

  // Aggregation helpers
  const hoursInRange = useCallback((activityId: string, start: Date, end: Date): number => {
    return logs
      .filter(l => {
        if (l.activityId !== activityId) return false;
        const d = parseISO(l.date);
        return isWithinInterval(d, { start, end });
      })
      .reduce((sum, l) => sum + l.hours, 0);
  }, [logs]);

  const getStats = useCallback((activityId: string, now = new Date()) => {
    const todayStr = format(now, 'yyyy-MM-dd');
    const todayLog = logs.find(l => l.activityId === activityId && l.date === todayStr);

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    return {
      today: todayLog?.hours ?? 0,
      todayDate: todayStr,
      week: hoursInRange(activityId, weekStart, weekEnd),
      month: hoursInRange(activityId, monthStart, monthEnd),
      year: hoursInRange(activityId, yearStart, yearEnd),
    };
  }, [logs, hoursInRange]);

  const getMemberActivities = useCallback((memberId: string) =>
    activities.filter(a => a.memberId === memberId),
  [activities]);

  return {
    activities,
    logs,
    addActivity,
    updateActivity,
    deleteActivity,
    logHours,
    setDayHours,
    getStats,
    getMemberActivities,
  };
}
