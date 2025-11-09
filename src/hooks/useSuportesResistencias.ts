import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  listSuportesResistencias,
  getSuporteResistenciaByAtivo,
  createSuporteResistencia,
  updateSuporteResistencia,
  deleteSuporteResistencia,
  searchSuportesResistencias,
  type SuporteResistencia,
  type CreateSuporteResistencia,
  type UpdateSuporteResistencia
} from '@/services/suportesResistenciasService'

// Hook para listar todos os suportes e resistências
export const useSuportesResistencias = () => {
  return useQuery({
    queryKey: ['suportes-resistencias'],
    queryFn: listSuportesResistencias,
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos
  })
}

// Hook para obter suporte e resistência por ativo
export const useSuporteResistenciaByAtivo = (ativoCodigo: string) => {
  return useQuery({
    queryKey: ['suporte-resistencia', ativoCodigo],
    queryFn: () => getSuporteResistenciaByAtivo(ativoCodigo),
    enabled: !!ativoCodigo,
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos
  })
}

// Hook para buscar suportes e resistências
export const useSearchSuportesResistencias = (searchTerm: string) => {
  return useQuery({
    queryKey: ['suportes-resistencias', 'search', searchTerm],
    queryFn: () => searchSuportesResistencias(searchTerm),
    enabled: !!searchTerm,
    staleTime: 30000, // 30 segundos
    gcTime: 300000, // 5 minutos
  })
}

// Hook para criar suporte e resistência
export const useCreateSuporteResistencia = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createSuporteResistencia,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['suportes-resistencias'] })
    },
  })
}

// Hook para atualizar suporte e resistência
export const useUpdateSuporteResistencia = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSuporteResistencia }) => 
      updateSuporteResistencia(id, data),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['suportes-resistencias'] })
      queryClient.invalidateQueries({ queryKey: ['suporte-resistencia', id] })
    },
  })
}

// Hook para deletar suporte e resistência
export const useDeleteSuporteResistencia = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteSuporteResistencia,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['suportes-resistencias'] })
    },
  })
} 