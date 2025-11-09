import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchPlanilhaData, 
  fetchAtivoBySigla, 
  fetchAtivosByFilter, 
  fetchTopAtivos,
  type Ativo,
  type PlanilhaData 
} from '@/services/googleSheets'

// Hook para buscar todos os dados da planilha
export const usePlanilhaData = (options?: {
  refetchInterval?: number
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: ['planilha', 'data'],
    queryFn: fetchPlanilhaData,
    refetchInterval: options?.refetchInterval || 300000, // 5 minutos
    enabled: options?.enabled ?? true,
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos
  })
}

// Hook para buscar um ativo específico
export const useAtivo = (sigla: string) => {
  return useQuery({
    queryKey: ['ativo', sigla],
    queryFn: () => fetchAtivoBySigla(sigla),
    enabled: !!sigla,
    staleTime: 30000, // 30 segundos
  })
}

// Hook para buscar ativos por filtro
export const useAtivosFilter = (filter: string) => {
  return useQuery({
    queryKey: ['ativos', 'filter', filter],
    queryFn: () => fetchAtivosByFilter(filter),
    enabled: !!filter && filter.length >= 2,
    staleTime: 30000, // 30 segundos
  })
}

// Hook para buscar top ativos
export const useTopAtivos = (limit: number = 10) => {
  return useQuery({
    queryKey: ['ativos', 'top', limit],
    queryFn: () => fetchTopAtivos(limit),
    staleTime: 60000, // 1 minuto
  })
}

// Hook para buscar ativos com alta variação (positiva)
export const useAtivosAlta = (limit: number = 10) => {
  return useQuery({
    queryKey: ['ativos', 'alta', limit],
    queryFn: async () => {
      const data = await fetchPlanilhaData()
      return data.ativos
        .filter(ativo => ativo.variacaoPercentual > 0)
        .sort((a, b) => b.variacaoPercentual - a.variacaoPercentual)
        .slice(0, limit)
    },
    staleTime: 60000, // 1 minuto
  })
}

// Hook para buscar ativos com baixa variação (negativa)
export const useAtivosBaixa = (limit: number = 10) => {
  return useQuery({
    queryKey: ['ativos', 'baixa', limit],
    queryFn: async () => {
      const data = await fetchPlanilhaData()
      return data.ativos
        .filter(ativo => ativo.variacaoPercentual < 0)
        .sort((a, b) => a.variacaoPercentual - b.variacaoPercentual)
        .slice(0, limit)
    },
    staleTime: 60000, // 1 minuto
  })
}

// Hook para buscar ativos por volume
export const useAtivosVolume = (limit: number = 10) => {
  return useQuery({
    queryKey: ['ativos', 'volume', limit],
    queryFn: async () => {
      const data = await fetchPlanilhaData()
      return data.ativos
        .sort((a, b) => b.volume - a.volume)
        .slice(0, limit)
    },
    staleTime: 60000, // 1 minuto
  })
}

// Hook para buscar ativos por valor de mercado
export const useAtivosValorMercado = (limit: number = 10) => {
  return useQuery({
    queryKey: ['ativos', 'valorMercado', limit],
    queryFn: async () => {
      const data = await fetchPlanilhaData()
      return data.ativos
        .sort((a, b) => b.valorMercado - a.valorMercado)
        .slice(0, limit)
    },
    staleTime: 60000, // 1 minuto
  })
}

// Hook para invalidar cache da planilha
export const useInvalidatePlanilha = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ['planilha'] })
      await queryClient.invalidateQueries({ queryKey: ['ativos'] })
    },
  })
}

// Hook para buscar estatísticas da planilha
export const usePlanilhaStats = () => {
  return useQuery({
    queryKey: ['planilha', 'stats'],
    queryFn: async () => {
      const data = await fetchPlanilhaData()
      
      const stats = {
        totalAtivos: data.ativos.length,
        ativosAlta: data.ativos.filter(a => a.variacaoPercentual > 0).length,
        ativosBaixa: data.ativos.filter(a => a.variacaoPercentual < 0).length,
        ativosEstaveis: data.ativos.filter(a => a.variacaoPercentual === 0).length,
        maiorAlta: Math.max(...data.ativos.map(a => a.variacaoPercentual)),
        maiorBaixa: Math.min(...data.ativos.map(a => a.variacaoPercentual)),
        volumeTotal: data.ativos.reduce((sum, a) => sum + a.volume, 0),
        valorMercadoTotal: data.ativos.reduce((sum, a) => sum + a.valorMercado, 0),
        ultimaAtualizacao: data.ultimaAtualizacao
      }
      
      return stats
    },
    staleTime: 60000, // 1 minuto
  })
} 