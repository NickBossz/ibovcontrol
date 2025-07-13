import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SupabaseLogin } from './SupabaseLogin'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || <SupabaseLogin />
  }

  return <>{children}</>
} 