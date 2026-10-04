import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface PinScreenProps {
  onSuccess: () => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const correctPin = import.meta.env.VITE_APP_PIN || '198112';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      localStorage.setItem('isAuthenticated', 'true');
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-8 h-8 text-blue-400" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Secure Access</h1>
          <p className="text-sm text-slate-400">
            Please enter the organization PIN code to view financial data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Enter PIN"
              className={`w-full bg-slate-950 border ${error ? 'border-rose-500' : 'border-slate-700'} rounded px-4 py-3 text-center text-xl tracking-widest text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
              autoFocus
            />
            {error && (
              <p className="text-rose-400 text-xs mt-2 text-left">Incorrect PIN. Please try again.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!pin}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
