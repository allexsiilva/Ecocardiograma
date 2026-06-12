import { useState, useEffect, FormEvent } from 'react';
import { Medico } from '../types';
import { Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';

export default function MedicosView() {
  const [medicos, setMedicos] = useState<Medico[]>(() => {
    const saved = localStorage.getItem('@ecocardio-medicos');
    return saved ? JSON.parse(saved) : [{ 
      id: '1', nome: 'Dr. Welington Baião', especialidade: 'Cardiologia', 
      registro1: 'RQE CE 14098', registro2: 'RQE PE 13386' 
    }];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Medico>>({
    nome: '', especialidade: '', registro1: '', registro2: ''
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Medico, boolean>>>({});

  useEffect(() => {
    localStorage.setItem('@ecocardio-medicos', JSON.stringify(medicos));
  }, [medicos]);

  const validateForm = () => {
    const errors: any = {};
    if (!formData.nome?.trim()) errors.nome = true;
    if (!formData.especialidade?.trim()) errors.especialidade = true;
    if (!formData.registro1?.trim()) errors.registro1 = true;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (formData.id) {
      setMedicos(medicos.map(m => m.id === formData.id ? { ...formData, id: m.id } as Medico : m));
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      setMedicos([{ ...formData, id: newId } as Medico, ...medicos]);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: '', especialidade: '', registro1: '', registro2: '' });
    setFormErrors({});
  };

  return (
    <div className="p-6 pt-20 lg:p-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Médicos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os médicos para assinatura dos laudos</p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={18} /> Novo Médico
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicos.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
              <button 
                onClick={() => { 
                  setFormData(m); 
                  setFormErrors({});
                  setIsModalOpen(true); 
                }} 
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
              >
                <Edit2 size={16} />
              </button>
              <button onClick={() => {
                if(confirm('Tem certeza?')) setMedicos(medicos.filter(x => x.id !== m.id));
              }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">
              {m.nome.charAt(0)}
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">{m.nome}</h3>
            <p className="text-sm text-slate-500 mb-4">{m.especialidade}</p>
            
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded inline-block mr-2">{m.registro1}</p>
              {m.registro2 && <p className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded inline-block">{m.registro2}</p>}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{formData.id ? 'Editar Médico' : 'Novo Médico'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-6">
              {Object.keys(formErrors).length > 0 && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>Preencha os campos obrigatórios.</span>
                </div>
              )}

              <form id="medico-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome <span className="text-rose-500">*</span></label>
                  <input 
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${formErrors.nome ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500'}`} 
                    value={formData.nome} 
                    onChange={e => {
                      setFormData({...formData, nome: e.target.value});
                      if (e.target.value.trim()) setFormErrors({...formErrors, nome: false});
                    }} 
                    placeholder="Ex: Dr. João Silva" 
                  />
                  {formErrors.nome && <p className="text-[10px] text-rose-500 mt-1">Nome é obrigatório</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Especialidade <span className="text-rose-500">*</span></label>
                  <input 
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${formErrors.especialidade ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500'}`} 
                    value={formData.especialidade} 
                    onChange={e => {
                      setFormData({...formData, especialidade: e.target.value});
                      if (e.target.value.trim()) setFormErrors({...formErrors, especialidade: false});
                    }} 
                    placeholder="Ex: Cardiologia" 
                  />
                  {formErrors.especialidade && <p className="text-[10px] text-rose-500 mt-1">Especialidade é obrigatória</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Registro 1 (CRM/RQE) <span className="text-rose-500">*</span></label>
                    <input 
                      className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none transition-colors ${formErrors.registro1 ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500'}`} 
                      value={formData.registro1} 
                      onChange={e => {
                        setFormData({...formData, registro1: e.target.value});
                        if (e.target.value.trim()) setFormErrors({...formErrors, registro1: false});
                      }} 
                    />
                    {formErrors.registro1 && <p className="text-[10px] text-rose-500 mt-1">Registro principal é obrigatório</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Registro 2 (Opcional)</label>
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" value={formData.registro2} onChange={e => setFormData({...formData, registro2: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancelar</button>
              <button type="submit" form="medico-form" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Salvar Médico</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
