import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AtivoSelector } from "./AtivoSelector";
import { 
  Edit, 
  Save, 
  X, 
  Plus,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  Shield,
  Target,
  Calendar,
  User,
  Settings,
  Users,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { usePlanilhaData } from "@/hooks/usePlanilha";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { UserManagement } from "./UserManagement";
import { 
  useSuportesResistencias, 
  useCreateSuporteResistencia, 
  useUpdateSuporteResistencia,
  useDeleteSuporteResistencia 
} from "@/hooks/useSuportesResistencias";
import { type CreateSuporteResistencia, type UpdateSuporteResistencia } from "@/services/suportesResistenciasService";
import { Ativo } from "@/services/googleSheets";

export function AdminPage() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: planilhaData } = usePlanilhaData();
  const { toast } = useToast();
  
  // Hooks para suportes e resistências
  const { data: suportesResistencias, isLoading: loadingSuportes } = useSuportesResistencias();
  const createSuporteResistencia = useCreateSuporteResistencia();
  const updateSuporteResistencia = useUpdateSuporteResistencia();
  const deleteSuporteResistencia = useDeleteSuporteResistencia();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<UpdateSuporteResistencia>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSuporteResistencia, setNewSuporteResistencia] = useState({
    suporte1: '',
    suporte2: '',
    resistencia1: '',
    resistencia2: ''
  });
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);

  // Verificar se o usuário é admin usando o sistema de cargos
  const userIsAdmin = isAdmin === true;

  const handleEdit = (id: string) => {
    const item = suportesResistencias?.find(sr => sr.id === id);
    if (item) {
      setEditingId(id);
      setEditingData({
        suporte1: item.suporte1 || undefined,
        suporte2: item.suporte2 || undefined,
        resistencia1: item.resistencia1 || undefined,
        resistencia2: item.resistencia2 || undefined
      });
    }
  };

  const handleSave = async (id: string) => {
    try {
      await updateSuporteResistencia.mutateAsync({ id, data: editingData });
      
      setEditingId(null);
      setEditingData({});
      
      toast({
        title: "Alterações salvas",
        description: "Suportes e resistências atualizados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSuporteResistencia.mutateAsync(id);
      toast({
        title: "Item removido",
        description: "Suporte e resistência removidos com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive",
      });
    }
  };

  const handleAdd = async () => {
    if (!selectedAtivo) {
      toast({
        title: "Ativo obrigatório",
        description: "Selecione um ativo para adicionar suportes e resistências",
        variant: "destructive",
      });
      return;
    }

    try {
      const newItem: CreateSuporteResistencia = {
        ativo_codigo: selectedAtivo.sigla,
        ativo_nome: selectedAtivo.referencia,
        suporte1: newSuporteResistencia.suporte1 ? parseFloat(newSuporteResistencia.suporte1) : undefined,
        suporte2: newSuporteResistencia.suporte2 ? parseFloat(newSuporteResistencia.suporte2) : undefined,
        resistencia1: newSuporteResistencia.resistencia1 ? parseFloat(newSuporteResistencia.resistencia1) : undefined,
        resistencia2: newSuporteResistencia.resistencia2 ? parseFloat(newSuporteResistencia.resistencia2) : undefined,
      };

      await createSuporteResistencia.mutateAsync(newItem);
      
      setNewSuporteResistencia({
        suporte1: '',
        suporte2: '',
        resistencia1: '',
        resistencia2: ''
      });
      setSelectedAtivo(null);
      setIsAddDialogOpen(false);

      toast({
        title: "Item adicionado",
        description: "Suporte e resistência adicionados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive",
      });
    }
  };

  const filteredData = suportesResistencias?.filter(item =>
    item.ativo_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ativo_nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Faça login para acessar o painel administrativo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Verificando Permissões</h3>
              <p className="text-muted-foreground">
                Carregando informações de acesso...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userIsAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, suportes e resistências do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="h-4 w-4 mr-2" />
            Administrador
          </Badge>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Ativo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Suporte e Resistência</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ativo_selector">Selecionar Ativo</Label>
                  <AtivoSelector
                    value={selectedAtivo?.sigla}
                    onSelect={setSelectedAtivo}
                    placeholder="Buscar por sigla ou nome da empresa..."
                  />
                  {selectedAtivo && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{selectedAtivo.sigla}</div>
                          <div className="text-sm text-muted-foreground">{selectedAtivo.referencia}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(selectedAtivo.precoAtual)}</div>
                          <div className={cn(
                            "text-sm",
                            selectedAtivo.variacaoPercentual >= 0 ? "text-financial-gain" : "text-financial-loss"
                          )}>
                            {selectedAtivo.variacaoPercentual >= 0 ? '+' : ''}{selectedAtivo.variacaoPercentual.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="suporte1">Suporte 1 (R$)</Label>
                    <Input
                      id="suporte1"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 25.50"
                      value={newSuporteResistencia.suporte1}
                      onChange={(e) => setNewSuporteResistencia(prev => ({ ...prev, suporte1: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="suporte2">Suporte 2 (R$)</Label>
                    <Input
                      id="suporte2"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 24.80"
                      value={newSuporteResistencia.suporte2}
                      onChange={(e) => setNewSuporteResistencia(prev => ({ ...prev, suporte2: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resistencia1">Resistência 1 (R$)</Label>
                    <Input
                      id="resistencia1"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 27.20"
                      value={newSuporteResistencia.resistencia1}
                      onChange={(e) => setNewSuporteResistencia(prev => ({ ...prev, resistencia1: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resistencia2">Resistência 2 (R$)</Label>
                    <Input
                      id="resistencia2"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 28.10"
                      value={newSuporteResistencia.resistencia2}
                      onChange={(e) => setNewSuporteResistencia(prev => ({ ...prev, resistencia2: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAdd} className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Registrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suportes Configurados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.length}</div>
            <p className="text-xs text-muted-foreground">
              Ativos com níveis
            </p>
          </CardContent>
        </Card>


      </div>

      {/* Tabela de Suportes e Resistências */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Suportes e Resistências
            <Badge variant="secondary" className="ml-2">
              {filteredData.length} ativos configurados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Busca e Filtros */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por sigla ou referência..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button variant="outline" className="sm:w-auto h-12 px-6">
                <Filter className="mr-2 h-4 w-4" />
                Filtros Avançados
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Loading state */}
            {loadingSuportes && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Carregando suportes e resistências...</span>
                </div>
              </div>
            )}

            {/* Lista de itens */}
            {!loadingSuportes && filteredData.length > 0 ? (
              <div className="grid gap-4">
                {filteredData.map((item) => (
                  <Card key={item.id} className="transition-all hover:shadow-md border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        {/* Ativo */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {item.ativo_codigo.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-lg">{item.ativo_codigo}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-32">
                                {item.ativo_nome}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Suportes */}
                        <div className="lg:col-span-3">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Suportes</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-muted-foreground">S1</div>
                                <div className="text-sm font-medium text-blue-600">
                                  {formatCurrency(item.suporte1)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">S2</div>
                                <div className="text-sm font-medium text-blue-600">
                                  {formatCurrency(item.suporte2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Resistências */}
                        <div className="lg:col-span-3">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Resistências</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-muted-foreground">R1</div>
                                <div className="text-sm font-medium text-red-600">
                                  {formatCurrency(item.resistencia1)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">R2</div>
                                <div className="text-sm font-medium text-red-600">
                                  {formatCurrency(item.resistencia2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Informações */}
                        <div className="lg:col-span-2">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Última Modificação</div>
                            <div className="text-sm font-medium">{formatDateTime(item.ultima_modificacao)}</div>
                            <div className="text-xs text-muted-foreground">
                              Admin: {item.admin_id || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center gap-2">
                            {editingId === item.id ? (
                              <>
                                <Button size="sm" onClick={() => handleSave(item.id)}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleCancel}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleEdit(item.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !loadingSuportes ? (
              <div className="text-center py-8">
                <div className="max-w-md mx-auto">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm ? "Nenhum item encontrado" : "Nenhum suporte e resistência cadastrado"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "Tente ajustar os termos de busca" : "Comece adicionando suportes e resistências para os ativos"}
                  </p>
                  {!searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Item
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Usuários */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Usuários
            <Badge variant="secondary" className="ml-2">
              Sistema de Cargos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagement />
        </CardContent>
      </Card>

      {/* Informações de Controle */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Última Atualização</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(new Date().toISOString())}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Administrador Ativo</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ativos Configurados</p>
                <p className="text-xs text-muted-foreground">{filteredData.length} ativos com suportes/resistências</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}