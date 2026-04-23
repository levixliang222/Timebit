import { useState } from 'react';
import { format } from 'date-fns';
import type { RoutineActivity } from '../types';
import type { FamilyMember } from '../types';
import { useRoutines } from '../hooks/useRoutines';
import RoutineCard from './RoutineCard';
import EditRoutineModal from './EditRoutineModal';

interface RoutineTrackerProps {
  kids: FamilyMember[];
}

export default function RoutineTracker({ kids }: RoutineTrackerProps) {
  const [activeMemberId, setActiveMemberId] = useState(kids[0]?.id ?? '');
  const [editingActivity, setEditingActivity] = useState<RoutineActivity | null | undefined>(undefined);
  // undefined = modal closed, null = adding new, RoutineActivity = editing existing

  const {
    getMemberActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    setDayHours,
    getStats,
  } = useRoutines();

  const activeMember = kids.find(k => k.id === activeMemberId);
  const activities = getMemberActivities(activeMemberId);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Summary totals for the active member
  const totalWeekTarget = activities.reduce((s, a) => s + a.weeklyTargetHours, 0);
  const totalWeekDone = activities.reduce((s, a) => s + getStats(a.id).week, 0);
  const totalToday = activities.reduce((s, a) => s + getStats(a.id).today, 0);
  const totalMonth = activities.reduce((s, a) => s + getStats(a.id).month, 0);
  const totalYear = activities.reduce((s, a) => s + getStats(a.id).year, 0);
  const overallPct = totalWeekTarget > 0 ? Math.min(100, (totalWeekDone / totalWeekTarget) * 100) : 0;

  const handleSave = (act: RoutineActivity) => {
    if (editingActivity === null) {
      addActivity(act);
    } else if (editingActivity) {
      updateActivity(act);
    }
    setEditingActivity(undefined);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold text-slate-800 m-0">Routines</h1>
            <p className="text-xs text-slate-400 m-0">Daily habits & weekly targets</p>
          </div>
          {/* Kid tabs */}
          <div className="flex gap-2">
            {kids.map(k => (
              <button
                key={k.id}
                onClick={() => setActiveMemberId(k.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeMemberId === k.id
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={activeMemberId === k.id ? { backgroundColor: k.color } : {}}
              >
                <span>{k.avatar}</span>
                <span>{k.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary bar */}
        {activeMember && (
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-500">
                  {activeMember.name}'s week — {totalWeekDone.toFixed(1)}h of {totalWeekTarget}h target
                </span>
                <span className="text-xs font-bold" style={{ color: activeMember.color }}>
                  {overallPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallPct}%`, backgroundColor: activeMember.color }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-center flex-shrink-0">
              <div>
                <p className="text-xs text-slate-400">Today</p>
                <p className="text-sm font-bold text-slate-700">{totalToday.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Month</p>
                <p className="text-sm font-bold text-slate-700">{totalMonth.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Year</p>
                <p className="text-sm font-bold text-slate-700">{totalYear.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-medium">No activities yet</p>
            <p className="text-xs mt-1">Add some to start tracking</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activities.map(act => (
              <RoutineCard
                key={act.id}
                activity={act}
                stats={getStats(act.id)}
                onSetDay={hours => setDayHours(act.id, act.memberId, today, hours)}
                onEdit={() => setEditingActivity(act)}
                onDelete={() => {
                  if (confirm(`Delete "${act.name}"?`)) deleteActivity(act.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Add activity button */}
        <button
          onClick={() => setEditingActivity(null)}
          className="mt-4 flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add activity for {activeMember?.name}
        </button>
      </div>

      {/* Edit / Add modal */}
      {editingActivity !== undefined && (
        <EditRoutineModal
          memberId={activeMemberId}
          activity={editingActivity ?? undefined}
          onSave={handleSave}
          onClose={() => setEditingActivity(undefined)}
        />
      )}
    </div>
  );
}
