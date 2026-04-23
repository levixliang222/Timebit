import { useState } from 'react';
import type { RoutineActivity } from '../types';

interface Stats {
  today: number;
  todayDate: string;
  week: number;
  month: number;
  year: number;
}

interface RoutineCardProps {
  activity: RoutineActivity;
  stats: Stats;
  onSetDay: (hours: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RoutineCard({ activity, stats, onSetDay, onEdit, onDelete }: RoutineCardProps) {
  const [inputVal, setInputVal] = useState('');
  const [editing, setEditing] = useState(false);

  const pct = Math.min(100, (stats.week / activity.weeklyTargetHours) * 100);
  const remaining = Math.max(0, activity.weeklyTargetHours - stats.week);
  const done = stats.week >= activity.weeklyTargetHours;

  const handleSaveDay = () => {
    const h = parseFloat(inputVal);
    if (!isNaN(h) && h >= 0) onSetDay(h);
    setInputVal('');
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">{activity.icon}</span>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm leading-tight">{activity.name}</h3>
            <p className="text-xs text-slate-400">Target: {activity.weeklyTargetHours}h / week</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="text-slate-300 hover:text-slate-600 p-1 rounded transition-colors" title="Edit">✎</button>
          <button onClick={onDelete} className="text-slate-300 hover:text-red-400 p-1 rounded transition-colors" title="Delete">✕</button>
        </div>
      </div>

      {/* Weekly progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500">This week</span>
          <span className={`text-xs font-semibold ${done ? 'text-emerald-600' : 'text-slate-600'}`}>
            {stats.week.toFixed(1)}h / {activity.weeklyTargetHours}h
            {done && ' ✓'}
          </span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: done ? '#10b981' : activity.color,
            }}
          />
        </div>
        {!done && (
          <p className="text-xs text-slate-400 mt-1">{remaining.toFixed(1)}h to go</p>
        )}
      </div>

      {/* Today log */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
        <div>
          <p className="text-xs text-slate-400">Today</p>
          {editing ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                autoFocus
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveDay(); if (e.key === 'Escape') setEditing(false); }}
                className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="hrs"
              />
              <button onClick={handleSaveDay} className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-700">✓</button>
              <button onClick={() => setEditing(false)} className="text-xs text-slate-400 px-1 py-0.5 rounded hover:text-slate-600">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setInputVal(stats.today > 0 ? String(stats.today) : ''); setEditing(true); }}
              className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors mt-0.5"
            >
              {stats.today > 0 ? `${stats.today}h` : <span className="text-slate-300 font-normal text-xs">tap to log</span>}
            </button>
          )}
        </div>

        {/* Quick +0.5h buttons */}
        <div className="flex gap-1">
          {[0.5, 1, 1.5].map(inc => (
            <button
              key={inc}
              onClick={() => onSetDay(Math.round((stats.today + inc) * 2) / 2)}
              className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              +{inc}h
            </button>
          ))}
        </div>
      </div>

      {/* Monthly / Yearly */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-slate-400">This month</p>
          <p className="text-sm font-bold text-slate-700">{stats.month.toFixed(1)}h</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-slate-400">This year</p>
          <p className="text-sm font-bold text-slate-700">{stats.year.toFixed(1)}h</p>
        </div>
      </div>
    </div>
  );
}
