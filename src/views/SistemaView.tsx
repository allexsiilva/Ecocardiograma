import React, { useState } from 'react';
import { DatabaseBackup, UploadCloud, ShieldAlert, CheckCircle, Lock, Save, Image as ImageIcon, Trash2, KeyRound } from 'lucide-react';

export default function SistemaView() {
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [newToken, setNewToken] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [logo, setLogo] = useState(() => localStorage.getItem('@ecocardio-logo') || '');

  const showNotification = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleBackup = () => {
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
      
      showNotification('Backup realizado com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Erro ao gerar backup.', 'error');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('Atenção: A restauração substituirá todos os dados atuais. Deseja continuar?')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsedData = JSON.parse(content);
          
          if (typeof parsedData !== 'object' || parsedData === null) {
            throw new Error('Formato inválido.');
          }

          // Salva chaves atuais para não apagar nada fora do escopo se necessário, mas talvez devamos limpar
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('@ecocardio')) {
              localStorage.removeItem(key);
            }
          }

          for (const key in parsedData) {
            if (key.startsWith('@ecocardio')) {
              localStorage.setItem(key, parsedData[key]);
            }
          }

          showNotification('Backup restaurado com sucesso! Recarregando sistema...', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error(error);
          showNotification('Arquivo de backup inválido ou corrompido.', 'error');
        }
      };
      reader.readAsText(file);
    }
    
    // reset input
    e.target.value = '';
  };

  const handleChangeToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) {
      showNotification('Informe um novo token válido.', 'error');
      return;
    }
    localStorage.setItem('@ecocardio-master-token', newToken.trim());
    setNewToken('');
    showNotification('Token alterado com sucesso! Use o novo token no próximo acesso.', 'success');
  };

  const handleChangePhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) {
      showNotification('Informe uma palavra-chave válida.', 'error');
      return;
    }
    localStorage.setItem('@ecocardio-recovery-phrase', newPhrase.trim());
    setNewPhrase('');
    showNotification('Palavra-chave alterada com sucesso!', 'success');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification('A imagem deve ter no máximo 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      localStorage.setItem('@ecocardio-logo', base64);
      setLogo(base64);
      showNotification('Logotipo atualizado com sucesso!', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem('@ecocardio-logo');
    setLogo('');
    showNotification('Logotipo removido.', 'success');
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto min-h-screen">
      {showToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium print:hidden ${showToast.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'}`}>
          <CheckCircle size={18} />
          {showToast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Sistema</h1>
        <p className="text-slate-500 mt-1">Gerencie os dados e configurações do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-50 p-6 border-b border-slate-200">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-indigo-600">
              <DatabaseBackup size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Fazer Backup</h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Exporte todos os pacientes, laudos, médicos e convênios para um único arquivo seguro.
            </p>
          </div>
          <div className="p-6">
            <button
              onClick={handleBackup}
              className="w-full bg-indigo-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <DatabaseBackup size={18} />
              Gerar Arquivo de Backup
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-rose-50 p-6 border-b border-slate-200">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-rose-600">
              <UploadCloud size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Restaurar Dados</h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Importe um arquivo de backup previamente gerado. Atenção: isso substituirá os dados atuais.
            </p>
          </div>
          <div className="p-6">
            <label className="w-full bg-white text-rose-600 border border-rose-200 font-medium py-2.5 px-4 rounded-lg hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 cursor-pointer cursor-allowed relative overflow-hidden">
              <UploadCloud size={18} />
              Selecionar Arquivo
              <input 
                type="file" 
                accept="application/json" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleRestore}
              />
            </label>
            <div className="mt-4 flex items-start gap-2 text-xs text-rose-600/80 bg-rose-50 p-3 rounded-lg">
              <ShieldAlert size={16} className="shrink-0" />
              <p>Esta ação é irreversível. Certifique-se de estar importando o arquivo correto.</p>
            </div>
          </div>
        </div>

        {/* Change Token Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
          <div className="bg-amber-50 p-6 border-b border-slate-200">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-amber-600">
              <Lock size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Alterar Token de Acesso</h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Mude a senha (token numérico) de acesso ao sistema.
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleChangeToken} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="Novo token numérico..."
                  className="pl-10 w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="bg-amber-500 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar Token
              </button>
            </form>
          </div>
        </div>

        {/* Change Phrase Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
          <div className="bg-emerald-50 p-6 border-b border-slate-200">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-emerald-600">
              <KeyRound size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Palavra-chave de Recuperação</h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Configure uma palavra-chave secreta que será usada para recuperar seu token caso você o esqueça.
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleChangePhrase} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  placeholder="Nova palavra-chave de recuperação..."
                  className="pl-10 w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-500 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar Palavra
              </button>
            </form>
          </div>
        </div>

        {/* Custom Logo Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
          <div className="bg-teal-50 p-6 border-b border-slate-200 flex justify-between items-start">
            <div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-teal-600">
                <ImageIcon size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Logotipo do Cabeçalho</h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Adicione um logotipo personalizado (máx: 2MB) para aparecer no cabeçalho do laudo.
              </p>
            </div>
            {logo && (
              <div className="h-20 w-40 flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                <img src={logo} alt="Logotipo" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
          <div className="p-6 flex flex-col sm:flex-row gap-4">
             <label className="flex-1 bg-white text-teal-600 border border-teal-200 font-medium py-2.5 px-4 rounded-lg hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden">
               <UploadCloud size={18} />
               {logo ? "Trocar Imagem" : "Selecionar Imagem..."}
               <input 
                 type="file" 
                 accept="image/*" 
                 className="absolute inset-0 opacity-0 cursor-pointer"
                 onChange={handleLogoUpload}
               />
             </label>
             {logo && (
               <button
                 onClick={handleRemoveLogo}
                 className="bg-rose-50 text-rose-600 font-medium py-2.5 px-6 rounded-lg hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 border border-rose-100"
               >
                 <Trash2 size={18} />
                 Remover
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
