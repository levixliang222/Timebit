import type { Reminder } from '../types';

interface SmartRemindersProps {
  reminders: Reminder[];
  onDismiss: (id: string) => void;
}

const urgencyStyle = {
  high:   { bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500',    label: 'Urgent'  },
  medium: { bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500',  label: 'Soon'    },
  low:    { bg: 'bg-slate-50',  border: 'border-slate-200',  dot: 'bg-slate-400',  label: 'FYI'     },
};

export default function SmartReminders({ reminders, onDismiss }: SmartRemindersProps) {
  if (reminders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">✨</span>
          <h2 className="font-semibold text-slate-800 text-sm">Smart Reminders</h2>
        </div>
        <p className="text-xs text-slate-400 text-center py-3">All caught up! No reminders right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h2 className="font-semibold text-slate-800 text-sm">Smart Reminders</h2>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-medium">
          {reminders.length}
        </span>
      </div>

      <div className="space-y-2">
        {reminders.map(r => {
          const style = urgencyStyle[r.urgency];
          return (
            <div
              key={r.id}
              className={`flex items-start gap-2.5 rounded-lg p-2.5 border ${style.bg} ${style.border}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${style.dot}`} />
              <p className="flex-1 text-xs text-slate-700 leading-relaxed">{r.text}</p>
              <button
                onClick={() => onDismiss(r.id)}
                className="text-slate-400 hover:text-slate-600 text-xs flex-shrink-0 ml-1"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
