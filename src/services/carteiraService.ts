import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type CarteiraRow = Database['public']['Tables']['carteira']['Row']
type CarteiraInsert = Database['public']['Tables']['carteira']['Insert']
type CarteiraUpdate = Database['public']['Tables']['carteira']['Update']

export type AtivoCarteira = CarteiraRow

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