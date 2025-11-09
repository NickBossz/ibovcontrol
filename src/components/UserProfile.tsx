import React, { useState } from 'react'
import { useAuthState } from '@/hooks/useAuthState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Mail, User, Shield, LogOut, Edit, Save, X, Crown } from 'lucide-react'
import { useUserRole } from '@/hooks/useUserRole'

export const UserProfile: React.FC = () => {
  const { user, signOut, getUserDisplayName, getUserInitials, isEmailVerified } = useAuthState()
  const { data: userRole } = useUserRole()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      })
    }
  }

  const handleSaveProfile = async () => {
    try {
      // Aqui você pode implementar a atualização do perfil
      // Por exemplo, usando o hook useUpdateProfile
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      })
    }
  }

  const getAccountStatus = () => {
    if (isEmailVerified) {
      return { label: 'Verificado', variant: 'default' as const }
    }
    return { label: 'Pendente', variant: 'secondary' as const }
  }

  const getRoleBadge = () => {
    if (userRole === 'admin') {
      return { label: 'Administrador', variant: 'default' as const, icon: Crown }
    }
    return { label: 'Cliente', variant: 'secondary' as const, icon: User }
  }

  if (!user) {
    return null
  }

  const status = getAccountStatus()

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Perfil do Usuário</CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais e configurações da conta
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar e informações básicas */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-lg">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold">
                  {getUserDisplayName()}
                </h3>
                <Badge variant={status.variant}>
                  {status.label}
                </Badge>
                {userRole && (() => {
                  const roleBadge = getRoleBadge()
                  const IconComponent = roleBadge.icon
                  return (
                    <Badge variant={roleBadge.variant} className="flex items-center gap-1">
                      <IconComponent className="h-3 w-3" />
                      {roleBadge.label}
                    </Badge>
                  )
                })()}
              </div>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <Separator />

          {/* Informações detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <User className="mr-2 h-4 w-4" />
                Informações Pessoais
              </h4>
              
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSaveProfile}>
                      <Save className="mr-1 h-3 w-3" />
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Nome</Label>
                    <p>{getUserDisplayName()}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Informações da Conta
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Último Login</Label>
                    <p className="text-sm">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Status da Conta</Label>
                    <p className="text-sm">
                      {isEmailVerified ? 'Email verificado' : 'Email pendente de verificação'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  )
} 