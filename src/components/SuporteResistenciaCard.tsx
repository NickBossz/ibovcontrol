import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  Info,
  BarChart3,
  Eye,
  Zap,
  LayoutGrid,
  List,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { getPriceStatus, getProximityAlert, generateCandlestickData } from "@/lib/technicalAnalysis";
import { TradingViewIframe } from './TradingViewWidget';

interface SuporteResistencia {
  id: string;
  ativo_codigo: string;
  ativo_nome: string;
  suporte1: number | null;
  suporte2: number | null;
  resistencia1: number | null;
  resistencia2: number | null;
  ultima_modificacao: string;
  admin_id: string | null;
  niveis?: { tipo: 'suporte' | 'resistencia'; valor: number; motivo?: string; }[];
}

interface SuporteResistenciaCardProps {
  suporteResistencia: SuporteResistencia;
  precoAtual: number;
  precoMedioCarteira?: number;
  variacaoPercentual: number;
  quantidade?: number;
  showChart?: boolean;
  showAlert?: boolean;
}

// Função utilitária para calcular distâncias percentuais e absolutas
function calcularDistancias(valor: number, precoAtual: number, precoMedio?: number) {
  return {
    atual: {
      percentual: precoAtual ? (((valor - precoAtual) / precoAtual) * 100).toFixed(2) : '-',
      absoluto: precoAtual ? (valor - precoAtual).toFixed(2) : '-'
    },
    medio: {
      percentual: precoMedio ? (((valor - precoMedio) / precoMedio) * 100).toFixed(2) : '-',
      absoluto: precoMedio ? (valor - precoMedio).toFixed(2) : '-'
    }
  };
}

