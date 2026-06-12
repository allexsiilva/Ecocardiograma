import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LaudoView from './views/LaudoView';
import PacientesView from './views/PacientesView';
import MedicosView from './views/MedicosView';
import ConveniosView from './views/ConveniosView';
import SistemaView from './views/SistemaView';
import LoginView from './views/LoginView';

export type ViewState = 'laudo' | 'pacientes' | 'medicos' | 'convenios' | 'sistema';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('laudo');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('@ecocardio-auth-token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('@ecocardio-auth-token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    try {
      const allData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('@ecocardio')) {
          allData[key] = localStorage.getItem(key) || '';
        }
      }

      const jsonStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_ecosistema_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Auto backup failed", error);
    }

    localStorage.removeItem('@ecocardio-auth-token');
    setToken(null);
  };

  if (!token) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto print:overflow-visible">
        {currentView === 'laudo' && <LaudoView />}
        {currentView === 'pacientes' && <PacientesView onChangeView={setCurrentView} />}
        {currentView === 'medicos' && <MedicosView />}
        {currentView === 'convenios' && <ConveniosView />}
        {currentView === 'sistema' && <SistemaView />}
      </main>
    </div>
  );
}

