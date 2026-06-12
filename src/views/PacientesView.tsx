import React, { useState, useEffect, FormEvent } from 'react';
import { Paciente, LaudoSalvo } from '../types';
import { Plus, Trash2, Edit2, Search, AlertCircle, History, X, Calendar, FileText } from 'lucide-react';

import { ViewState } from '../App';

interface PacientesViewProps {
  onChangeView?: (view: ViewState) => void;
}

export default function PacientesView({ onChangeView }: PacientesViewProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>(() => {
    const saved = localStorage.getItem('@ecocardio-pacientes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<Paciente>>({
    nome: '', idade: '', sexo: '', peso: '', altura: '', supCorporea: '', solicitante: '', convenioId: ''
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Paciente, boolean>>>({});

  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [laudosDoPaciente, setLaudosDoPaciente] = useState<{recentes: LaudoSalvo[], antigos: LaudoSalvo[]}>({ recentes: [], antigos: [] });
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('@ecocardio-pacientes', JSON.stringify(pacientes));
  }, [pacientes]);

  const validateForm = () => {
    const errors: any = {};
    if (!formData.nome?.trim()) errors.nome = true;
    if (!formData.idade?.trim()) errors.idade = true;
    if (!formData.sexo?.trim()) errors.sexo = true;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (formData.id) {
      setPacientes(pacientes.map(p => p.id === formData.id ? { ...formData, id: p.id } as Paciente : p));
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      setPacientes([{ ...formData, id: newId } as Paciente, ...pacientes]);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: '', idade: '', sexo: '', peso: '', altura: '', supCorporea: '', solicitante: '', convenioId: '' });
    setFormErrors({});
  };

  const handleEdit = (paciente: Paciente) => {
    setFormData(paciente);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleVerHistorico = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    
    // Load laudos from local storage
    const saved = localStorage.getItem('@ecocardio-laudos');
    let todosOsLaudos: LaudoSalvo[] = saved ? JSON.parse(saved) : [];
    
    // Filter by patient ID
    const laudosPaciente = todosOsLaudos.filter(l => l.pacienteId === paciente.id);
    
    // Sort by date descending
    laudosPaciente.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const recentes = laudosPaciente.filter(l => new Date(l.data) >= trintaDiasAtras);
    const antigos = laudosPaciente.filter(l => new Date(l.data) < trintaDiasAtras);

    setDataInicio('');
    setDataFim('');
    setLaudosDoPaciente({ recentes, antigos });
    setIsHistoricoOpen(true);
  };

  const handleEditarLaudo = (laudo: LaudoSalvo) => {
    localStorage.setItem('@ecocardio-editing-laudo', JSON.stringify(laudo));
    setIsHistoricoOpen(false);
    if (onChangeView) {
      onChangeView('laudo');
    }
  };

  const handleExcluirLaudo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Tem certeza que deseja excluir este laudo?')) {
      const saved = localStorage.getItem('@ecocardio-laudos');
      if (saved) {
        let todosOsLaudos: LaudoSalvo[] = JSON.parse(saved);
        todosOsLaudos = todosOsLaudos.filter(l => l.id !== id);
        localStorage.setItem('@ecocardio-laudos', JSON.stringify(todosOsLaudos));
        
        if (pacienteSelecionado) {
          // manually refresh state lists
          const laudosPaciente = todosOsLaudos.filter(l => l.pacienteId === pacienteSelecionado.id);
          laudosPaciente.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          const trintaDiasAtras = new Date();
          trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
          setLaudosDoPaciente({
            recentes: laudosPaciente.filter(l => new Date(l.data) >= trintaDiasAtras),
            antigos: laudosPaciente.filter(l => new Date(l.data) < trintaDiasAtras)
          });
        }
      }
    }
  };

  const handleDelete = (id: string) => {
    if(confirm('Tem certeza que deseja excluir esse paciente?')) {
      setPacientes(pacientes.filter(p => p.id !== id));
    }
  };

  const filtered = pacientes.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredRecentes = laudosDoPaciente.recentes.filter(laudo => {
    const lDate = new Date(laudo.data);
    if (dataInicio && lDate < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && lDate > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  const filteredAntigos = laudosDoPaciente.antigos.filter(laudo => {
    const lDate = new Date(laudo.data);
    if (dataInicio && lDate < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && lDate > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div className="p-6 pt-20 lg:p-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie o cadastro de pacientes</p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={18} /> Novo Paciente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Idade</th>
                <th className="px-6 py-4 font-medium">Sexo</th>
                <th className="px-6 py-4 font-medium">Convênio</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Nenhum paciente encontrado.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{p.nome}</td>
                    <td className="px-6 py-4 text-slate-600">{p.idade}</td>
                    <td className="px-6 py-4 text-slate-600">{p.sexo}</td>
                    <td className="px-6 py-4 text-slate-600">{p.convenioId || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleVerHistorico(p)} className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors" title="Ver Histórico">
                          <History size={16} />
                        </button>
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors" title="Excluir">
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{formData.id ? 'Editar Paciente' : 'Novo Paciente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {Object.keys(formErrors).length > 0 && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>Por favor, preencha todos os campos obrigatórios destacados em vermelho.</span>
                </div>
              )}

              <form id="paciente-form" onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo <span className="text-rose-500">*</span></label>
                  <input 
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors ${formErrors.nome ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'}`} 
                    value={formData.nome} 
                    onChange={e => {
                      setFormData({...formData, nome: e.target.value});
                      if (e.target.value.trim()) setFormErrors({...formErrors, nome: false});
                    }} 
                  />
                  {formErrors.nome && <p className="text-[10px] text-rose-500 mt-1">Nome é obrigatório</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Idade <span className="text-rose-500">*</span></label>
                  <input 
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${formErrors.idade ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500'}`} 
                    value={formData.idade} 
                    onChange={e => {
                      setFormData({...formData, idade: e.target.value});
                      if (e.target.value.trim()) setFormErrors({...formErrors, idade: false});
                    }} 
                  />
                  {formErrors.idade && <p className="text-[10px] text-rose-500 mt-1">Idade é obrigatória</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sexo <span className="text-rose-500">*</span></label>
                  <input 
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${formErrors.sexo ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500'}`} 
                    value={formData.sexo} 
                    onChange={e => {
                      setFormData({...formData, sexo: e.target.value});
                      if (e.target.value.trim()) setFormErrors({...formErrors, sexo: false});
                    }} 
                  />
                  {formErrors.sexo && <p className="text-[10px] text-rose-500 mt-1">Sexo é obrigatório</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Peso</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Altura</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sup. Corpórea</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.supCorporea} onChange={e => setFormData({...formData, supCorporea: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Convênio (Nome)</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.convenioId} onChange={e => setFormData({...formData, convenioId: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Solicitante</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.solicitante} onChange={e => setFormData({...formData, solicitante: e.target.value})} />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 mt-auto">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancelar</button>
              <button type="submit" form="paciente-form" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Salvar Paciente</button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico Modal */}
      {isHistoricoOpen && pacienteSelecionado && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <History className="text-indigo-600" size={24} />
                <div>
                  <h3 className="font-bold text-slate-800">Histórico de Laudos</h3>
                  <p className="text-xs text-slate-500">Paciente: {pacienteSelecionado.nome}</p>
                </div>
              </div>
              <button onClick={() => setIsHistoricoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-slate-50/30">
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data Início</label>
                  <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data Fim</label>
                  <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                {(dataInicio || dataFim) && (
                  <button onClick={() => { setDataInicio(''); setDataFim(''); }} className="text-sm text-slate-500 hover:text-rose-500 py-2 px-3 font-medium transition-colors shrink-0">
                    Limpar Filtros
                  </button>
                )}
              </div>

              {/* Recentes */}
              <div>
                <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <Calendar size={18} className="text-emerald-500" />
                  Laudos Recentes (Últimos 30 dias)
                </h4>
                {filteredRecentes.length === 0 ? (
                  <p className="text-sm text-slate-400 bg-white p-4 rounded-xl border border-slate-100 italic">Nenhum laudo recente encontrado para este filtro.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredRecentes.map(laudo => (
                      <div key={laudo.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 transition-colors group flex items-start justify-between gap-3">
                         <div className="flex gap-3">
                           <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg shrink-0 group-hover:bg-emerald-100 transition-colors">
                             <FileText size={20} />
                           </div>
                           <div>
                              <p className="font-medium text-slate-800 text-sm">{new Date(laudo.data).toLocaleDateString('pt-BR')} às {new Date(laudo.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                {laudo.conclusao || "Sem conclusão registrada."}
                              </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); handleEditarLaudo(laudo); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors" title="Carregar no Preenchedor">
                             <Edit2 size={16} />
                           </button>
                           <button onClick={(e) => handleExcluirLaudo(laudo.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors" title="Excluir">
                             <Trash2 size={16} />
                           </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-slate-200" />

              {/* Antigos */}
              <div>
                <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <Calendar size={18} className="text-slate-400" />
                  Histórico Passado
                </h4>
                {filteredAntigos.length === 0 ? (
                  <p className="text-sm text-slate-400 bg-white p-4 rounded-xl border border-slate-100 italic">Nenhum laudo antigo encontrado para este filtro.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredAntigos.map(laudo => (
                      <div key={laudo.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors group flex items-start justify-between gap-3 opacity-90">
                         <div className="flex gap-3">
                           <div className="bg-slate-100 text-slate-500 p-2 rounded-lg shrink-0 group-hover:bg-slate-200 transition-colors">
                             <FileText size={20} />
                           </div>
                           <div>
                              <p className="font-medium text-slate-800 text-sm">{new Date(laudo.data).toLocaleDateString('pt-BR')} às {new Date(laudo.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                {laudo.conclusao || "Sem conclusão registrada."}
                              </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); handleEditarLaudo(laudo); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors" title="Carregar no Preenchedor">
                             <Edit2 size={16} />
                           </button>
                           <button onClick={(e) => handleExcluirLaudo(laudo.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors" title="Excluir">
                             <Trash2 size={16} />
                           </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
