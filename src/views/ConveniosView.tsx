import { useState, useEffect, FormEvent } from 'react';
import { Convenio } from '../types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function ConveniosView() {
  const [convenios, setConvenios] = useState<Convenio[]>(() => {
    const saved = localStorage.getItem('@ecocardio-convenios');
    return saved ? JSON.parse(saved) : [
      { id: '1', nome: 'Unimed' },
      { id: '2', nome: 'Bradesco Saúde' },
      { id: '3', nome: 'SulAmérica' },
      { id: '4', nome: 'Particular' }
    ];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Convenio>>({ nome: '' });

  useEffect(() => {
    localStorage.setItem('@ecocardio-convenios', JSON.stringify(convenios));
  }, [convenios]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nome) return;

    if (formData.id) {
      setConvenios(convenios.map(c => c.id === formData.id ? { ...formData, id: c.id } as Convenio : c));
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      setConvenios([{ ...formData, id: newId } as Convenio, ...convenios]);
    }
    
    setIsModalOpen(false);
    setFormData({ nome: '' });
  };

  return (
    <div className="p-6 pt-20 lg:p-8 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Convênios</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os convênios aceitos</p>
        </div>
        
        <button 
          onClick={() => { setFormData({nome: ''}); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={18} /> Novo Convênio
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Nome do Convênio</th>
              <th className="px-6 py-4 font-medium text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {convenios.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-8 text-slate-400">Nenhum convênio cadastrado.</td></tr>
            ) : (
              convenios.map(c => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{c.nome}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setFormData(c); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => {
                        if(confirm('Tem certeza?')) setConvenios(convenios.filter(x => x.id !== c.id));
                      }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{formData.id ? 'Editar Convênio' : 'Novo Convênio'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-6">
              <form id="convenio-form" onSubmit={handleSave}>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Convênio</label>
                <input 
                  required autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                  value={formData.nome} 
                  onChange={e => setFormData({...formData, nome: e.target.value})} 
                />
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancelar</button>
              <button type="submit" form="convenio-form" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Salvar Convênio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
