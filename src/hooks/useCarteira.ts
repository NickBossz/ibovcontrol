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
  type CarteiraStats,
  addOperacaoCarteira,
  fetchOperacoesCarteira,
  removeOperacaoCarteira,
  updateOperacaoCarteira,
  fetchCarteiraFromOperacoes,
  calcularPosicaoAtivo,
  type OperacaoCarteira
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
      id?: string
      ativo_codigo: string
      quantidade: number
      preco_medio: number
      data_compra: string
      update?: boolean
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      if (ativo.update && ativo.id) {
        // Atualização
        return await updateAtivoInCarteira(ativo.id, {
          ativo_codigo: ativo.ativo_codigo,
          quantidade: ativo.quantidade,
          preco_medio: ativo.preco_medio,
          data_compra: ativo.data_compra,
        })
      } else {
        // Inserção
        return await addAtivoToCarteira({
          user_id: user.id,
          ativo_codigo: ativo.ativo_codigo,
          quantidade: ativo.quantidade,
          preco_medio: ativo.preco_medio,
          data_compra: ativo.data_compra,
        })
      }
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

// Hook para adicionar operação na carteira
export const useAddOperacaoCarteira = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addOperacaoCarteira,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

// Hook para buscar operações de um ativo
export const useOperacoesCarteira = (ativoCodigo: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['carteira_operacoes', user?.id, ativoCodigo],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return await fetchOperacoesCarteira(ativoCodigo);
    },
    enabled: !!user?.id && !!ativoCodigo,
    staleTime: 60000,
  });
};

// Hook para remover operação
export const useRemoveOperacaoCarteira = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeOperacaoCarteira,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carteira_operacoes'] });
      queryClient.invalidateQueries({ queryKey: ['carteira'] });
    },
  });
}; 