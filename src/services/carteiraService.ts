import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type CarteiraRow = Database['public']['Tables']['carteira']['Row']
type CarteiraInsert = Database['public']['Tables']['carteira']['Insert']
type CarteiraUpdate = Database['public']['Tables']['carteira']['Update']

type OperacaoRow = Database['public']['Tables']['carteira_operacoes']['Row']
type OperacaoInsert = Database['public']['Tables']['carteira_operacoes']['Insert']
type OperacaoUpdate = Database['public']['Tables']['carteira_operacoes']['Update']

export type AtivoCarteira = CarteiraRow
export type OperacaoCarteira = OperacaoRow

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
    const { data, error } = await supabase
      .from('carteira')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar carteira:', error)
    throw error
  }
}

// Adicionar novo ativo à carteira
export const addAtivoToCarteira = async (ativo: CarteiraInsert): Promise<AtivoCarteira> => {
  try {
    const { data, error } = await supabase
      .from('carteira')
      .insert(ativo)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro ao adicionar ativo à carteira:', error)
    throw error
  }
}

// Atualizar ativo na carteira
export const updateAtivoInCarteira = async (
  id: string, 
  updates: CarteiraUpdate
): Promise<AtivoCarteira> => {
  try {
    const { data, error } = await supabase
      .from('carteira')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro ao atualizar ativo na carteira:', error)
    throw error
  }
}

// Remover ativo da carteira
export const removeAtivoFromCarteira = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('carteira')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
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

// Adicionar operação (entrada ou saída)
export const addOperacaoCarteira = async (operacao: OperacaoInsert): Promise<OperacaoCarteira> => {
  try {
    const { data, error } = await supabase
      .from('carteira_operacoes')
      .insert(operacao)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro ao adicionar operação à carteira:', error)
    throw error
  }
}

// Buscar todas as operações de um usuário
export const fetchOperacoesCarteira = async (userId: string): Promise<OperacaoCarteira[]> => {
  try {
    const { data, error } = await supabase
      .from('carteira_operacoes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar operações da carteira:', error)
    throw error
  }
}

// Buscar operações de um ativo específico
export const fetchOperacoesAtivo = async (
  userId: string, 
  ativoCodigo: string
): Promise<OperacaoCarteira[]> => {
  try {
    const { data, error } = await supabase
      .from('carteira_operacoes')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo_codigo', ativoCodigo.toUpperCase())
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar operações do ativo:', error)
    throw error
  }
}

// Calcular posição consolidada de um ativo
export const calcularPosicaoAtivo = (operacoes: OperacaoCarteira[]) => {
  let quantidadeTotal = 0
  let valorTotalEntradas = 0
  let quantidadeEntradas = 0

  operacoes.forEach(op => {
    if (op.tipo_operacao === 'entrada') {
      quantidadeTotal += op.quantidade
      valorTotalEntradas += op.quantidade * op.preco_operacao
      quantidadeEntradas += op.quantidade
    } else if (op.tipo_operacao === 'saida') {
      quantidadeTotal -= op.quantidade
    }
  })

  const precoMedio = quantidadeEntradas > 0 ? valorTotalEntradas / quantidadeEntradas : 0

  return {
    quantidadeTotal,
    precoMedio,
    valorTotalEntradas,
    quantidadeEntradas
  }
}

// Buscar posições consolidadas de todos os ativos do usuário
export const fetchPosicoesConsolidadas = async (userId: string) => {
  try {
    const operacoes = await fetchOperacoesCarteira(userId)
    
    // Agrupar operações por ativo
    const operacoesPorAtivo = operacoes.reduce((acc, op) => {
      if (!acc[op.ativo_codigo]) {
        acc[op.ativo_codigo] = []
      }
      acc[op.ativo_codigo].push(op)
      return acc
    }, {} as Record<string, OperacaoCarteira[]>)

    // Calcular posição consolidada para cada ativo
    const posicoes = Object.entries(operacoesPorAtivo).map(([ativoCodigo, ops]) => {
      const posicao = calcularPosicaoAtivo(ops)
      return {
        ativo_codigo: ativoCodigo,
        quantidade: posicao.quantidadeTotal,
        preco_medio: posicao.precoMedio,
        valor_total: posicao.valorTotalEntradas,
        operacoes: ops
      }
    }).filter(pos => pos.quantidade > 0) // Apenas ativos com posição positiva

    return posicoes
  } catch (error) {
    console.error('Erro ao calcular posições consolidadas:', error)
    throw error
  }
} 