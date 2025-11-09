import { useAuth } from '@/contexts/AuthContext'
import { useCallback } from 'react'

export const useAuthState = () => {
  const { user, session, loading, signIn, signUp, signOut, resetPassword } = useAuth()

  const isAuthenticated = !!user
  const isEmailVerified = !!user?.email_confirmed_at
  const isAdmin = user?.app_metadata?.role === 'admin'

  const getUserDisplayName = useCallback(() => {
    if (!user) return ''
    
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Usuário'
    )
  }, [user])

  const getUserInitials = useCallback(() => {
    if (!user?.email) return ''
    
    const name = getUserDisplayName()
    if (name.includes(' ')) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    
    return name.substring(0, 2).toUpperCase()
  }, [user, getUserDisplayName])

  const canAccess = useCallback((requiredRole?: string) => {
    if (!isAuthenticated) return false
    if (!requiredRole) return true
    
    return user?.app_metadata?.role === requiredRole
  }, [isAuthenticated, user])

  return {
    // Estado
    user,
    session,
    loading,
    isAuthenticated,
    isEmailVerified,
    isAdmin,
    
    // Funções de autenticação
    signIn,
    signUp,
    signOut,
    resetPassword,
    
    // Utilitários
    getUserDisplayName,
    getUserInitials,
    canAccess,
  }
} 