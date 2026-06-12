import React, { useState } from 'react';
import { HeartPulse, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginViewProps {
  onLogin: (token: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Por favor, informe o token de acesso.');
      return;
    }
    
    // Validate token against localStorage or default '123'
    const validToken = localStorage.getItem('@ecocardio-master-token') || '123';
    
    if (token !== validToken) {
      setError('Token de acesso incorreto.');
      return;
    }

    setError('');
    onLogin(token);
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPhrase = localStorage.getItem('@ecocardio-recovery-phrase') || 'ecocardio';
    
    if (recoveryPhrase.trim().toLowerCase() === storedPhrase.toLowerCase()) {
      const storedToken = localStorage.getItem('@ecocardio-master-token') || '123';
      setRecoveryMessage(`Seu token atual é: ${storedToken}`);
      setError('');
    } else {
      setRecoveryMessage('');
      setError('Palavra-chave incorreta.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <HeartPulse size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center">EcoSistema</h1>
          <h2 className="text-lg font-bold text-slate-700 text-center mt-1">Dr. Welington Baião</h2>
          <p className="text-indigo-600 font-medium text-sm mt-1">Cardiologia</p>
          <p className="text-slate-500 text-sm mt-4 text-center">
            {isRecovering ? 'Recuperação de Acesso.' : 'Acesso restrito. Informe seu token para entrar.'}
          </p>
        </div>

        {!isRecovering ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Token Numérico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="****"
                  className="pl-10 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Entrar no Sistema
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => { setIsRecovering(true); setError(''); setRecoveryMessage(''); setRecoveryPhrase(''); }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Esqueceu o token?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRecover} className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>Se você não configurou uma palavra-chave no sistema, a palavra de recuperação padrão é <strong>ecocardio</strong>.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Palavra-chave de recuperação
              </label>
              <input
                type="text"
                value={recoveryPhrase}
                onChange={(e) => setRecoveryPhrase(e.target.value)}
                placeholder="Insira a palavra secreta..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
              />
              {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
            </div>

            {recoveryMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg text-center font-medium text-lg">
                {recoveryMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Recuperar Token
            </button>

            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => { setIsRecovering(false); setError(''); }}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={16} />
                Voltar para o login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
