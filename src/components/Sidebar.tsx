import { HeartPulse, FileText, Users, Stethoscope, Building2, Menu, X, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: 'laudo' | 'pacientes' | 'medicos' | 'convenios' | 'sistema') => void;
  onLogout: () => void;
}

export default function Sidebar({ currentView, onChangeView, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'laudo', label: 'Emitir Laudo', icon: FileText },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'medicos', label: 'Médicos', icon: Stethoscope },
    { id: 'convenios', label: 'Convênios', icon: Building2 },
    { id: 'sistema', label: 'Sistema', icon: Settings },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="print:hidden lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div 
          className="print:hidden fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        print:hidden overflow-y-auto z-50
        fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <HeartPulse size={28} className="text-indigo-400" />
            <span className="text-xl font-bold tracking-tight">EcoSistema</span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu Principal</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id as any);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <Stethoscope size={20} className="text-slate-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Painel Médico</span>
              <span className="text-xs text-slate-500">Versão 1.0</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-slate-500 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
            title="Sair do sistema"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>
    </>
  );
}
