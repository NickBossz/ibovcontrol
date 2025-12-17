import { apiClient } from '@/lib/apiClient'

export type UserRole = 'cliente' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at?: string
  createdAt?: string
  last_sign_in_at?: string
  lastSignInAt?: string
}

// Função para obter o cargo do usuário atual
export const getUserRole = async (): Promise<UserRole | null> => {
  try {
    const response = await apiClient.get<{ role: UserRole }>('/users/role')
    return response.role
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
    console.log('Iniciando atualização de cargo:', { userId, newRole })

    if (!userId || !newRole) {
      throw new Error('Parâmetros inválidos: userId e newRole são obrigatórios')
    }

    if (!['cliente', 'admin'].includes(newRole)) {
      throw new Error('Cargo inválido. Use "cliente" ou "admin"')
    }

    await apiClient.put('/users/update-role', { userId, newRole })

    console.log('Cargo atualizado com sucesso')
    return true
  } catch (error) {
    console.error('Erro ao atualizar cargo do usuário:', error)
    throw error
  }
}

// Função para listar todos os usuários (apenas admins)
export const listUsers = async (): Promise<User[]> => {
  try {
    console.log('Iniciando listagem de usuários...')

    const response = await apiClient.get<{ users: User[] }>('/users/list')

    console.log('Dados retornados da API:', response.users)
    return response.users || []
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    throw error
  }
}

// Função para obter informações do usuário atual
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiClient.get<{ user: User }>('/users/me')
    return response.user
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
} 