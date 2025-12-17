import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserRole,
  isUserAdmin,
  isUserClient,
  updateUserRole,
  listUsers,
  getCurrentUser,
  type UserRole,
  type User
} from '@/services/userService'

// Hook para obter o cargo do usuário atual
export const useUserRole = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['user', 'role', user?.id],
    queryFn: getUserRole,
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutos
    gcTime: 600000, // 10 minutos
  })
}

// Hook para verificar se o usuário é admin
export const useIsAdmin = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['user', 'isAdmin', user?.id],
    queryFn: isUserAdmin,
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutos
    gcTime: 600000, // 10 minutos
  })
}

// Hook para verificar se o usuário é cliente
export const useIsClient = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['user', 'isClient', user?.id],
    queryFn: isUserClient,
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutos
    gcTime: 600000, // 10 minutos
  })
}

// Hook para obter informações do usuário atual
export const useCurrentUser = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['user', 'current', user?.id],
    queryFn: getCurrentUser,
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutos
    gcTime: 600000, // 10 minutos
  })
}

// Hook para listar todos os usuários (apenas admins)
export const useUsers = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['users', 'list'],
    queryFn: listUsers,
    enabled: !!user?.id,
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos
  })
}

// Hook para atualizar cargo de um usuário (apenas admins)
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      return await updateUserRole(userId, newRole)
    },
    onSuccess: () => {
      // Invalidar queries relacionadas a usuários
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

// Nota: setDefaultRole foi removido - o role padrão ('cliente')
// é definido automaticamente no backend ao criar um novo usuário 