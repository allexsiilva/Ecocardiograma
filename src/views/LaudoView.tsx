import { useState, useEffect, useRef } from 'react';
import { Printer, HeartPulse, FileDown, Save, CheckCircle, MessageCircle } from 'lucide-react';
import { Paciente, Medico, LaudoSalvo } from '../types';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

const parametrosEsquerda = [
  'Aorta', 'AE', 'Rel. AE/AO', 'Vol. AE', 'Septo', 'Parede', 'Rel. Septo/Parede',
  'DdVe', 'DsVE', 'VDF', 'VSF', 'VS', 'Onda A Mitral', 'Onda E Mitral'
];

const parametrosDireita = [
  "Onda e' Lateral", "Onda e' Septal", "Rel. E/A", "Rel. E/e' Lateral", 
  "Rel. E/e' Septal", "Rel. E/e' Média", "FE (Teichholz)", "FE (Simpson)", 
  "Fração Encurtamento", "Massa VE", "TAPSE", "Indice de Massa VE", 
  "Espessura Relativa", "Pressão Cap. Pulm."
];

const observacoesIniciais = `Paciente em ritmo regular

Ventrículo esquerdo de tamanho normal, paredes de espessura normal, movimento paradoxal do SIV ( pós-pericardiotomia ), sem alterações da contratilidade segmentar, apresenta os parâmetros de função sistólica global conservados.

Função diastólica normal (razão de variáveis alteradas e presentes < 50%).

Átrio esquerdo de dimensões normais.

Raiz da aorta de diâmetro normal.

Ventrículo direito de dimensões normais (avaliação bidimensional).
Átrio direito de tamanho normal.

Valva mitral com folhetos de espessura normal, sem sinais de estenose ou refluxo significativos ao estudo com Doppler.
Valva tricúspide com folhetos de espessura normal, sem sinais de estenose ou refluxo significativos ao estudo com Doppler.
Valva aórtica com cúspides de espessura normal, sem sinais de estenose ou refluxo significativos ao estudo com Doppler.
Valva pulmonar morfologicamente normal, sem sinais de estenose ou refluxo significativos ao estudo com Doppler.

Pericárdio normal.

Análise sequencial segmentar:
Situs sollitus, levocardia, concordância AV e VA, septos íntegros, sem shunts residuais`;

