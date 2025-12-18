import { apiClient } from '@/lib/apiClient'

export type AtivoCarteira = {
  id: string
  user_id: string
  ativo_codigo: string
  quantidade: number
  preco_medio: number
  data_compra: string
  created_at: string
  updated_at: string
}

type CarteiraInsert = Omit<AtivoCarteira, 'id' | 'created_at' | 'updated_at'>
type CarteiraUpdate = Partial<Omit<AtivoCarteira, 'id' | 'user_id' | 'created_at'>>

export interface CarteiraStats {
  totalInvested: number
  totalValue: number
  totalReturn: number
  returnPercent: number
  totalAssets: number
}

// Buscar todos os ativos da carteira do usuário
export const fetchCarteira = async (userId: string): Promise<AtivoCarteira[]> => {
  try {
    const data = await apiClient.get<AtivoCarteira[]>(`/portfolio/assets`)
    return data || []
  } catch (error) {
    console.error('Erro ao buscar carteira:', error)
    throw error
  }
}

// Adicionar novo ativo à carteira
export const addAtivoToCarteira = async (ativo: CarteiraInsert): Promise<AtivoCarteira> => {
  try {
    console.log('[addAtivoToCarteira] Enviando:', ativo)
    const data = await apiClient.post<AtivoCarteira>('/portfolio/assets', ativo)
    console.log('[addAtivoToCarteira] Resposta recebida:', data)
    return data
  } catch (error) {
    console.error('[addAtivoToCarteira] Erro ao adicionar ativo à carteira:', error)
    throw error
  }
}

// Atualizar ativo na carteira
export const updateAtivoInCarteira = async (
  id: string,
  updates: CarteiraUpdate
): Promise<AtivoCarteira> => {
  try {
    const data = await apiClient.put<AtivoCarteira>('/portfolio/assets', { id, ...updates })
    return data
  } catch (error) {
    console.error('Erro ao atualizar ativo na carteira:', error)
    throw error
  }
}

