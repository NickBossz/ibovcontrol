import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { 
  fetchCarteira, 
  addAtivoToCarteira, 
  updateAtivoInCarteira, 
  removeAtivoFromCarteira,
  fetchCarteiraStats,
  fetchAtivoFromCarteira,
  type AtivoCarteira,
  type CarteiraStats
} from '@/services/carteiraService'

// Hook para buscar a carteira do usuário
export const useCarteira = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['carteira', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      return await fetchCarteira(user.id)
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutos
    gcTime: 600000, // 10 minutos
  })
}

// Hook para buscar estatísticas da carteira
export const useCarteiraStats = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['carteira', 'stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      return await fetchCarteiraStats(user.id)
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutos
    gcTime: 600000, // 10 minutos
  })
}

// Hook para adicionar ativo à carteira
export const useAddAtivoToCarteira = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (ativo: {
      ativo_codigo: string
      quantidade: number
      preco_medio: number
      data_compra: string
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      
      return await addAtivoToCarteira({
        user_id: user.id,
        ...ativo
      })
    },
    onSuccess: () => {
      // Invalidar queries relacionadas à carteira
      queryClient.invalidateQueries({ queryKey: ['carteira'] })
    },
  })
}

// Hook para atualizar ativo na carteira
export const useUpdateAtivoInCarteira = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await updateAtivoInCarteira(id, updates)
    },
    onSuccess: () => {
      // Invalidar queries relacionadas à carteira
      queryClient.invalidateQueries({ queryKey: ['carteira'] })
    },
  })
}

// Hook para remover ativo da carteira
export const useRemoveAtivoFromCarteira = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await removeAtivoFromCarteira(id)
    },
    onSuccess: () => {
      // Invalidar queries relacionadas à carteira
      queryClient.invalidateQueries({ queryKey: ['carteira'] })
    },
  })
}

// Hook para buscar ativo específico da carteira
export const useAtivoFromCarteira = (ativoCodigo: string) => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['carteira', 'ativo', user?.id, ativoCodigo],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      return await fetchAtivoFromCarteira(user.id, ativoCodigo)
    },
    enabled: !!user?.id && !!ativoCodigo,
    staleTime: 300000, // 5 minutos
    gcTime: 600000, // 10 minutos
  })
} 