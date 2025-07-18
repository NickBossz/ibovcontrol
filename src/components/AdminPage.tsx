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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Substituir o estado fixo por um array dinâmico
  const [suportesResistenciasList, setSuportesResistenciasList] = useState([
    { tipo: 'suporte', valor: '' },
    { tipo: 'suporte', valor: '' },
    { tipo: 'resistencia', valor: '' },
    { tipo: 'resistencia', valor: '' },
  ]);
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);
  const [editingNiveis, setEditingNiveis] = useState<{ tipo: 'suporte' | 'resistencia', valor: string }[]>([]);
  const [editingAtivo, setEditingAtivo] = useState<{ sigla: string, referencia: string } | null>(null);

  // Verificar se o usuário é admin usando o sistema de cargos
  const userIsAdmin = isAdmin === true;

  const handleEdit = (id: string) => {
    const item = suportesResistencias?.find(sr => sr.id === id);
    if (item) {
      setEditingId(id);
      setEditingData({});
      setEditingAtivo({ sigla: item.ativo_codigo, referencia: item.ativo_nome });
      setIsEditDialogOpen(true);
      if (item.niveis && Array.isArray(item.niveis) && item.niveis.length > 0) {
        setEditingNiveis(item.niveis.map(n => ({ tipo: n.tipo, valor: n.valor.toString() })));
      } else {
        // Suporte para registros antigos
        const niveis: { tipo: 'suporte' | 'resistencia', valor: string }[] = [];
        if (item.suporte1 !== null && item.suporte1 !== undefined) niveis.push({ tipo: 'suporte', valor: item.suporte1.toString() });
        if (item.suporte2 !== null && item.suporte2 !== undefined) niveis.push({ tipo: 'suporte', valor: item.suporte2.toString() });
        if (item.resistencia1 !== null && item.resistencia1 !== undefined) niveis.push({ tipo: 'resistencia', valor: item.resistencia1.toString() });
        if (item.resistencia2 !== null && item.resistencia2 !== undefined) niveis.push({ tipo: 'resistencia', valor: item.resistencia2.toString() });
        setEditingNiveis(niveis);
      }
    }
  };

  const handleSave = async (id: string) => {
    try {
      const niveis = editingNiveis
        .filter(item => item.valor !== '' && !isNaN(Number(item.valor)))
        .map(item => ({ tipo: item.tipo, valor: Number(item.valor) }));
      await updateSuporteResistencia.mutateAsync({ id, data: { niveis } });
      setEditingId(null);
      setEditingData({});
      setEditingNiveis([]);
      setEditingAtivo(null);
      setIsEditDialogOpen(false);
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
    setEditingNiveis([]);
    setEditingAtivo(null);
    setIsEditDialogOpen(false);
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

  // Função para adicionar novo campo
  const addSuporteResistenciaField = (tipo: 'suporte' | 'resistencia') => {
    setSuportesResistenciasList(prev => [...prev, { tipo, valor: '' }]);
  };
  // Função para remover campo
  const removeSuporteResistenciaField = (index: number) => {
    setSuportesResistenciasList(prev => prev.filter((_, i) => i !== index));
  };
  // Função para atualizar valor
  const updateSuporteResistenciaValue = (index: number, valor: string) => {
    setSuportesResistenciasList(prev => prev.map((item, i) => i === index ? { ...item, valor } : item));
  };

  // Funções para edição dinâmica
  const addEditingField = (tipo: 'suporte' | 'resistencia') => {
    setEditingNiveis(prev => [...prev, { tipo, valor: '' }]);
  };
  const removeEditingField = (index: number) => {
    setEditingNiveis(prev => prev.filter((_, i) => i !== index));
  };
  const updateEditingValue = (index: number, valor: string) => {
    setEditingNiveis(prev => prev.map((item, i) => i === index ? { ...item, valor } : item));
  };

  // Atualizar handleAdd para impedir duplicidade
  const handleAdd = async () => {
    if (!selectedAtivo) {
      toast({
        title: "Ativo obrigatório",
        description: "Selecione um ativo para adicionar suportes e resistências",
        variant: "destructive",
      });
      return;
    }
    // Verificação de duplicidade
    if (suportesResistencias?.some(item => item.ativo_codigo === selectedAtivo.sigla)) {
      toast({
        title: "Ativo já cadastrado",
        description: "Já existe um cadastro de suportes e resistências para este ativo.",
        variant: "destructive",
      });
      return;
    }
    // Montar array de níveis válidos
    const niveis = suportesResistenciasList
      .filter(item => item.valor !== '' && !isNaN(Number(item.valor)))
      .map(item => ({ tipo: item.tipo as 'suporte' | 'resistencia', valor: Number(item.valor) }));
    const newItem = {
      ativo_codigo: selectedAtivo.sigla,
      ativo_nome: selectedAtivo.referencia,
      niveis,
    };
    await createSuporteResistencia.mutateAsync(newItem);
    setSuportesResistenciasList([
      { tipo: 'suporte', valor: '' },
      { tipo: 'suporte', valor: '' },
      { tipo: 'resistencia', valor: '' },
      { tipo: 'resistencia', valor: '' },
    ]);
    setSelectedAtivo(null);
    setIsAddDialogOpen(false);
    toast({
      title: "Item adicionado",
      description: "Suportes e resistências adicionados com sucesso",
    });
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
                {/* Lista dinâmica de suportes e resistências */}
                <div className="space-y-2">
                  {suportesResistenciasList.map((item, idx) => {
                    // Calcular o número correto para cada tipo
                    const numero = item.tipo === 'suporte'
                      ? suportesResistenciasList.slice(0, idx + 1).filter(i => i.tipo === 'suporte').length
                      : suportesResistenciasList.slice(0, idx + 1).filter(i => i.tipo === 'resistencia').length;
                    return (
                      <div key={idx} className="flex gap-2 items-center">
                        <Label htmlFor={`sr-${idx}`}>{item.tipo === 'suporte' ? `Suporte` : `Resistência`} {numero}</Label>
                        <Input
                          id={`sr-${idx}`}
                          type="number"
                          step="0.01"
                          placeholder={item.tipo === 'suporte' ? 'Ex: 24.80' : 'Ex: 27.20'}
                          value={item.valor}
                          onChange={e => updateSuporteResistenciaValue(idx, e.target.value)}
                          className="w-32"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSuporteResistenciaField(idx)} disabled={suportesResistenciasList.length <= 2}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => addSuporteResistenciaField('suporte')}>
                      <Plus className="mr-2 h-4 w-4" />Adicionar Suporte
                    </Button>
                    <Button type="button" variant="outline" onClick={() => addSuporteResistenciaField('resistencia')}>
                      <Plus className="mr-2 h-4 w-4" />Adicionar Resistência
                    </Button>
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
              <>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Suportes e Resistências</DialogTitle>
                    </DialogHeader>
                    {editingAtivo && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <div className="font-medium">{editingAtivo.sigla}</div>
                        <div className="text-sm text-muted-foreground">{editingAtivo.referencia}</div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {editingNiveis.map((sr, idx) => {
                        const numero = sr.tipo === 'suporte'
                          ? editingNiveis.slice(0, idx + 1).filter(i => i.tipo === 'suporte').length
                          : editingNiveis.slice(0, idx + 1).filter(i => i.tipo === 'resistencia').length;
                        return (
                          <div key={idx} className="flex gap-2 items-center">
                            <Label htmlFor={`edit-sr-${idx}`}>{sr.tipo === 'suporte' ? `Suporte` : `Resistência`} {numero}</Label>
                            <Input
                              id={`edit-sr-${idx}`}
                              type="number"
                              step="0.01"
                              placeholder={sr.tipo === 'suporte' ? 'Ex: 24.80' : 'Ex: 27.20'}
                              value={sr.valor}
                              onChange={e => updateEditingValue(idx, e.target.value)}
                              className="w-32"
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeEditingField(idx)} disabled={editingNiveis.length <= 2}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => addEditingField('suporte')}>
                          <Plus className="mr-2 h-4 w-4" />Adicionar Suporte
                        </Button>
                        <Button type="button" variant="outline" onClick={() => addEditingField('resistencia')}>
                          <Plus className="mr-2 h-4 w-4" />Adicionar Resistência
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={() => handleSave(editingId!)} className="flex-1">
                        <Save className="mr-2 h-4 w-4" />Salvar
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="flex-1">
                        Cancelar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-blue-700 border-blue-200">
                                    Ver Suportes
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56">
                                  <div className="space-y-2">
                                    <div className="font-semibold text-blue-700 mb-2">Níveis de Suporte</div>
                                    {(item.niveis && Array.isArray(item.niveis) && item.niveis.length > 0
                                      ? item.niveis.filter(n => n.tipo === 'suporte').map((n, idx) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                            <span>S{idx + 1}</span>
                                            <span className="font-medium">{formatCurrency(n.valor)}</span>
                                          </div>
                                        ))
                                      : [item.suporte1, item.suporte2].filter(v => v !== null && v !== undefined).map((v, idx) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                            <span>S{idx + 1}</span>
                                            <span className="font-medium">{formatCurrency(v)}</span>
                                          </div>
                                        ))
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          {/* Resistências */}
                          <div className="lg:col-span-3">
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Resistências</div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-700 border-red-200">
                                    Ver Resistências
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56">
                                  <div className="space-y-2">
                                    <div className="font-semibold text-red-700 mb-2">Níveis de Resistência</div>
                                    {(item.niveis && Array.isArray(item.niveis) && item.niveis.length > 0
                                      ? item.niveis.filter(n => n.tipo === 'resistencia').map((n, idx) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                            <span>R{idx + 1}</span>
                                            <span className="font-medium">{formatCurrency(n.valor)}</span>
                                          </div>
                                        ))
                                      : [item.resistencia1, item.resistencia2].filter(v => v !== null && v !== undefined).map((v, idx) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                            <span>R{idx + 1}</span>
                                            <span className="font-medium">{formatCurrency(v)}</span>
                                          </div>
                                        ))
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
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
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
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