import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useUsers, useUpdateUserRole } from '@/hooks/useUserRole'
import { User, Crown, Loader2, RefreshCw, Shield, Calendar, Mail, Users } from 'lucide-react'
import { UserRole } from '@/services/userService'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/formatters'

export function UserManagement() {
  const { data: users, isLoading, refetch } = useUsers()
  const updateUserRole = useUpdateUserRole()
  const { toast } = useToast()
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUser(userId)
    try {
      await updateUserRole.mutateAsync({ userId, newRole })
      toast({
        title: 'Cargo atualizado',
        description: 'O cargo do usuário foi alterado com sucesso',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar cargo do usuário',
        variant: 'destructive',
      })
    } finally {
      setUpdatingUser(null)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    if (role === 'admin') {
      return { 
        label: 'Administrador', 
        variant: 'default' as const, 
        icon: Crown,
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    }
    return { 
      label: 'Cliente', 
      variant: 'secondary' as const, 
      icon: User,
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando usuários...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">Total de Usuários</div>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">Administradores</div>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.role === 'admin').length || 0}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center text-white">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">Clientes</div>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.role === 'cliente').length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Botão de atualizar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </Button>
      </div>

      {/* Lista de usuários */}
      {users && users.length > 0 ? (
        <div className="grid gap-4">
          {users.map((user) => {
            const roleBadge = getRoleBadge(user.role)
            return (
              <Card key={user.id} className="transition-all hover:shadow-md border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  {/* Layout responsivo para mobile */}
                  <div className="lg:hidden space-y-3">
                    {/* Header com avatar e email */}
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-lg truncate" title={user.email}>
                          {user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>

                    {/* Informações em grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Cargo</div>
                        <Badge variant="outline" className={cn("mt-1 flex items-center gap-1 w-fit", roleBadge.className)}>
                          {(() => {
                            const IconComponent = roleBadge.icon
                            return <IconComponent className="h-3 w-3" />
                          })()}
                          {roleBadge.label}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Registro</div>
                        <div className="text-sm font-medium mt-1">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    {/* Último login e ações */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <div className="text-sm text-muted-foreground">Último Login</div>
                        <div className="text-sm font-medium">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                          disabled={updatingUser === user.id}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cliente">Cliente</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingUser === user.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Layout desktop */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                    {/* Avatar e Email */}
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-lg truncate" title={user.email}>
                            {user.email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cargo */}
                    <div className="lg:col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Cargo Atual</div>
                        <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", roleBadge.className)}>
                          {(() => {
                            const IconComponent = roleBadge.icon
                            return <IconComponent className="h-3 w-3" />
                          })()}
                          {roleBadge.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Data de Registro */}
                    <div className="lg:col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Data de Registro</div>
                        <div className="text-sm font-medium">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    {/* Último Login */}
                    <div className="lg:col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Último Login</div>
                        <div className="text-sm font-medium">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                          disabled={updatingUser === user.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cliente">Cliente</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingUser === user.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground">
              Não há usuários registrados no sistema
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 