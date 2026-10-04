import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

export const LoginScreen: React.FC = () => {
  const { instance, inProgress } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((e) => {
      console.error(e);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Balances Web</h1>
          <p className="text-sm text-slate-400">
            Please sign in with your corporate Microsoft 365 account to securely access the organization's financial data.
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={inProgress !== 'none'}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {inProgress !== 'none' ? (
            <span className="animate-pulse">Connecting...</span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 21 21">
                <path fill="#f35325" d="M1 1h9v9H1z"/>
                <path fill="#81bc06" d="M11 1h9v9h-9z"/>
                <path fill="#05a6f0" d="M1 11h9v9H1z"/>
                <path fill="#ffba08" d="M11 11h9v9h-9z"/>
              </svg>
              Sign in with Microsoft
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-500 pt-4 border-t border-slate-800">
          Access is restricted to authorized personnel only. 
          All activities are logged and monitored.
        </p>
      </div>
    </div>
  );
};