export default function LaudoView() {
  const [paciente, setPaciente] = useState<Partial<Paciente>>({
    nome: '', idade: '', sexo: '', dataExame: '',
    peso: '', altura: '', supCorporea: '',
    solicitante: '', convenioId: ''
  });

  const [valoresParams, setValoresParams] = useState<Record<string, {valor: string, ref: string}>>({});
  const [observacoes, setObservacoes] = useState(observacoesIniciais);
  const [conclusao, setConclusao] = useState('');

  const [dbPacientes, setDbPacientes] = useState<Paciente[]>([]);
  const [dbMedicos, setDbMedicos] = useState<Medico[]>([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState<Medico | null>(null);

  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const latestDataRef = useRef({
    paciente,
    valoresParams,
    observacoes,
    conclusao,
    medicoSelecionado
  });

  useEffect(() => {
    latestDataRef.current = { paciente, valoresParams, observacoes, conclusao, medicoSelecionado };
  }, [paciente, valoresParams, observacoes, conclusao, medicoSelecionado]);

  useEffect(() => {
    const timer = setInterval(() => {
      const data = latestDataRef.current;
      if (data.paciente.nome || Object.keys(data.valoresParams).length > 0 || data.conclusao || data.observacoes !== observacoesIniciais) {
        localStorage.setItem('@ecocardio-laudo-autosave', JSON.stringify(data));
      }
    }, 30000); // 30 segundos
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedPacientes = localStorage.getItem('@ecocardio-pacientes');
    const savedMedicos = localStorage.getItem('@ecocardio-medicos');
    
    let parsedPacientes: Paciente[] = [];
    if (savedPacientes) {
      parsedPacientes = JSON.parse(savedPacientes);
      setDbPacientes(parsedPacientes);
    }
    
    let parsedMedicos: Medico[] = [];
    if (savedMedicos) {
      parsedMedicos = JSON.parse(savedMedicos);
      setDbMedicos(parsedMedicos);
    } else {
      parsedMedicos = [{
        id: '0', nome: 'Dr. Welington Baião', especialidade: 'Cardiologia',
        registro1: 'RQE CE 14098', registro2: 'RQE PE 13386'
      }];
      setMedicoSelecionado(parsedMedicos[0]);
    }

    const editingLaudoStr = localStorage.getItem('@ecocardio-editing-laudo');
    if (editingLaudoStr) {
      const laudo = JSON.parse(editingLaudoStr) as LaudoSalvo;
      const p = parsedPacientes.find(x => x.id === laudo.pacienteId);
      if (p) {
        setPaciente({
          ...p,
          dataExame: new Date(laudo.data).toLocaleDateString('pt-BR')
        });
      }
      setValoresParams(laudo.valoresParams || {});
      setObservacoes(laudo.observacoes || observacoesIniciais);
      setConclusao(laudo.conclusao || '');
      
      const m = parsedMedicos.find(x => x.id === laudo.medicoId);
      if (m) setMedicoSelecionado(m);
      else if (parsedMedicos.length > 0) setMedicoSelecionado(parsedMedicos[0]);

      localStorage.removeItem('@ecocardio-editing-laudo');
    } else {
      const autoSaveStr = localStorage.getItem('@ecocardio-laudo-autosave');
      if (autoSaveStr) {
        try {
          const autoSaveData = JSON.parse(autoSaveStr);
          if (autoSaveData.paciente) setPaciente(autoSaveData.paciente);
          if (autoSaveData.valoresParams) setValoresParams(autoSaveData.valoresParams);
          if (autoSaveData.observacoes) setObservacoes(autoSaveData.observacoes);
          if (autoSaveData.conclusao) setConclusao(autoSaveData.conclusao);
          if (autoSaveData.medicoSelecionado) {
            const m = parsedMedicos.find(x => x.id === autoSaveData.medicoSelecionado.id);
            if (m) setMedicoSelecionado(m);
            else setMedicoSelecionado(autoSaveData.medicoSelecionado);
          }
        } catch (e) {
          console.error(e);
        }
      } else if (parsedMedicos.length > 0) {
        setMedicoSelecionado(parsedMedicos[0]);
      }
    }
  }, []);

  const handlePreencherPaciente = (id: string) => {
    if (!id) return;
    const p = dbPacientes.find(x => x.id === id);
    if (p) {
      setPaciente({
        ...p,
        dataExame: new Date().toLocaleDateString('pt-BR')
      });
    }
  };

  const handleSelectMedico = (id: string) => {
    const m = dbMedicos.find(x => x.id === id);
    if (m) setMedicoSelecionado(m);
  };

  const handleParamChange = (param: string, field: 'valor' | 'ref', value: string) => {
    setValoresParams(prev => ({
      ...prev,
      [param]: { ...prev[param], [field]: value }
    }));
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const laudoRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      showNotification("A impressão foi bloqueada pelo navegador. Tente abrir o sistema em uma nova guia.", "error");
    }
  };

  const handleDownloadPdf = async () => {
    if (!laudoRef.current) return;
    showNotification("Gerando PDF, aguarde...", "success");
    
    try {
      const dataUrl = await htmlToImage.toPng(laudoRef.current, {
        quality: 1,
        pixelRatio: 2, // High resolution
        style: {
          transform: 'none',
          boxShadow: 'none',
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Get image dimensions to preserve aspect ratio
      const imgProps = pdf.getImageProperties(dataUrl);
      const ratio = pdfWidth / imgProps.width;
      const imgHeight = imgProps.height * ratio;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content exceeds A4 height
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Laudo_Ecocardiograma_${paciente.nome || 'Paciente'}.pdf`);
      showNotification("PDF gerado com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showNotification("Erro ao gerar o PDF.", "error");
    }
  };

  const handleShareWhatsApp = () => {
    let text = `*Laudo de Ecocardiograma*\nPaciente: ${paciente.nome || 'Não identificado'}\n`;
    if (conclusao) {
      text += `\n*Conclusão:*\n${conclusao}\n`;
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveLaudo = () => {
    if (!paciente.id) {
      showNotification("Selecione um paciente para salvar o laudo no histórico.", "error");
      return;
    }

    const savedLaudosStr = localStorage.getItem('@ecocardio-laudos');
    const savedLaudos: LaudoSalvo[] = savedLaudosStr ? JSON.parse(savedLaudosStr) : [];
    
    const novoLaudo: LaudoSalvo = {
      id: Math.random().toString(36).substr(2, 9),
      pacienteId: paciente.id,
      data: new Date().toISOString(),
      valoresParams,
      observacoes,
      conclusao,
      medicoId: medicoSelecionado?.id || '0'
    };

    savedLaudos.push(novoLaudo);
    localStorage.setItem('@ecocardio-laudos', JSON.stringify(savedLaudos));
    localStorage.removeItem('@ecocardio-laudo-autosave');
    showNotification("Laudo salvo no histórico do paciente!", "success");
  };

  const customLogo = localStorage.getItem('@ecocardio-logo');

  return (
    <div className="bg-slate-100 p-4 pt-20 lg:p-8 print:p-0 print:bg-white font-sans text-slate-900 min-h-screen flex flex-col items-center relative print:block print:min-h-0">
      
      {showToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium print:hidden ${showToast.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'}`}>
          <CheckCircle size={18} />
          {showToast.message}
        </div>
      )}

      {/* Barra de Ferramentas Superior (oculta na impressão) */}
      <div className="print:hidden w-full max-w-[210mm] mb-6 flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4 bg-white p-4 md:px-6 rounded-xl shadow-sm border border-slate-200">
        
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex flex-col flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1 truncate">Autopreencher Paciente</label>
            <input 
              type="text"
              list="pacientes-list"
              placeholder="Buscar paciente..."
              className="w-full text-sm border border-slate-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              onChange={(e) => {
                const selectedName = e.target.value;
                const patient = dbPacientes.find(p => p.nome === selectedName);
                if (patient) {
                   handlePreencherPaciente(patient.id);
                   e.target.value = ''; // clear input after selection
                }
              }}
            />
            <datalist id="pacientes-list">
              {dbPacientes.map(p => (
                <option key={p.id} value={p.nome} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1 truncate">Médico Assinante</label>
            <select 
              className="w-full text-sm border border-slate-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              onChange={(e) => handleSelectMedico(e.target.value)}
              value={medicoSelecionado?.id || ''}
            >
              {dbMedicos.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-row flex-wrap gap-2 mt-2 lg:mt-0 justify-end lg:justify-end">
          <button 
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none bg-emerald-500 text-white px-3 py-2 rounded shadow hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 h-[38px]"
            title="Enviar por WhatsApp"
          >
            <MessageCircle size={16} />
            <span className="font-medium text-xs sm:text-sm">WhatsApp</span>
          </button>

          <button 
            onClick={handleSaveLaudo}
            className="flex-1 sm:flex-none bg-emerald-600 text-white px-3 py-2 rounded shadow hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 h-[38px]"
            title="Salvar Histórico"
          >
            <Save size={16} />
            <span className="font-medium text-xs sm:text-sm">Salvar</span>
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex-1 sm:flex-none bg-slate-100 text-slate-700 px-3 py-2 rounded border border-slate-200 shadow-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 h-[38px]"
            title="Imprimir Laudo"
          >
            <Printer size={16} />
            <span className="font-medium text-xs sm:text-sm">Imprimir</span>
          </button>
          
          <button 
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-3 py-2 rounded shadow hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 h-[38px]"
            title="Exportar como PDF"
          >
            <FileDown size={16} />
            <span className="font-medium text-xs sm:text-sm">Exportar</span>
          </button>
        </div>
      </div>

      <div ref={laudoRef} className="w-full max-w-[210mm] bg-white shadow-xl print:shadow-none min-h-[297mm] print:min-h-0 relative print:w-full print:border-none print:m-0 border border-slate-200 print:block">
        
        {/* === HEADER === */}
        <div className="pt-10 px-6 sm:px-10 print:pt-4 print:px-8">
          <div className="flex flex-col sm:flex-row print:flex-row justify-between items-center sm:items-start print:items-start gap-4 mb-8">
            <div className="flex flex-col items-center sm:items-start print:items-start">
              {customLogo ? (
                <div className="mb-3 h-16 w-32 flex items-center justify-center sm:justify-start print:justify-start">
                  <img src={customLogo} alt="Logotipo Clínico" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="relative flex items-center justify-center text-red-500 mb-2">
                  <HeartPulse size={48} strokeWidth={1.5} />
                </div>
              )}
              <h2 className="text-sm font-bold text-slate-800 text-center sm:text-left print:text-left">{medicoSelecionado?.nome || 'Dr. Welington Baião'}</h2>
              <p className="text-xs text-slate-500 text-center sm:text-left print:text-left">{medicoSelecionado?.especialidade || 'Cardiologia'}</p>
              <p className="text-[10px] text-slate-400 leading-tight flex flex-col gap-1 mt-1 text-center sm:text-left print:text-left font-mono">
                <span>{medicoSelecionado?.registro1 || 'RQE CE 14098'}</span>
                {medicoSelecionado?.registro2 && <span>{medicoSelecionado.registro2}</span>}
              </p>
            </div>
            
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-2xl print:text-2xl font-bold tracking-widest text-slate-900 mt-2 sm:mt-8 print:mt-4">ECOCARDIOGRAMA</h1>
            </div>
            
            <div className="hidden sm:block w-[120px] opacity-0 print:block">Spacer</div>
          </div>

          {/* === IDENTIFICAÇÃO DO PACIENTE === */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row print:flex-row md:gap-4 print:gap-4 border-b-2 border-slate-800 pb-1 mb-3">
              <h3 className="font-bold text-sm tracking-wide w-full md:w-2/3 print:w-2/3">IDENTIFICAÇÃO DO PACIENTE</h3>
              <h3 className="hidden md:block print:block font-bold text-sm tracking-wide w-full md:w-1/3 print:w-1/3 mt-2 md:mt-0 print:mt-0">IDENTIFICAÇÃO DO EXAME:</h3>
            </div>
            
            <div className="flex flex-col md:flex-row print:flex-row gap-6 md:gap-4 print:gap-4">
               {/* Esquerda: Paciente*/}
               <div className="w-full md:w-2/3 print:w-2/3 flex flex-col gap-2.5 text-sm">
                  <div className="flex items-end gap-2">
                    <span className="font-bold whitespace-nowrap pb-0.5">NOME:</span>
                    <input 
                      type="text" 
                      className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                      value={paciente.nome || ''} onChange={e => setPaciente({...paciente, nome: e.target.value})} 
                    />
                  </div>
                  
                  <div className="flex flex-wrap sm:flex-nowrap print:flex-nowrap gap-x-6 gap-y-2.5">
                     <div className="flex items-end gap-2 flex-[1.5] min-w-[200px]">
                       <span className="font-bold whitespace-nowrap pb-0.5">IDADE:</span>
                       <input 
                         type="text" 
                         className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                         value={paciente.idade || ''} onChange={e => setPaciente({...paciente, idade: e.target.value})} 
                       />
                     </div>
                     <div className="flex items-end gap-2 flex-1 min-w-[120px]">
                       <span className="font-bold whitespace-nowrap pb-0.5">SEXO:</span>
                       <input 
                         type="text" 
                         className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                         value={paciente.sexo || ''} onChange={e => setPaciente({...paciente, sexo: e.target.value})} 
                       />
                     </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap print:flex-nowrap gap-x-6 gap-y-2.5">
                     <div className="flex items-end gap-2 flex-1 min-w-[100px]">
                       <span className="font-bold whitespace-nowrap pb-0.5">PESO:</span>
                       <input 
                         type="text" 
                         className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                         value={paciente.peso || ''} onChange={e => setPaciente({...paciente, peso: e.target.value})} 
                       />
                     </div>
                     <div className="flex items-end gap-2 flex-1 min-w-[100px]">
                       <span className="font-bold whitespace-nowrap pb-0.5">ALTURA:</span>
                       <input 
                         type="text" 
                         className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                         value={paciente.altura || ''} onChange={e => setPaciente({...paciente, altura: e.target.value})} 
                       />
                     </div>
                     <div className="flex items-end gap-2 flex-[1.5] min-w-[140px]">
                       <span className="font-bold whitespace-nowrap pb-0.5">SUP. CORPÓREA:</span>
                       <input 
                         type="text" 
                         className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                         value={paciente.supCorporea || ''} onChange={e => setPaciente({...paciente, supCorporea: e.target.value})} 
                       />
                     </div>
                  </div>

               </div>

               {/* Direita: Exame */}
               <div className="w-full md:w-1/3 print:w-1/3 flex flex-col gap-2.5 text-sm mt-4 md:mt-0 print:mt-0">
                  <div className="border-b-2 border-slate-800 pb-1 mb-1 md:hidden print:hidden">
                    <h3 className="font-bold text-sm tracking-wide">IDENTIFICAÇÃO DO EXAME:</h3>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="font-bold whitespace-nowrap pb-0.5">DATA DO EXAME:</span>
                     <input 
                       type="text" 
                       className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                       value={paciente.dataExame || ''} onChange={e => setPaciente({...paciente, dataExame: e.target.value})} 
                     />
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="font-bold whitespace-nowrap pb-0.5">SOLICITANTE:</span>
                     <input 
                       type="text" 
                       className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                       value={paciente.solicitante || ''} onChange={e => setPaciente({...paciente, solicitante: e.target.value})} 
                     />
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="font-bold whitespace-nowrap pb-0.5">CONVÊNIO:</span>
                     <input 
                       type="text" 
                       className="flex-1 border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none print:border-none bg-transparent pb-0 w-full" 
                       value={paciente.convenioId || ''} onChange={e => setPaciente({...paciente, convenioId: e.target.value})} 
                     />
                  </div>
               </div>
            </div>
          </div>

          {/* === PARÂMETROS === */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 md:gap-6 print:gap-6 mb-6 mt-6">
            <table className="w-full text-[11px] md:text-sm print:text-[11px] border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-50 border-b border-slate-800 leading-tight">
                  <th className="border-r border-slate-800 px-1 py-1 font-bold text-center w-[45%]">PARÂMETRO</th>
                  <th className="border-r border-slate-800 px-1 py-1 font-bold text-center w-[25%]">VALOR</th>
                  <th className="px-1 py-1 font-bold text-center w-[30%]">REFERÊNCIA<br className="md:hidden print:hidden"/> (F)</th>
                </tr>
              </thead>
              <tbody>
                {parametrosEsquerda.map((param, i) => (
                  <tr key={`esq-${i}`} className="border-b border-slate-800 last:border-b-0">
                    <td className="border-r border-slate-800 px-1 py-0.5 font-bold leading-tight">{param}</td>
                    <td className="border-r border-slate-800 p-0 text-center">
                      <input 
                        className="w-full text-center outline-none bg-transparent px-1 py-0.5 focus:bg-indigo-50 leading-tight"
                        value={valoresParams[param]?.valor || ''}
                        onChange={e => handleParamChange(param, 'valor', e.target.value)}
                      />
                    </td>
                    <td className="p-0 text-center">
                      <input 
                        className="w-full text-center outline-none bg-transparent px-1 py-0.5 focus:bg-indigo-50 leading-tight"
                        value={valoresParams[param]?.ref || ''}
                        onChange={e => handleParamChange(param, 'ref', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="w-full text-[11px] md:text-sm print:text-[11px] border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-50 border-b border-slate-800 leading-tight">
                  <th className="border-r border-slate-800 px-1 py-1 font-bold text-center w-[45%]">PARÂMETRO</th>
                  <th className="border-r border-slate-800 px-1 py-1 font-bold text-center w-[25%]">VALOR</th>
                  <th className="px-1 py-1 font-bold text-center w-[30%]">REFERÊNCIA<br className="md:hidden print:hidden"/> (F)</th>
                </tr>
              </thead>
              <tbody>
                {parametrosDireita.map((param, i) => (
                  <tr key={`dir-${i}`} className="border-b border-slate-800 last:border-b-0">
                    <td className="border-r border-slate-800 px-1 py-0.5 font-bold leading-tight">{param}</td>
                    <td className="border-r border-slate-800 p-0 text-center">
                      <input 
                        className="w-full text-center outline-none bg-transparent px-1 py-0.5 focus:bg-indigo-50 leading-tight"
                        value={valoresParams[param]?.valor || ''}
                        onChange={e => handleParamChange(param, 'valor', e.target.value)}
                      />
                    </td>
                    <td className="p-0 text-center">
                      <input 
                        className="w-full text-center outline-none bg-transparent px-1 py-0.5 focus:bg-indigo-50 leading-tight"
                        value={valoresParams[param]?.ref || ''}
                        onChange={e => handleParamChange(param, 'ref', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* === OBSERVAÇÕES === */}
          <div className="mb-8 print:break-inside-auto">
            <h3 className="font-bold text-sm tracking-wide mb-2 uppercase border-b-2 border-slate-800 pb-1 print:break-after-avoid">OBSERVAÇÕES</h3>
            
            {/* Elemento vísivel e fluido apenas na impressão para quebrar página corretamente */}
            <div className="hidden print:block text-[12px] leading-[1.6] whitespace-pre-wrap py-2 text-justify print:break-inside-auto">
              {observacoes}
            </div>

            <textarea
              className="w-full min-h-[400px] print:hidden overflow-hidden resize-none outline-none text-[13px] leading-relaxed bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 p-2 -ml-2 rounded"
              value={observacoes}
              onChange={e => {
                setObservacoes(e.target.value);
                e.target.style.height = 'inherit';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onFocus={e => {
                 e.target.style.height = 'inherit';
                 e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
          </div>

          <div className="print:break-before-auto print:break-inside-avoid pt-8 print:pt-4">
            <h3 className="font-bold text-sm tracking-wide mb-2 uppercase border-b-2 border-slate-800 pb-1 print:break-after-avoid">CONCLUSÃO</h3>
            <div className="border border-slate-800 min-h-[150px] print:min-h-0 w-full p-0 flex flex-col print:border-none">
               {/* Elemento vísivel e fluido apenas na impressão para quebrar página corretamente */}
               <div className="hidden print:block text-sm py-2 whitespace-pre-wrap min-h-[100px] print:min-h-0 border border-slate-800 p-4 shrink-0">
                 {conclusao}
               </div>

               <textarea
                 className="w-full h-full min-h-[150px] print:hidden outline-none text-sm p-4 bg-transparent resize-none flex-1"
                 value={conclusao}
                 onChange={e => setConclusao(e.target.value)}
                 placeholder="Digite a conclusão aqui..."
               />
            </div>
            
            <div className="mt-20 print:mt-32 text-center text-sm print:break-inside-avoid">
               <p>{medicoSelecionado?.nome || 'Dr. Welington Baião'} - {medicoSelecionado?.especialidade || 'Cardiologia'}</p>
               <p>
                 {medicoSelecionado?.registro1 ? medicoSelecionado.registro1 : 'RQE-CE: 14098'}
                 {medicoSelecionado?.registro2 ? ` / ${medicoSelecionado.registro2}` : ' / RQE-PE: 13386'}
               </p>
               <div className="mt-8 pt-4 inline-block min-w-[250px] border-t border-slate-400">
                  <p className="text-slate-400">[Assinatura + Carimbo]</p>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

