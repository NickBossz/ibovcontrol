import { supabase } from '@/lib/supabase'

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
    const { data, error } = await supabase
      .from('suportes_resistencias')
      .select('*')
      .order('ativo_codigo', { ascending: true });

    if (error) {
      throw error;
    }

    // Parseia niveis se vier como string
    return (data || []).map(item => ({
      ...item,
      niveis: item.niveis && typeof item.niveis === 'string' ? JSON.parse(item.niveis) : item.niveis
    }));
  } catch (error) {
    console.error('Erro ao listar suportes e resistências:', error);
    throw error;
  }
};

// Função para obter suporte e resistência por ativo
export const getSuporteResistenciaByAtivo = async (ativoCodigo: string): Promise<SuporteResistencia | null> => {
  try {
    const { data, error } = await supabase
      .from('suportes_resistencias')
      .select('*')
      .eq('ativo_codigo', ativoCodigo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      throw error;
    }

    // Parseia niveis se vier como string
    if (data && typeof data.niveis === 'string') {
      data.niveis = JSON.parse(data.niveis);
    }

    return data;
  } catch (error) {
    console.error('Erro ao obter suporte e resistência:', error);
    throw error;
  }
};

// Função para criar suporte e resistência
export const createSuporteResistencia = async (data: CreateSuporteResistencia): Promise<SuporteResistencia> => {
  try {
    const { data: result, error } = await supabase
      .from('suportes_resistencias')
      .insert({
        ...data,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        niveis: data.niveis ? JSON.stringify(data.niveis) : null // Salva como JSON
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Se niveis vier como string, parseia
    if (result && typeof result.niveis === 'string') {
      result.niveis = JSON.parse(result.niveis);
    }

    return result;
  } catch (error) {
    console.error('Erro ao criar suporte e resistência:', error);
    throw error;
  }
};

// Função para atualizar suporte e resistência
export const updateSuporteResistencia = async (id: string, data: UpdateSuporteResistencia): Promise<SuporteResistencia> => {
  try {
    const { data: result, error } = await supabase
      .from('suportes_resistencias')
      .update({
        ...data,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        ultima_modificacao: new Date().toISOString(),
        niveis: data.niveis ? JSON.stringify(data.niveis) : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Se niveis vier como string, parseia
    if (result && typeof result.niveis === 'string') {
      result.niveis = JSON.parse(result.niveis);
    }

    return result;
  } catch (error) {
    console.error('Erro ao atualizar suporte e resistência:', error);
    throw error;
  }
};

// Função para deletar suporte e resistência
export const deleteSuporteResistencia = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('suportes_resistencias')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Erro ao deletar suporte e resistência:', error)
    throw error
  }
}

// Função para buscar suportes e resistências
export const searchSuportesResistencias = async (searchTerm: string): Promise<SuporteResistencia[]> => {
  try {
    const { data, error } = await supabase
      .from('suportes_resistencias')
      .select('*')
      .or(`ativo_codigo.ilike.%${searchTerm}%,ativo_nome.ilike.%${searchTerm}%`)
      .order('ativo_codigo', { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar suportes e resistências:', error)
    throw error
  }
} 