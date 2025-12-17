import { apiClient } from '@/lib/apiClient'

export interface NivelSR {
  tipo: 'suporte' | 'resistencia';
  valor: number;
  motivo?: string;
}

export interface SuporteResistencia {
  id: string;
  ativo_codigo: string;
  ativo_nome: string;
  suporte1: number | null;
  suporte2: number | null;
  resistencia1: number | null;
  resistencia2: number | null;
  niveis?: NivelSR[]; // NOVO CAMPO
  admin_id: string | null;
  ultima_modificacao: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSuporteResistencia {
  ativo_codigo: string;
  ativo_nome: string;
  niveis?: NivelSR[]; // NOVO CAMPO
  suporte1?: number;
  suporte2?: number;
  resistencia1?: number;
  resistencia2?: number;
}

export interface UpdateSuporteResistencia {
  niveis?: NivelSR[]; // NOVO CAMPO
  suporte1?: number;
  suporte2?: number;
  resistencia1?: number;
  resistencia2?: number;
}

// Função para listar todos os suportes e resistências
export const listSuportesResistencias = async (): Promise<SuporteResistencia[]> => {
  try {
    const data = await apiClient.get<SuporteResistencia[]>('/support-resistance/list');
    return data || [];
  } catch (error) {
    console.error('Erro ao listar suportes e resistências:', error);
    throw error;
  }
};

// Função para obter suporte e resistência por ativo
export const getSuporteResistenciaByAtivo = async (ativoCodigo: string): Promise<SuporteResistencia | null> => {
  try {
    const data = await apiClient.get<SuporteResistencia[]>(`/support-resistance/list?assetCode=${ativoCodigo}`);
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro ao obter suporte e resistência:', error);
    return null;
  }
};

// Função para criar suporte e resistência
export const createSuporteResistencia = async (data: CreateSuporteResistencia): Promise<SuporteResistencia> => {
  try {
    const result = await apiClient.post<SuporteResistencia>('/support-resistance/list', data);
    return result;
  } catch (error) {
    console.error('Erro ao criar suporte e resistência:', error);
    throw error;
  }
};

// Função para atualizar suporte e resistência
export const updateSuporteResistencia = async (id: string, data: UpdateSuporteResistencia): Promise<SuporteResistencia> => {
  try {
    const result = await apiClient.put<SuporteResistencia>('/support-resistance/list', { id, ...data });
    return result;
  } catch (error) {
    console.error('Erro ao atualizar suporte e resistência:', error);
    throw error;
  }
};

// Função para deletar suporte e resistência
export const deleteSuporteResistencia = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/support-resistance/list?id=${id}`)
  } catch (error) {
    console.error('Erro ao deletar suporte e resistência:', error)
    throw error
  }
}

// Função para buscar suportes e resistências
export const searchSuportesResistencias = async (searchTerm: string): Promise<SuporteResistencia[]> => {
  try {
    const data = await apiClient.get<SuporteResistencia[]>(`/support-resistance/list?search=${encodeURIComponent(searchTerm)}`)
    return data || []
  } catch (error) {
    console.error('Erro ao buscar suportes e resistências:', error)
    throw error
  }
} 