export interface Paciente {
  id: string;
  nome: string;
  idade: string;
  sexo: string;
  peso: string;
  altura: string;
  supCorporea: string;
  solicitante: string;
  convenioId?: string;
  dataExame?: string;
}

export interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  registro1: string;
  registro2: string;
}

export interface Convenio {
  id: string;
  nome: string;
}

export interface LaudoSalvo {
  id: string;
  pacienteId: string;
  data: string;
  valoresParams: Record<string, {valor: string, ref: string}>;
  observacoes: string;
  conclusao: string;
  medicoId: string;
}