// Remover ativo da carteira
export const removeAtivoFromCarteira = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/portfolio/assets?id=${id}`)
  } catch (error) {
    console.error('Erro ao remover ativo da carteira:', error)
    throw error
  }
}

// Buscar estatísticas da carteira
export const fetchCarteiraStats = async (userId: string): Promise<CarteiraStats> => {
  try {
    const carteira = await fetchCarteira(userId)
    
    let totalInvested = 0
    let totalValue = 0
    const totalAssets = carteira.length

    carteira.forEach(ativo => {
      const invested = ativo.quantidade * ativo.preco_medio
      // Por enquanto, usar o preço médio como valor atual
      // O cálculo real será feito na CarteiraPage usando dados da planilha
      const currentValue = invested
      
      totalInvested += invested
      totalValue += currentValue
    })

    const totalReturn = totalValue - totalInvested
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

    return {
      totalInvested,
      totalValue,
      totalReturn,
      returnPercent,
      totalAssets
    }
  } catch (error) {
    console.error('Erro ao calcular estatísticas da carteira:', error)
    return {
      totalInvested: 0,
      totalValue: 0,
      totalReturn: 0,
      returnPercent: 0,
      totalAssets: 0
    }
  }
}

// Buscar ativo específico da carteira
export const fetchAtivoFromCarteira = async (
  userId: string, 
  ativoCodigo: string
): Promise<AtivoCarteira | null> => {
  try {
    const { data, error } = await supabase
      .from('carteira')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo_codigo', ativoCodigo.toUpperCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Não encontrado
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar ativo da carteira:', error)
    throw error
  }
} 

// Tipos para operações
export type OperacaoCarteira = {
  id?: string;
  user_id: string;
  ativo_codigo: string;
  tipo_operacao: 'entrada' | 'saida';
  quantidade: number;
  preco: number;
  data_operacao: string;
  created_at?: string;
};

// Adicionar operação
export const addOperacaoCarteira = async (operacao: OperacaoCarteira): Promise<OperacaoCarteira> => {
  try {
    console.log('[addOperacaoCarteira] Operação recebida:', operacao)
    const payload = {
      assetCode: operacao.ativo_codigo, // Código do ativo (PETR4, etc)
      tipo_operacao: operacao.tipo_operacao,
      quantidade: operacao.quantidade,
      preco: operacao.preco,
      data_operacao: operacao.data_operacao,
      notes: null
    }
    console.log('[addOperacaoCarteira] Enviando payload:', payload)

    const data = await apiClient.post<any>('/portfolio/operations', payload)

    console.log('[addOperacaoCarteira] Resposta recebida:', data)

    // Mapear resposta para formato esperado
    const result = {
      id: data.id,
      user_id: operacao.user_id,
      ativo_codigo: operacao.ativo_codigo,
      tipo_operacao: data.tipo_operacao,
      quantidade: data.quantidade,
      preco: data.preco,
      data_operacao: data.data_operacao,
      created_at: data.created_at
    }

    console.log('[addOperacaoCarteira] Retornando:', result)
    return result
  } catch (error) {
    console.error('[addOperacaoCarteira] Erro ao adicionar operação:', error)
    throw error
  }
};

// Buscar operações de um ativo
export const fetchOperacoesCarteira = async (assetId: string): Promise<OperacaoCarteira[]> => {
  try {
    const data = await apiClient.get<any[]>(`/portfolio/operations?assetId=${assetId}`)
    // Mapear resposta da API para o formato esperado pelo frontend
    return data.map(op => ({
      id: op.id,
      user_id: '', // Não retornado pela API
      ativo_codigo: '', // Não retornado pela API
      tipo_operacao: op.tipo_operacao,
      quantidade: op.quantidade,
      preco: op.preco,
      data_operacao: op.data_operacao,
      created_at: op.created_at
    }))
  } catch (error) {
    console.error('Erro ao buscar operações:', error)
    return []
  }
};

// Calcular posição atual do ativo baseado nas operações
export const calcularPosicaoAtivo = async (userId: string, ativoCodigo: string) => {
  try {
    const { data, error } = await supabase
      .rpc('calcular_posicao_ativo', {
        p_user_id: userId,
        p_ativo_codigo: ativoCodigo
      });

    if (error) throw error;
    return data?.[0] || { quantidade_total: 0, preco_medio: 0, valor_investido: 0 };
  } catch (error) {
    console.error('Erro ao calcular posição do ativo:', error);
    throw error;
  }
};

// Buscar resumo da carteira baseado nas operações
export const fetchCarteiraFromOperacoes = async (userId: string): Promise<AtivoCarteira[]> => {
  try {
    const operacoes = await fetchOperacoesCarteira(userId);
    const ativosUnicos = [...new Set(operacoes.map(op => op.ativo_codigo))];
    
    const carteiraCalculada: AtivoCarteira[] = [];
    
    for (const ativoCodigo of ativosUnicos) {
      const posicao = await calcularPosicaoAtivo(userId, ativoCodigo);
      
      if (posicao.quantidade_total > 0) {
        // Buscar a primeira operação para usar como data de compra
        const primeiraOperacao = operacoes
          .filter(op => op.ativo_codigo === ativoCodigo && op.tipo_operacao === 'entrada')
          .sort((a, b) => new Date(a.data_operacao).getTime() - new Date(b.data_operacao).getTime())[0];
        
        carteiraCalculada.push({
          id: `calc_${ativoCodigo}`,
          user_id: userId,
          ativo_codigo: ativoCodigo,
          quantidade: posicao.quantidade_total,
          preco_medio: posicao.preco_medio,
          data_compra: primeiraOperacao?.data_operacao || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    return carteiraCalculada;
  } catch (error) {
    console.error('Erro ao calcular carteira das operações:', error);
    throw error;
  }
};

// Remover operação
export const removeOperacaoCarteira = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('carteira_operacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao remover operação:', error);
    throw error;
  }
};

// Atualizar operação
export const updateOperacaoCarteira = async (id: string, updates: Partial<OperacaoCarteira>): Promise<OperacaoCarteira> => {
  try {
    const { data, error } = await supabase
      .from('carteira_operacoes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar operação:', error);
    throw error;
  }
}; 