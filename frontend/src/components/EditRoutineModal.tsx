import { useState } from 'react';
import type { RoutineActivity } from '../types';

interface EditRoutineModalProps {
  memberId: string;
  activity?: RoutineActivity;
  onSave: (activity: RoutineActivity) => void;
  onClose: () => void;
}

const ICON_OPTIONS = ['📚','🔢','🈶','🦉','🥋','♟️','🎨','🎵','🏃','🏊','⚽','🎾','🖥️','📖','✏️','🔬','🌍','🎭'];
const COLOR_OPTIONS = ['#6366f1','#0ea5e9','#f59e0b','#10b981','#8b5cf6','#ec4899','#ef4444','#64748b','#f97316','#14b8a6'];

export default function EditRoutineModal({ memberId, activity, onSave, onClose }: EditRoutineModalProps) {
  const [name, setName] = useState(activity?.name ?? '');
  const [icon, setIcon] = useState(activity?.icon ?? '📚');
  const [color, setColor] = useState(activity?.color ?? '#6366f1');
  const [weeklyTarget, setWeeklyTarget] = useState(activity?.weeklyTargetHours ?? 3);

  const isEdit = !!activity;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: activity?.id ?? `act-${Date.now()}`,
      memberId,
      name: name.trim(),
      icon,
      color,
      weeklyTargetHours: weeklyTarget,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {isEdit ? 'Edit Activity' : 'Add Activity'}
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Activity name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. Piano"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    icon === ic ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Weekly target */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Weekly target: <span className="text-indigo-600 font-bold">{weeklyTarget}h</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={weeklyTarget}
              onChange={e => setWeeklyTarget(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>0.5h</span><span>20h</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">{name || 'Activity name'}</p>
            <p className="text-xs text-slate-400">{weeklyTarget}h / week</p>
          </div>
          <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm border border-slate-200 rounded-lg py-2 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 text-sm bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isEdit ? 'Save changes' : 'Add activity'}
          </button>
        </div>
      </div>
    </div>
  );
}
