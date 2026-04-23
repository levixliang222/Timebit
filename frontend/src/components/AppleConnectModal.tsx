import { useState } from 'react';
import type { FamilyMember } from '../types';

interface AppleConnectModalProps {
  member: FamilyMember;
  onConnect: (appleId: string, appPassword: string) => Promise<void>;
  onClose: () => void;
}

export default function AppleConnectModal({ member, onConnect, onClose }: AppleConnectModalProps) {
  const [appleId, setAppleId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!appleId.trim() || !appPassword.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onConnect(appleId.trim(), appPassword.trim());
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
            <AppleIcon />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Connect Apple Calendar</h2>
            <p className="text-xs text-slate-500">{member.avatar} {member.name}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Explainer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 leading-relaxed">
            <p className="font-semibold mb-1">How to get an App-Specific Password:</p>
            <ol className="list-decimal ml-3 space-y-0.5">
              <li>Go to <span className="font-mono">appleid.apple.com</span></li>
              <li>Sign in → Security → App-Specific Passwords</li>
              <li>Click <span className="font-semibold">+</span> and label it "Timebit"</li>
              <li>Copy the generated password and paste below</li>
            </ol>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Apple ID (email)</label>
            <input
              type="email"
              value={appleId}
              onChange={e => setAppleId(e.target.value)}
              placeholder="name@icloud.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">App-Specific Password</label>
            <input
              type="password"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm border border-slate-200 rounded-xl py-2.5 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={loading || !appleId.trim() || !appPassword.trim()}
            className="flex-1 text-sm bg-slate-900 text-white rounded-xl py-2.5 font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 814 1000" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-38.8-155.5-109.2C46.3 733.9 1 508.4 1 385.8c0-182.8 119.4-279.5 236.7-279.5 61.2 0 112.3 40.8 150.1 40.8 36 0 92.7-43.2 161.8-43.2 25.7 0 108.2 2.6 168.6 76.1zm-87.3-188c26.9-32.7 45.9-77.6 45.9-122.5 0-6.5-.6-13-1.9-18.3C698.6 13 622.2 59.5 576.8 104.9c-23.8 25.1-46.5 70-46.5 114.9 0 7.1 1.3 14.2 1.9 16.5 2.6.6 6.5 1.3 10.4 1.3 42.8 0 119.4-44.2 145.2-84.7z"/>
    </svg>
  );
}