export function SuporteResistenciaCard({ 
  suporteResistencia, 
  precoAtual, 
  precoMedioCarteira,
  variacaoPercentual,
  quantidade,
  showChart = false,
  showAlert = false 
}: SuporteResistenciaCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const priceStatus = getPriceStatus(precoAtual, suporteResistencia.suporte1, suporteResistencia.resistencia1);
  const proximityAlert = getProximityAlert(precoAtual, suporteResistencia.suporte1, suporteResistencia.resistencia1);
  
  // Antes de gerar o chartData/candlestickData, montar arrays dinâmicos de suportes e resistências
  const suportes: number[] = suporteResistencia.niveis && Array.isArray(suporteResistencia.niveis) && suporteResistencia.niveis.length > 0
    ? suporteResistencia.niveis.filter(n => n.tipo === 'suporte').map(n => n.valor)
    : [suporteResistencia.suporte1, suporteResistencia.suporte2].filter(v => v !== null && v !== undefined);
    
  const resistencias: number[] = suporteResistencia.niveis && Array.isArray(suporteResistencia.niveis) && suporteResistencia.niveis.length > 0
    ? suporteResistencia.niveis.filter(n => n.tipo === 'resistencia').map(n => n.valor)
    : [suporteResistencia.resistencia1, suporteResistencia.resistencia2].filter(v => v !== null && v !== undefined);



  const getStatusColor = () => {
    switch (priceStatus) {
      case 'below-support':
        return 'bg-red-50 border-red-200 hover:bg-red-100/50 transition-colors';
      case 'above-resistance':
        return 'bg-green-50 border-green-200 hover:bg-green-100/50 transition-colors';
      default:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100/50 transition-colors';
    }
  };

  const getStatusText = () => {
    switch (priceStatus) {
      case 'below-support':
        return 'Abaixo do Suporte 1';
      case 'above-resistance':
        return 'Acima da Resistência 1';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (priceStatus) {
      case 'below-support':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'above-resistance':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const temSuporteOuResistencia = (() => {
    let suportes: number[] = [];
    let resistencias: number[] = [];
    if (suporteResistencia.niveis && Array.isArray(suporteResistencia.niveis) && suporteResistencia.niveis.length > 0) {
      suportes = suporteResistencia.niveis.filter(n => n.tipo === 'suporte').map(n => n.valor);
      resistencias = suporteResistencia.niveis.filter(n => n.tipo === 'resistencia').map(n => n.valor);
    } else {
      suportes = [suporteResistencia.suporte1, suporteResistencia.suporte2].filter(v => v !== null && v !== undefined);
      resistencias = [suporteResistencia.resistencia1, suporteResistencia.resistencia2].filter(v => v !== null && v !== undefined);
    }
    return suportes.length > 0 || resistencias.length > 0;
  })();

  return (
    <>
      <Card className={cn("border-2 cursor-pointer group transition-all hover:shadow-md", getStatusColor())} onClick={() => setIsModalOpen(true)}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header com informações do ativo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {suporteResistencia.ativo_codigo.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                    {suporteResistencia.ativo_codigo}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate max-w-32">
                    {suporteResistencia.ativo_nome}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl">{formatCurrency(precoAtual)}</div>
                <div className={cn(
                  "text-sm font-medium",
                  variacaoPercentual >= 0 ? "text-financial-gain" : "text-financial-loss"
                )}>
                  {formatPercent(variacaoPercentual)}
                </div>
              </div>
            </div>

            {/* Status do preço */}
            {getStatusText() && (
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <Badge variant="outline" className={cn(
                  "text-xs font-medium",
                  priceStatus === 'below-support' && "border-red-300 text-red-700 bg-red-50",
                  priceStatus === 'above-resistance' && "border-green-300 text-green-700 bg-green-50",
                  priceStatus === 'neutral' && "border-blue-300 text-blue-700 bg-blue-50"
                )}>
                  {getStatusText()}
                </Badge>
              </div>
            )}

            {/* Alerta de proximidade */}
            {showAlert && proximityAlert && (
              <Alert className={cn(
                "border-2",
                proximityAlert.type === 'suporte' ? "border-red-300 bg-red-50" : "border-orange-300 bg-orange-50"
              )}>
                <AlertTriangle className={cn(
                  "h-4 w-4",
                  proximityAlert.type === 'suporte' ? "text-red-600" : "text-orange-600"
                )} />
                <AlertDescription className={cn(
                  "font-medium",
                  proximityAlert.type === 'suporte' ? "text-red-700" : "text-orange-700"
                )}>
                  {proximityAlert.message} ({proximityAlert.percentage}% de distância)
                </AlertDescription>
              </Alert>
            )}

            {/* Preview dos Níveis Técnicos */}
            {temSuporteOuResistencia ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200 shadow-sm">
                    <Target className="h-3 w-3" />
                    Análise técnica disponível
                  </span>
                </div>
                {(() => {
                  let suportes: number[] = [];
                  let resistencias: number[] = [];
                  if (suporteResistencia.niveis && Array.isArray(suporteResistencia.niveis)) {
                    suportes = suporteResistencia.niveis.filter(n => n.tipo === 'suporte').map(n => n.valor);
                    resistencias = suporteResistencia.niveis.filter(n => n.tipo === 'resistencia').map(n => n.valor);
                  } else {
                    suportes = [suporteResistencia.suporte1, suporteResistencia.suporte2].filter(v => v !== null && v !== undefined);
                    resistencias = [suporteResistencia.resistencia1, suporteResistencia.resistencia2].filter(v => v !== null && v !== undefined);
                  }
                  
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-blue-700 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Suportes
                        </div>
                        {suportes.length > 0 ? (
                          suportes.slice(0, 2).map((valor, idx) => {
                            const diferencaAbsoluta = valor - precoAtual;
                            const diferencaPercentual = ((valor - precoAtual) / precoAtual * 100);
                            return (
                              <div key={idx} className="bg-blue-50 px-3 py-2 rounded-lg text-xs border border-blue-100">
                                <div className="font-bold text-blue-800 text-sm">{formatCurrency(valor)}</div>
                                <div className={cn(
                                  "font-medium text-xs",
                                  diferencaAbsoluta < 0 ? "text-green-600" : "text-blue-600"
                                )}>
                                  {diferencaAbsoluta >= 0 ? '+' : ''}{formatCurrency(Math.abs(diferencaAbsoluta))}
                                </div>
                                <div className={cn(
                                  "text-xs",
                                  diferencaPercentual < 0 ? "text-green-600" : "text-blue-600"
                                )}>
                                  ({diferencaPercentual >= 0 ? '+' : ''}{diferencaPercentual.toFixed(1)}%)
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-muted-foreground">Nenhum</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-red-700 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Resistências
                        </div>
                        {resistencias.length > 0 ? (
                          resistencias.slice(0, 2).map((valor, idx) => {
                            const diferencaAbsoluta = valor - precoAtual;
                            const diferencaPercentual = ((valor - precoAtual) / precoAtual * 100);
                            return (
                              <div key={idx} className="bg-red-50 px-3 py-2 rounded-lg text-xs border border-red-100">
                                <div className="font-bold text-red-800 text-sm">{formatCurrency(valor)}</div>
                                <div className={cn(
                                  "font-medium text-xs",
                                  diferencaAbsoluta > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {diferencaAbsoluta >= 0 ? '+' : ''}{formatCurrency(Math.abs(diferencaAbsoluta))}
                                </div>
                                <div className={cn(
                                  "text-xs",
                                  diferencaPercentual > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  ({diferencaPercentual >= 0 ? '+' : ''}{diferencaPercentual.toFixed(1)}%)
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-muted-foreground">Nenhuma</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <Alert className="bg-muted/30">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Suportes e resistências não configurados para este ativo.
                </AlertDescription>
              </Alert>
            )}

            {/* Informações adicionais */}
            <div className="flex justify-end items-center text-xs text-muted-foreground pt-2 border-t">
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                <Eye className="h-3 w-3 mr-1" />
                Detalhes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal com detalhes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise Detalhada - {suporteResistencia.ativo_codigo}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header melhorado do modal */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {suporteResistencia.ativo_codigo.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{suporteResistencia.ativo_codigo}</h3>
                    <p className="text-slate-600 font-medium">{suporteResistencia.ativo_nome}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-3xl font-bold text-slate-900">{formatCurrency(precoAtual)}</div>
                  <div className={cn(
                    "text-lg font-semibold px-3 py-1 rounded-full",
                    variacaoPercentual >= 0 
                      ? "text-green-700 bg-green-100" 
                      : "text-red-700 bg-red-100"
                  )}>
                    {variacaoPercentual >= 0 ? '+' : ''}{formatPercent(variacaoPercentual)}
                  </div>
                  {precoMedioCarteira && (
                    <div className="bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                      <div className="text-sm font-semibold text-orange-800">
                        Preço Médio: {formatCurrency(precoMedioCarteira)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informações da Carteira */}
            {(quantidade !== undefined && precoMedioCarteira !== undefined) && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Informações da Carteira
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* Quantidade */}
                    <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1">Quantidade</div>
                      <div className="text-lg font-bold text-blue-900">{quantidade}</div>
                    </div>

                    {/* Preço Médio */}
                    <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1">Média</div>
                      <div className="text-lg font-bold text-blue-900">{formatCurrency(precoMedioCarteira)}</div>
                    </div>

                    {/* Preço Atual */}
                    <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1">Atual</div>
                      <div className="text-lg font-bold text-blue-900">{formatCurrency(precoAtual)}</div>
                    </div>

                    {/* Discrepância */}
                    <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1">Discrepância</div>
                      <div className={cn(
                        "text-lg font-bold",
                        precoAtual > precoMedioCarteira ? "text-green-600" : "text-red-600"
                      )}>
                        {(() => {
                          const diff = ((precoAtual - precoMedioCarteira) / precoMedioCarteira) * 100;
                          return (diff >= 0 ? '+' : '') + diff.toFixed(2) + '%';
                        })()}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1">Total</div>
                      <div className="text-lg font-bold text-blue-900">{formatCurrency(quantidade * precoAtual)}</div>
                    </div>

                    {/* Retorno */}
                    <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1">Retorno</div>
                      <div className={cn(
                        "text-lg font-bold",
                        (() => {
                          const totalValue = quantidade * precoAtual;
                          const totalInvested = quantidade * precoMedioCarteira;
                          const totalReturn = totalValue - totalInvested;
                          return totalReturn >= 0 ? "text-green-600" : "text-red-600";
                        })()
                      )}>
                        {(() => {
                          const totalValue = quantidade * precoAtual;
                          const totalInvested = quantidade * precoMedioCarteira;
                          const totalReturn = totalValue - totalInvested;
                          return formatCurrency(totalReturn);
                        })()}
                      </div>
                      <div className={cn(
                        "text-xs font-medium",
                        (() => {
                          const totalValue = quantidade * precoAtual;
                          const totalInvested = quantidade * precoMedioCarteira;
                          const totalReturn = totalValue - totalInvested;
                          return totalReturn >= 0 ? "text-green-600" : "text-red-600";
                        })()
                      )}>
                        {(() => {
                          const totalValue = quantidade * precoAtual;
                          const totalInvested = quantidade * precoMedioCarteira;
                          const totalReturn = totalValue - totalInvested;
                          const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
                          return formatPercent(returnPercent);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Status e alertas */}
            <div className="space-y-4">
              {getStatusText() && (
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <Badge variant="outline" className={cn(
                    "text-sm",
                    priceStatus === 'below-support' && "border-red-300 text-red-700 bg-red-50",
                    priceStatus === 'above-resistance' && "border-green-300 text-green-700 bg-green-50",
                    priceStatus === 'neutral' && "border-blue-300 text-blue-700 bg-blue-50"
                  )}>
                    {getStatusText()}
                  </Badge>
                </div>
              )}

              {proximityAlert && (
                <Alert className={cn(
                  "border-2",
                  proximityAlert.type === 'suporte' ? "border-red-300 bg-red-50" : "border-orange-300 bg-orange-50"
                )}>
                  <Zap className={cn(
                    "h-4 w-4",
                    proximityAlert.type === 'suporte' ? "text-red-600" : "text-orange-600"
                  )} />
                  <AlertDescription className={cn(
                    "font-medium",
                    proximityAlert.type === 'suporte' ? "text-red-700" : "text-orange-700"
                  )}>
                    <strong>Atenção!</strong> {proximityAlert.message} ({proximityAlert.percentage}% de distância)
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Controle de visualização */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Níveis de Suporte e Resistência</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4 mr-1" />
                  Lista
                </Button>
              </div>
            </div>

            {/* Suportes e Resistências detalhados - dinâmico */}
            {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Suportes */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Suportes
                    </h4>
                    {suportes.length === 0 && <div className="text-muted-foreground text-sm">Nenhum suporte cadastrado</div>}
                      {suportes.map((valor, idx) => {
                        const dist = calcularDistancias(valor!, precoAtual, precoMedioCarteira);
                        return (
                          <div key={idx} className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <span className="font-semibold text-blue-800 text-base">Suporte {idx + 1}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-blue-700">{formatCurrency(valor)}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                <div className="text-xs font-medium text-blue-700">vs Preço Atual</div>
                                <div className="flex items-center justify-between">
                                  <div className={cn(
                                    "text-sm font-bold",
                                    parseFloat(dist.atual.absoluto) < 0 ? "text-green-600" : "text-blue-600"
                                  )}>
                                    {parseFloat(dist.atual.absoluto) >= 0 ? '+' : ''}{formatCurrency(parseFloat(dist.atual.absoluto))}
                                  </div>
                                  <div className={cn(
                                    "text-xs font-semibold",
                                    parseFloat(dist.atual.percentual) < 0 ? "text-green-600" : "text-blue-600"
                                  )}>
                                    ({parseFloat(dist.atual.percentual) >= 0 ? '+' : ''}{dist.atual.percentual}%)
                                  </div>
                                </div>
                              </div>
                              {precoMedioCarteira && (
                                <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                  <div className="text-xs font-medium text-orange-700">vs Preço Médio</div>
                                  <div className="flex items-center justify-between">
                                    <div className={cn(
                                      "text-sm font-bold",
                                      parseFloat(dist.medio.absoluto) < 0 ? "text-green-600" : "text-orange-600"
                                    )}>
                                      {parseFloat(dist.medio.absoluto) >= 0 ? '+' : ''}{formatCurrency(parseFloat(dist.medio.absoluto))}
                                    </div>
                                    <div className={cn(
                                      "text-xs font-semibold",
                                      parseFloat(dist.medio.percentual) < 0 ? "text-green-600" : "text-orange-600"
                                    )}>
                                      ({parseFloat(dist.medio.percentual) >= 0 ? '+' : ''}{dist.medio.percentual}%)
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {(() => {
                              if (!suporteResistencia.niveis) return null;
                              const nivel = suporteResistencia.niveis.filter(n => n.tipo === 'suporte')[idx];
                              return nivel && nivel.motivo ? (
                                <div className="mt-4">
                                  <div className="bg-gradient-to-r from-blue-100 via-blue-50 to-white border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0">
                                        <Info className="h-4 w-4 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-sm font-bold text-blue-800">Análise Fundamentalista</span>
                                          <div className="h-1 flex-1 bg-blue-200 rounded"></div>
                                        </div>
                                        <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-line break-words bg-white/60 p-3 rounded border border-blue-100">
                                          {nivel.motivo}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        );
                      })}
                  </div>

                  {/* Resistências */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Resistências
                    </h4>
                    {resistencias.length === 0 && <div className="text-muted-foreground text-sm">Nenhuma resistência cadastrada</div>}
                    {resistencias.map((valor, idx) => {
                      const dist = calcularDistancias(valor!, precoAtual, precoMedioCarteira);
                      return (
                        <div key={idx} className="bg-white border border-red-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </div>
                              <span className="font-semibold text-red-800 text-base">Resistência {idx + 1}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-red-700">{formatCurrency(valor)}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="bg-red-50 p-2 rounded border border-red-100">
                              <div className="text-xs font-medium text-red-700">vs Preço Atual</div>
                              <div className="flex items-center justify-between">
                                <div className={cn(
                                  "text-sm font-bold",
                                  parseFloat(dist.atual.absoluto) > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {parseFloat(dist.atual.absoluto) >= 0 ? '+' : ''}{formatCurrency(parseFloat(dist.atual.absoluto))}
                                </div>
                                <div className={cn(
                                  "text-xs font-semibold",
                                  parseFloat(dist.atual.percentual) > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  ({parseFloat(dist.atual.percentual) >= 0 ? '+' : ''}{dist.atual.percentual}%)
                                </div>
                              </div>
                            </div>
                            {precoMedioCarteira && (
                              <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                <div className="text-xs font-medium text-orange-700">vs Preço Médio</div>
                                <div className="flex items-center justify-between">
                                  <div className={cn(
                                    "text-sm font-bold",
                                    parseFloat(dist.medio.absoluto) > 0 ? "text-green-600" : "text-orange-600"
                                  )}>
                                    {parseFloat(dist.medio.absoluto) >= 0 ? '+' : ''}{formatCurrency(parseFloat(dist.medio.absoluto))}
                                  </div>
                                  <div className={cn(
                                    "text-xs font-semibold",
                                    parseFloat(dist.medio.percentual) > 0 ? "text-green-600" : "text-orange-600"
                                  )}>
                                    ({parseFloat(dist.medio.percentual) >= 0 ? '+' : ''}{dist.medio.percentual}%)
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          {(() => {
                            if (!suporteResistencia.niveis) return null;
                            const nivel = suporteResistencia.niveis.filter(n => n.tipo === 'resistencia')[idx];
                            return nivel && nivel.motivo ? (
                              <div className="mt-4">
                                <div className="bg-gradient-to-r from-red-100 via-red-50 to-white border border-red-200 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-red-500 p-2 rounded-lg flex-shrink-0">
                                      <Info className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-bold text-red-800">Análise Fundamentalista</span>
                                        <div className="h-1 flex-1 bg-red-200 rounded"></div>
                                      </div>
                                      <div className="text-sm text-red-900 leading-relaxed whitespace-pre-line break-words bg-white/60 p-3 rounded border border-red-100">
                                        {nivel.motivo}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tabela de Suportes */}
                  {suportes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Suportes
                      </h4>
                      <div className="bg-white border border-blue-200 rounded-lg overflow-hidden">
                        <div className={cn(
                          "bg-blue-50 px-4 py-2 gap-4 text-xs font-semibold text-blue-800",
                          precoMedioCarteira ? "grid grid-cols-4" : "grid grid-cols-3"
                        )}>
                          <div>Nível</div>
                          <div>Valor</div>
                          <div>vs Atual</div>
                          {precoMedioCarteira && <div>vs Médio</div>}
                        </div>
                        {suportes.map((valor, idx) => {
                          const dist = calcularDistancias(valor!, precoAtual, precoMedioCarteira);
                          return (
                            <div key={idx} className={cn(
                              "px-4 py-3 gap-4 border-t border-blue-100 text-sm hover:bg-blue-50/50",
                              precoMedioCarteira ? "grid grid-cols-4" : "grid grid-cols-3"
                            )}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <span className="font-medium">S{idx + 1}</span>
                              </div>
                              <div className="font-bold text-blue-700">{formatCurrency(valor)}</div>
                              <div className="space-y-1">
                                <div className={cn(
                                  "font-semibold",
                                  parseFloat(dist.atual.absoluto) < 0 ? "text-green-600" : "text-blue-600"
                                )}>
                                  {parseFloat(dist.atual.absoluto) >= 0 ? '+' : ''}{formatCurrency(parseFloat(dist.atual.absoluto))}
                                </div>
                                <div className={cn(
                                  "text-xs",
                                  parseFloat(dist.atual.percentual) < 0 ? "text-green-600" : "text-blue-600"
                                )}>
                                  ({parseFloat(dist.atual.percentual) >= 0 ? '+' : ''}{dist.atual.percentual}%)
                                </div>
                              </div>
                              {precoMedioCarteira && (
                                <div className="space-y-1">
                                  <div className={cn(
                                    "font-semibold",
                                    parseFloat(dist.medio.absoluto) < 0 ? "text-green-600" : "text-orange-600"
                                  )}>
                                    {parseFloat(dist.medio.absoluto) >= 0 ? '+' : ''}{formatCurrency(parseFloat(dist.medio.absoluto))}
                                  </div>
                                  <div className={cn(
                                    "text-xs",
                                    parseFloat(dist.medio.percentual) < 0 ? "text-green-600" : "text-orange-600"
                                  )}>
                                    ({parseFloat(dist.medio.percentual) >= 0 ? '+' : ''}{dist.medio.percentual}%)
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tabela de Resistências */}
                  {resistencias.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Resistências
                      </h4>
                      <div className="bg-white border border-red-200 rounded-lg overflow-hidden">
                        <div className={cn(
                          "bg-red-50 px-4 py-2 gap-4 text-xs font-semibold text-red-800",
                          precoMedioCarteira ? "grid grid-cols-4" : "grid grid-cols-3"
                        )}>
                          <div>Nível</div>
                          <div>Valor</div>
                          <div>vs Atual</div>
                          {precoMedioCarteira && <div>vs Médio</div>}
                        </div>
                        {resistencias.map((valor, idx) => {
                          const dist = calcularDistancias(valor!, precoAtual, precoMedioCarteira);
                          return (
                            <div key={idx} className={cn(
                              "px-4 py-3 gap-4 border-t border-red-100 text-sm hover:bg-red-50/50",
                              precoMedioCarteira ? "grid grid-cols-4" : "grid grid-cols-3"
                            )}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <span className="font-medium">R{idx + 1}</span>
                              </div>
                              <div className="font-bold text-red-700">{formatCurrency(valor)}</div>
                              <div className="space-y-1">
                                <div className={cn(
                                  "font-semibold",
                                  parseFloat(dist.atual.absoluto) > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {parseFloat(dist.atual.absoluto) >= 0 ? '+' : ''}{formatCurrency(parseFloat(dist.atual.absoluto))}
                                </div>
                                <div className={cn(
                                  "text-xs",
                                  parseFloat(dist.atual.percentual) > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  ({parseFloat(dist.atual.percentual) >= 0 ? '+' : ''}{dist.atual.percentual}%)
                                </div>
                              </div>
                              {precoMedioCarteira && (
                                <div className="space-y-1">
                                  <div className={cn(
                                    "font-semibold",
                                    parseFloat(dist.medio.absoluto) > 0 ? "text-green-600" : "text-orange-600"
                                  )}>
                                    {parseFloat(dist.medio.absoluto) >= 0 ? '+' : ''}{formatCurrency(parseFloat(dist.medio.absoluto))}
                                  </div>
                                  <div className={cn(
                                    "text-xs",
                                    parseFloat(dist.medio.percentual) > 0 ? "text-green-600" : "text-orange-600"
                                  )}>
                                    ({parseFloat(dist.medio.percentual) >= 0 ? '+' : ''}{dist.medio.percentual}%)
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {suportes.length === 0 && resistencias.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum suporte ou resistência cadastrado
                    </div>
                  )}
                </div>
            )}

            {/* Gráfico TradingView */}
            {showChart && (suportes.length > 0 || resistencias.length > 0) && (
              <>
                <Separator />
                <div>
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg">Gráfico de Análise (TradingView)</h4>
                  </div>
                  
                  <div className="w-full">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <TradingViewIframe 
                        symbol={`BMFBOVESPA:${suporteResistencia.ativo_codigo}`}
                        theme="light"
                        height={450}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Informações adicionais */}
            <Separator />
            <div className="flex justify-end text-sm text-muted-foreground">
              <span>Atualizado: {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 