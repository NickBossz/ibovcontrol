import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'

interface User {
  id: string
  email: string
  role: 'cliente' | 'admin'
  name?: string
  createdAt: string
  lastSignInAt?: string
}

interface AuthContextType {
  user: User | null
  session: { token: string } | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<{ token: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há token salvo e buscar usuário
    const initAuth = async () => {
      const token = apiClient.getToken()

      if (token) {
        try {
          const response = await apiClient.get<{ user: User }>('/users/me')
          setUser(response.user)
          setSession({ token })
        } catch (error) {
          console.error('Erro ao obter usuário:', error)
          apiClient.clearToken()
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ user: User; token: string }>('/auth/login', {
        email,
        password,
      })

      apiClient.setToken(response.token)
      setUser(response.user)
      setSession({ token: response.token })

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message } }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ user: User; token: string }>('/auth/signup', {
        email,
        password,
      })

      apiClient.setToken(response.token)
      setUser(response.user)
      setSession({ token: response.token })

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message } }
    }
  }

  const signOut = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      apiClient.clearToken()
      setUser(null)
      setSession(null)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await apiClient.post('/auth/reset-password', { email })
      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message } }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 