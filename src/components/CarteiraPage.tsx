import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AtivoSelector } from "./AtivoSelector";
import { SuporteResistenciaCard } from "./SuporteResistenciaCard";
import { 
  Plus, 
  Trash2, 
  Edit, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  BarChart3,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  Target,
  TrendingUpIcon,
  TrendingDownIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatDate } from "@/lib/formatters";
import { useCarteira, useCarteiraStats, useAddAtivoToCarteira, useRemoveAtivoFromCarteira } from "@/hooks/useCarteira";
import { usePlanilhaData } from "@/hooks/usePlanilha";
import { useSuportesResistencias } from "@/hooks/useSuportesResistencias";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Ativo } from "@/services/googleSheets";
import { Dialog as Modal, DialogContent as ModalContent, DialogHeader as ModalHeader, DialogTitle as ModalTitle, DialogTrigger as ModalTrigger } from "@/components/ui/dialog";

export function CarteiraPage() {
  const { user } = useAuth();
  const { data: carteira, isLoading } = useCarteira();
  const { data: stats } = useCarteiraStats();
  const { data: planilhaData } = usePlanilhaData();
  const { data: suportesResistencias } = useSuportesResistencias();
  const addAtivoMutation = useAddAtivoToCarteira();
  const removeAtivoMutation = useRemoveAtivoFromCarteira();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAtivo, setNewAtivo] = useState({
    ativo_codigo: '',
    quantidade: '',
    preco_medio: '',
    data_compra: new Date().toISOString().split('T')[0]
  });
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);
  const [modalEntradasOpen, setModalEntradasOpen] = useState(false);
  const [ativoEntradas, setAtivoEntradas] = useState<string | null>(null);

  // Função para buscar todas as entradas de um ativo
  const entradasAtivo = carteira && ativoEntradas
    ? carteira.filter((a) => a.ativo_codigo === ativoEntradas)
    : [];

  // Corrigir o cálculo do preço médio consolidado:
  const calcularPrecoMedio = (entradas) => {
    if (!entradas || entradas.length === 0) return "";
    
    const somaProduto = entradas.reduce((acc, e) => acc + e.quantidade * e.preco_medio, 0);
    const somaQuantidade = entradas.reduce((acc, e) => acc + e.quantidade, 0);
  
    return somaQuantidade === 0 ? "" : somaProduto / somaQuantidade;
  };
  
  
  const precoMedioConsolidado = calcularPrecoMedio(entradasAtivo);

  const handleAddAtivo = async () => {
    if (!selectedAtivo || !newAtivo.quantidade || !newAtivo.preco_medio) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um ativo e preencha quantidade e preço médio",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verifica se o ativo já existe na carteira
      const ativoExistente = carteira?.find(
        (a) => a.ativo_codigo === selectedAtivo.sigla
      );

      let quantidadeTotal = parseFloat(newAtivo.quantidade);
      let precoMedioFinal = parseFloat(newAtivo.preco_medio);

      if (ativoExistente) {
        // Se já existe, calcula o novo preço médio
        const quantidadeAnterior = ativoExistente.quantidade;
        const precoMedioAnterior = ativoExistente.preco_medio;
        quantidadeTotal = quantidadeAnterior + parseFloat(newAtivo.quantidade);
        precoMedioFinal =
          (quantidadeAnterior * precoMedioAnterior +
            parseFloat(newAtivo.quantidade) * parseFloat(newAtivo.preco_medio)) /
          quantidadeTotal;

        // Atualiza o ativo existente
        await addAtivoMutation.mutateAsync({
          id: ativoExistente.id,
          ativo_codigo: selectedAtivo.sigla,
          quantidade: quantidadeTotal,
          preco_medio: precoMedioFinal,
          data_compra: newAtivo.data_compra,
          update: true, // flag para indicar update
        });
      } else {
        // Se não existe, adiciona normalmente
        await addAtivoMutation.mutateAsync({
          ativo_codigo: selectedAtivo.sigla,
          quantidade: quantidadeTotal,
          preco_medio: precoMedioFinal,
          data_compra: newAtivo.data_compra,
        });
      }

      setNewAtivo({
        ativo_codigo: '',
        quantidade: '',
        preco_medio: '',
        data_compra: new Date().toISOString().split('T')[0],
      });
      setSelectedAtivo(null);
      setIsAddDialogOpen(false);

      toast({
        title: "Ativo adicionado",
        description: "Ativo adicionado à carteira com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar ativo à carteira",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAtivo = async (id: string) => {
    try {
      await removeAtivoMutation.mutateAsync(id);
      toast({
        title: "Ativo removido",
        description: "Ativo removido da carteira com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover ativo da carteira",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Faça login para acessar sua carteira pessoal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minha Carteira</h1>
          <p className="text-muted-foreground">
            Gerencie seus investimentos e acompanhe a rentabilidade
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Ativo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Ativo à Carteira</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ativo_codigo">Selecionar Ativo</Label>
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
                          {formatPercent(selectedAtivo.variacaoPercentual)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={newAtivo.quantidade}
                  onChange={(e) => setNewAtivo(prev => ({ ...prev, quantidade: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="preco_medio">Preço Médio (R$)</Label>
                <Input
                  id="preco_medio"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 25.50"
                  value={newAtivo.preco_medio}
                  onChange={(e) => setNewAtivo(prev => ({ ...prev, preco_medio: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="data_compra">Data de Compra</Label>
                <Input
                  id="data_compra"
                  type="date"
                  value={newAtivo.data_compra}
                  onChange={(e) => setNewAtivo(prev => ({ ...prev, data_compra: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAddAtivo}
                  disabled={addAtivoMutation.isPending}
                  className="flex-1"
                >
                  {addAtivoMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Adicionar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo da Carteira */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(() => {
                    if (!carteira || !planilhaData) return formatCurrency(0);
                    const totalValue = carteira.reduce((sum, ativo) => {
                      const ativoAtualizado = planilhaData.ativos.find(a => a.sigla === ativo.ativo_codigo);
                      const currentPrice = ativoAtualizado?.precoAtual || ativo.preco_medio;
                      return sum + (ativo.quantidade * currentPrice);
                    }, 0);
                    return formatCurrency(totalValue);
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor atual da carteira
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Novo Card: Total Gasto */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(() => {
                    if (!carteira) return formatCurrency(0);
                    const totalGasto = carteira.reduce((sum, ativo) => {
                      return sum + (ativo.quantidade * ativo.preco_medio);
                    }, 0);
                    return formatCurrency(totalGasto);
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Soma de todas as compras realizadas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retorno</CardTitle>
            {(stats?.totalReturn || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-financial-gain" />
            ) : (
              <TrendingDown className="h-4 w-4 text-financial-loss" />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : (
              <>
                <div className={cn(
                  "text-2xl font-bold",
                  (() => {
                    if (!carteira || !planilhaData) return "text-muted-foreground";
                    const totalInvested = carteira.reduce((sum, ativo) => sum + (ativo.quantidade * ativo.preco_medio), 0);
                    const totalValue = carteira.reduce((sum, ativo) => {
                      const ativoAtualizado = planilhaData.ativos.find(a => a.sigla === ativo.ativo_codigo);
                      const currentPrice = ativoAtualizado?.precoAtual || ativo.preco_medio;
                      return sum + (ativo.quantidade * currentPrice);
                    }, 0);
                    const totalReturn = totalValue - totalInvested;
                    return totalReturn >= 0 ? "text-financial-gain" : "text-financial-loss";
                  })()
                )}>
                  {(() => {
                    if (!carteira || !planilhaData) return formatCurrency(0);
                    const totalInvested = carteira.reduce((sum, ativo) => sum + (ativo.quantidade * ativo.preco_medio), 0);
                    const totalValue = carteira.reduce((sum, ativo) => {
                      const ativoAtualizado = planilhaData.ativos.find(a => a.sigla === ativo.ativo_codigo);
                      const currentPrice = ativoAtualizado?.precoAtual || ativo.preco_medio;
                      return sum + (ativo.quantidade * currentPrice);
                    }, 0);
                    const totalReturn = totalValue - totalInvested;
                    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
                    return formatPercent(returnPercent);
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    if (!carteira || !planilhaData) return formatPercent(0);
                    const totalInvested = carteira.reduce((sum, ativo) => sum + (ativo.quantidade * ativo.preco_medio), 0);
                    const totalValue = carteira.reduce((sum, ativo) => {
                      const ativoAtualizado = planilhaData.ativos.find(a => a.sigla === ativo.ativo_codigo);
                      const currentPrice = ativoAtualizado?.precoAtual || ativo.preco_medio;
                      return sum + (ativo.quantidade * currentPrice);
                    }, 0);
                    const totalReturn = totalValue - totalInvested;
                    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
                    return formatPercent(returnPercent);
                  })()}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{carteira?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total de ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suportes e Resistências dos Ativos da Carteira */}
      {carteira && carteira.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análise Técnica da Carteira
              <Badge variant="secondary" className="ml-2">
                {carteira.filter(ativo => {
                  const suporteResistencia = suportesResistencias?.find(sr => sr.ativo_codigo === ativo.ativo_codigo);
                  return suporteResistencia;
                }).length} ativos com análise
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {carteira.map((ativo) => {
                // Buscar dados atualizados do ativo na planilha
                const ativoAtualizado = planilhaData?.ativos.find(a => a.sigla === ativo.ativo_codigo);
                // Buscar suportes e resistências do ativo
                const suporteResistencia = suportesResistencias?.find(sr => sr.ativo_codigo === ativo.ativo_codigo);
                
                if (!ativoAtualizado || !suporteResistencia) return null;

                return (
                  <SuporteResistenciaCard
                    key={ativo.id}
                    suporteResistencia={suporteResistencia}
                    precoAtual={ativoAtualizado.precoAtual}
                    variacaoPercentual={ativoAtualizado.variacaoPercentual}
                    volume={ativoAtualizado.volume}
                    showChart={true}
                    showAlert={true}
                  />
                );
              }).filter(Boolean)}
            </div>
            {carteira.filter(ativo => {
              const suporteResistencia = suportesResistencias?.find(sr => sr.ativo_codigo === ativo.ativo_codigo);
              return suporteResistencia;
            }).length === 0 && (
              <div className="text-center py-8">
                <div className="max-w-md mx-auto">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma análise técnica disponível</h3>
                  <p className="text-muted-foreground">
                    Nenhum ativo da sua carteira possui suportes e resistências configurados pelos administradores.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabela da Carteira */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Ativos da Carteira
            <Badge variant="secondary" className="ml-2">
              {carteira?.length || 0} ativos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">

            {/* Lista de ativos */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Carregando carteira...</span>
                </div>
              </div>
            ) : carteira && carteira.length > 0 ? (
              carteira.map((ativo) => {
                // Buscar dados atualizados do ativo na planilha
                const ativoAtualizado = planilhaData?.ativos.find(a => a.sigla === ativo.ativo_codigo);
                const currentPrice = ativoAtualizado?.precoAtual || ativo.preco_medio;
                const totalValue = ativo.quantidade * currentPrice;
                const totalInvested = ativo.quantidade * ativo.preco_medio;
                const totalReturn = totalValue - totalInvested;
                const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

                return (
                  <Card key={ativo.id} className={cn(
                    "transition-all hover:shadow-md",
                    totalReturn >= 0 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
                  )}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center">
                        {/* Ativo */}
                        <div className="lg:col-span-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {ativo.ativo_codigo.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-lg">{ativo.ativo_codigo}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-32">
                                {ativoAtualizado?.referencia || 'Nome não disponível'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quantidade */}
                        <div className="lg:col-span-1">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Qtd</div>
                            <div className="font-semibold text-lg">{ativo.quantidade}</div>
                          </div>
                        </div>

                        {/* Preço Médio */}
                        <div className="lg:col-span-1">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Média</div>
                            <div className="font-semibold text-lg">{formatCurrency(ativo.preco_medio)}</div>
                          </div>
                        </div>

                        {/* Preço Atual */}
                        <div className="lg:col-span-1">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Atual</div>
                            <div className="font-semibold text-lg">{formatCurrency(currentPrice)}</div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="lg:col-span-1">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Total</div>
                            <div className="font-semibold text-lg">{formatCurrency(totalValue)}</div>
                          </div>
                        </div>

                        {/* Retorno */}
                        <div className="lg:col-span-1">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Retorno</div>
                            <div className={cn(
                              "font-semibold text-lg",
                              totalReturn >= 0 ? "text-financial-gain" : "text-financial-loss"
                            )}>
                              {formatCurrency(totalReturn)}
                            </div>
                            <div className={cn(
                              "text-sm",
                              totalReturn >= 0 ? "text-financial-gain" : "text-financial-loss"
                            )}>
                              {formatPercent(returnPercent)}
                            </div>
                          </div>
                        </div>

                        {/* Data Compra */}
                        <div className="lg:col-span-1">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Compra</div>
                            <div className="font-medium">{formatDate(ativo.data_compra)}</div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="lg:col-span-1">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRemoveAtivo(ativo.id)}
                              disabled={removeAtivoMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {removeAtivoMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                            {/* Modal de Entradas do Ativo */}
                            <Modal>
                              <ModalTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAtivoEntradas(ativo.ativo_codigo)}
                                >
                                  Ver Entradas
                                </Button>
                              </ModalTrigger>
                              <ModalContent>
                                <ModalHeader>
                                  <ModalTitle>Entradas de {ativo.ativo_codigo}</ModalTitle>
                                </ModalHeader>
                                <div className="space-y-4">
                                  {carteira && carteira.filter((a) => a.ativo_codigo === ativo.ativo_codigo).length === 0 ? (
                                    <div className="text-center text-muted-foreground">Nenhuma entrada encontrada.</div>
                                  ) : (
                                    (() => {
                                      const entradasAtivo = carteira.filter((a) => a.ativo_codigo === ativo.ativo_codigo);
                                      const precoMedioConsolidado = calcularPrecoMedio(entradasAtivo);
                                      return (
                                        <>
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr>
                                                <th className="text-left p-2">Quantidade</th>
                                                <th className="text-left p-2">Preço</th>
                                                <th className="text-left p-2">Data</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {entradasAtivo.map((entrada) => (
                                                <tr key={entrada.id}>
                                                  <td className="p-2">{entrada.quantidade}</td>
                                                  <td className="p-2">{formatCurrency(entrada.preco_medio)}</td>
                                                  <td className="p-2">{formatDate(entrada.data_compra)}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                          <div className="pt-4 text-right">
                                            <span className="font-medium">Preço Médio Consolidado: </span>
                                            <span>{precoMedioConsolidado === "" ? "-" : formatCurrency(precoMedioConsolidado)}</span>
                                          </div>
                                        </>
                                      );
                                    })()
                                  )}
                                </div>
                              </ModalContent>
                            </Modal>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum ativo na carteira
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Ativo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}