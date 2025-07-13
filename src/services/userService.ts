import { supabase } from '@/lib/supabase'

export type UserRole = 'cliente' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  last_sign_in_at?: string
}

// Função para obter o cargo do usuário atual
export const getUserRole = async (): Promise<UserRole | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const role = user.user_metadata?.role as UserRole
    return role || 'cliente' // Padrão é cliente
  } catch (error) {
    console.error('Erro ao obter cargo do usuário:', error)
    return null
  }
}

// Função para verificar se o usuário é admin
export const isUserAdmin = async (): Promise<boolean> => {
  try {
    const role = await getUserRole()
    return role === 'admin'
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin:', error)
    return false
  }
}

// Função para verificar se o usuário é cliente
export const isUserClient = async (): Promise<boolean> => {
  try {
    const role = await getUserRole()
    return role === 'cliente'
  } catch (error) {
    console.error('Erro ao verificar se usuário é cliente:', error)
    return false
  }
}

// Função para atualizar o cargo de um usuário (apenas admins)
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
  try {
    // Verificar se o usuário atual é admin
    const isAdmin = await isUserAdmin()
    if (!isAdmin) {
      throw new Error('Apenas administradores podem alterar cargos')
    }

    // Atualizar o cargo usando a função do Supabase
    const { data, error } = await supabase.rpc('update_user_role', {
      target_user_id: userId,
      new_role: newRole
    })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro ao atualizar cargo do usuário:', error)
    throw error
  }
}

// Função para listar todos os usuários (apenas admins)
export const listUsers = async (): Promise<User[]> => {
  try {
    console.log('Iniciando listagem de usuários...')
    
    // Verificar se o usuário atual é admin
    const isAdmin = await isUserAdmin()
    console.log('Usuário é admin?', isAdmin)
    
    if (!isAdmin) {
      throw new Error('Apenas administradores podem listar usuários')
    }

    // Usar a função RPC para listar usuários
    console.log('Chamando função RPC list_users...')
    const { data, error } = await supabase.rpc('list_users')

    if (error) {
      console.error('Erro na função RPC list_users:', error)
      throw error
    }

    console.log('Dados retornados da função RPC:', data)
    return data || []
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    throw error
  }
}

// Função para obter informações do usuário atual
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'cliente',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    }
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
}

// Função para definir cargo padrão para novos usuários
export const setDefaultRole = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Se o usuário não tem cargo definido, definir como cliente
    if (!user.user_metadata?.role) {
      const { error } = await supabase.auth.updateUser({
        data: { role: 'cliente' }
      })

      if (error) {
        console.error('Erro ao definir cargo padrão:', error)
      }
    }
  } catch (error) {
    console.error('Erro ao definir cargo padrão:', error)
  }
} 