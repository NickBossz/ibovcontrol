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
  TrendingDownIcon,
  ListOrdered,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatDate } from "@/lib/formatters";
import { useCarteira, useCarteiraStats, useAddAtivoToCarteira, useRemoveAtivoFromCarteira, useAddOperacaoCarteira, useOperacoesCarteira, useRemoveOperacaoCarteira } from "@/hooks/useCarteira";
import { usePlanilhaData } from "@/hooks/usePlanilha";
import { useSuportesResistencias } from "@/hooks/useSuportesResistencias";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Ativo } from "@/services/googleSheets";
import { Dialog as Modal, DialogContent as ModalContent, DialogHeader as ModalHeader, DialogTitle as ModalTitle, DialogTrigger as ModalTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

export function CarteiraPage() {
  const { user } = useAuth();
  const { data: carteira, isLoading } = useCarteira();
  const { data: stats } = useCarteiraStats();
  const { data: planilhaData } = usePlanilhaData();
  const { data: suportesResistencias } = useSuportesResistencias();
  const addAtivoMutation = useAddAtivoToCarteira();
  const removeAtivoMutation = useRemoveAtivoFromCarteira();
  const addOperacaoCarteira = useAddOperacaoCarteira();
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
  const [tipoOperacao, setTipoOperacao] = useState<'entrada' | 'saida'>('entrada');
  // Adicionar estado para modal de operações
  const [modalOperacoesOpen, setModalOperacoesOpen] = useState(false);
  const [ativoOperacoes, setAtivoOperacoes] = useState<string | null>(null);

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
      const ativoExistente = carteira?.find(
        (a) => a.ativo_codigo === selectedAtivo.sigla
      );
      const quantidadeOperacao = parseFloat(newAtivo.quantidade);
      const precoOperacao = parseFloat(newAtivo.preco_medio);
      const dataOperacao = newAtivo.data_compra;
      const userId = user?.id;
      if (!userId) return;

      if (tipoOperacao === 'entrada') {
        let quantidadeTotal = quantidadeOperacao;
        let precoMedioFinal = precoOperacao;
        if (ativoExistente) {
          const quantidadeAnterior = ativoExistente.quantidade;
          const precoMedioAnterior = ativoExistente.preco_medio;
          quantidadeTotal = quantidadeAnterior + quantidadeOperacao;
          precoMedioFinal =
            (quantidadeAnterior * precoMedioAnterior +
              quantidadeOperacao * precoOperacao) /
            quantidadeTotal;
          await addAtivoMutation.mutateAsync({
            id: ativoExistente.id,
            ativo_codigo: selectedAtivo.sigla,
            quantidade: quantidadeTotal,
            preco_medio: precoMedioFinal,
            data_compra: newAtivo.data_compra,
            update: true,
          });
        } else {
          await addAtivoMutation.mutateAsync({
            ativo_codigo: selectedAtivo.sigla,
            quantidade: quantidadeTotal,
            preco_medio: precoMedioFinal,
            data_compra: newAtivo.data_compra,
          });
        }
        // Registrar operação de entrada
        await addOperacaoCarteira.mutateAsync({
          user_id: userId,
          ativo_codigo: selectedAtivo.sigla,
          tipo_operacao: 'entrada',
          quantidade: quantidadeOperacao,
          preco: precoOperacao,
          data_operacao: dataOperacao,
        });
        toast({
          title: "Ativo adicionado",
          description: "Ativo adicionado à carteira com sucesso",
        });
      } else if (tipoOperacao === 'saida') {
        if (!ativoExistente) {
          toast({
            title: "Ativo não encontrado",
            description: "Você não possui esse ativo na carteira.",
            variant: "destructive",
          });
          return;
        }
        if (quantidadeOperacao > ativoExistente.quantidade) {
          toast({
            title: "Quantidade insuficiente",
            description: "Você não possui quantidade suficiente desse ativo para realizar a saída.",
            variant: "destructive",
          });
          return;
        }
        const novaQuantidade = ativoExistente.quantidade - quantidadeOperacao;
        if (novaQuantidade === 0) {
          await removeAtivoMutation.mutateAsync(ativoExistente.id);
        } else {
          await addAtivoMutation.mutateAsync({
            id: ativoExistente.id,
            ativo_codigo: selectedAtivo.sigla,
            quantidade: novaQuantidade,
            preco_medio: ativoExistente.preco_medio, // não altera preço médio
            data_compra: ativoExistente.data_compra,
            update: true,
          });
        }
        // Registrar operação de saída
        await addOperacaoCarteira.mutateAsync({
          user_id: userId,
          ativo_codigo: selectedAtivo.sigla,
          tipo_operacao: 'saida',
          quantidade: quantidadeOperacao,
          preco: precoOperacao,
          data_operacao: dataOperacao,
        });
        toast({
          title: "Saída realizada",
          description: "Quantidade removida da carteira com sucesso.",
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
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar operação na carteira",
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
                <Label>Tipo de Operação</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tipo_operacao"
                      value="entrada"
                      checked={tipoOperacao === 'entrada'}
                      onChange={() => setTipoOperacao('entrada')}
                    />
                    Entrada
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tipo_operacao"
                      value="saida"
                      checked={tipoOperacao === 'saida'}
                      onChange={() => setTipoOperacao('saida')}
                    />
                    Saída
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="data_compra">Data da Operação</Label>
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
                    precoMedioCarteira={ativo.preco_medio}
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

                        {/* Discrepância */}
                        <div className="lg:col-span-1">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Discrepância</div>
                            <div className={cn(
                              "font-semibold text-lg",
                              currentPrice > ativo.preco_medio ? "text-financial-gain" : "text-financial-loss"
                            )}>
                              {(() => {
                                const diff = ((currentPrice - ativo.preco_medio) / ativo.preco_medio) * 100;
                                if (!isFinite(diff)) return '-';
                                return (diff >= 0 ? '+' : '') + diff.toFixed(2) + '%';
                              })()}
                            </div>
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
                            {/* Modal de Operações do Ativo */}
                            <Modal>
                              <ModalTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setAtivoOperacoes(ativo.ativo_codigo);
                                    setModalOperacoesOpen(true);
                                  }}
                                >
                                  <ListOrdered className="h-4 w-4 mr-1" />
                                  Ver Operações
                                </Button>
                              </ModalTrigger>
                              <ModalContent className="max-w-4xl">
                                <ModalHeader>
                                  <ModalTitle>Histórico de Operações - {ativo.ativo_codigo}</ModalTitle>
                                </ModalHeader>
                                <OperacoesAtivoModal ativoCodigo={ativo.ativo_codigo} />
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

function OperacoesAtivoModal({ ativoCodigo }: { ativoCodigo: string }) {
  const { data: operacoes, isLoading } = useOperacoesCarteira(ativoCodigo);
  const removeOperacaoMutation = useRemoveOperacaoCarteira();
  const { toast } = useToast();

  // Calcular estatísticas
  let quantidadeTotal = 0;
  let totalInvestido = 0;
  let totalRetirado = 0;
  
  if (operacoes) {
    operacoes.forEach(op => {
      if (op.tipo_operacao === 'entrada') {
        quantidadeTotal += op.quantidade;
        totalInvestido += op.quantidade * op.preco;
      } else if (op.tipo_operacao === 'saida') {
        quantidadeTotal -= op.quantidade;
        totalRetirado += op.quantidade * op.preco;
      }
    });
  }
  
  const precoMedio = quantidadeTotal > 0 ? totalInvestido / quantidadeTotal : 0;

  const handleRemoveOperacao = async (operacaoId: string) => {
    try {
      await removeOperacaoMutation.mutateAsync(operacaoId);
      toast({
        title: "Operação removida",
        description: "A operação foi removida com sucesso e a carteira foi atualizada",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover a operação",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumo da posição */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Quantidade Total</div>
          <div className="text-lg font-semibold">{quantidadeTotal}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Preço Médio</div>
          <div className="text-lg font-semibold">
            {precoMedio > 0 ? formatCurrency(precoMedio) : '-'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Total Investido</div>
          <div className="text-lg font-semibold text-green-600">
            {formatCurrency(totalInvestido - totalRetirado)}
          </div>
        </div>
      </div>

      {/* Tabela de operações */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead className="w-[50px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando operações...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : operacoes && operacoes.length > 0 ? (
              operacoes.map(op => (
                <TableRow 
                  key={op.id} 
                  className={op.tipo_operacao === 'saida' ? 'bg-red-50/60 dark:bg-red-900/20' : 'bg-green-50/40 dark:bg-green-900/10'}
                >
                  <TableCell>{formatDate(op.data_operacao)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {op.tipo_operacao === 'entrada' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <Badge 
                        variant={op.tipo_operacao === 'entrada' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {op.tipo_operacao === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{op.quantidade}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(op.preco)}</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(op.quantidade * op.preco)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOperacao(op.id!)}
                      disabled={removeOperacaoMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removeOperacaoMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="space-y-2">
                    <div className="text-muted-foreground">Nenhuma operação registrada</div>
                    <div className="text-sm text-muted-foreground">
                      As operações aparecerão aqui quando você adicionar entradas ou saídas
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}