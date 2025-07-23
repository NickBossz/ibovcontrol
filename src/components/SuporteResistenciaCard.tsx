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
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatVolume } from "@/lib/formatters";
import { getPriceStatus, getProximityAlert, generateCandlestickData } from "@/lib/technicalAnalysis";
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
  volume: number;
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
  volume, 
  showChart = false,
  showAlert = false 
}: SuporteResistenciaCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [useApexCharts, setUseApexCharts] = useState(true);
  const priceStatus = getPriceStatus(precoAtual, suporteResistencia.suporte1, suporteResistencia.resistencia1);
  const proximityAlert = getProximityAlert(precoAtual, suporteResistencia.suporte1, suporteResistencia.resistencia1);
  
  // Antes de gerar o chartData/candlestickData, montar arrays dinâmicos de suportes e resistências
  const suportes: number[] = suporteResistencia.niveis && Array.isArray(suporteResistencia.niveis) && suporteResistencia.niveis.length > 0
    ? suporteResistencia.niveis.filter(n => n.tipo === 'suporte').map(n => n.valor)
    : [suporteResistencia.suporte1, suporteResistencia.suporte2].filter(v => v !== null && v !== undefined);
    
  const resistencias: number[] = suporteResistencia.niveis && Array.isArray(suporteResistencia.niveis) && suporteResistencia.niveis.length > 0
    ? suporteResistencia.niveis.filter(n => n.tipo === 'resistencia').map(n => n.valor)
    : [suporteResistencia.resistencia1, suporteResistencia.resistencia2].filter(v => v !== null && v !== undefined);


  const candlestickData = generateCandlestickData(
    precoAtual,
    precoMedioCarteira || precoAtual,
    suporteResistencia.suporte1,
    suporteResistencia.resistencia1
  );

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
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
              <span>Volume: {formatVolume(volume)}</span>
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
                  <div className="text-sm text-slate-500">Volume: {formatVolume(volume)}</div>
                </div>
              </div>
            </div>

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

            {/* Gráfico ApexCharts */}
            {showChart && (suportes.length > 0 || resistencias.length > 0) && (
              <>
                <Separator />
                <div>
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg">Gráfico de Análise (60 dias)</h4>
                  </div>
                  
                  {(() => {
                    // Verificar se os dados existem
                    if (!candlestickData || candlestickData.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                          <p>Dados do gráfico não disponíveis</p>
                        </div>
                      );
                    }

                    // Preparar dados para ApexCharts - Candlestick
                    const candlestickSeries = [{
                      name: 'Preço',
                      data: candlestickData.map(item => ({
                        x: new Date(item.date).getTime(),
                        y: [item.open, item.high, item.low, item.close]
                      }))
                    }];

                    // Séries para médias móveis
                    const lineSeries = [
                      {
                        name: 'SMA 20',
                        data: candlestickData.map(item => ({
                          x: new Date(item.date).getTime(),
                          y: item.sma20
                        }))
                      },
                      {
                        name: 'SMA 50',
                        data: candlestickData.map(item => ({
                          x: new Date(item.date).getTime(),
                          y: item.sma50
                        }))
                      }
                    ];

                    // Preparar anotações para suportes e resistências
                    const annotations = {
                      yaxis: [
                        ...suportes.map((valor, idx) => ({
                          y: valor,
                          borderColor: '#3b82f6',
                          strokeDashArray: 5,
                          label: {
                            text: `S${idx + 1}`,
                            style: {
                              color: '#ffffff',
                              background: '#3b82f6'
                            }
                          }
                        })),
                        ...resistencias.map((valor, idx) => ({
                          y: valor,
                          borderColor: '#ef4444',
                          strokeDashArray: 5,
                          label: {
                            text: `R${idx + 1}`,
                            style: {
                              color: '#ffffff',
                              background: '#ef4444'
                            }
                          }
                        })),
                        ...(precoMedioCarteira ? [{
                          y: precoMedioCarteira,
                          borderColor: '#f59e0b',
                          strokeDashArray: 3,
                          label: {
                            text: 'Preço Médio',
                            style: {
                              color: '#ffffff',
                              background: '#f59e0b'
                            }
                          }
                        }] : [])
                      ]
                    };

                    // Opções do gráfico candlestick
                    const candlestickOptions: ApexOptions = {
                      chart: {
                        type: 'candlestick',
                        height: 350,
                        toolbar: {
                          show: false
                        },
                        zoom: {
                          enabled: true
                        }
                      },
                      title: {
                        text: `${suporteResistencia.ativo_codigo} - Análise Técnica`,
                        align: 'left'
                      },
                      xaxis: {
                        type: 'datetime'
                      },
                      yaxis: {
                        tooltip: {
                          enabled: true
                        },
                        labels: {
                          formatter: (value) => formatCurrency(value)
                        }
                      },
                      plotOptions: {
                        candlestick: {
                          colors: {
                            upward: '#10b981',
                            downward: '#ef4444'
                          }
                        }
                      },
                      annotations,
                      grid: {
                        borderColor: '#f0f0f0'
                      }
                    };

                    // Opções do gráfico de linhas (médias móveis)
                    const lineOptions: ApexOptions = {
                      chart: {
                        type: 'line',
                        height: 200,
                        toolbar: {
                          show: false
                        }
                      },
                      title: {
                        text: 'Médias Móveis',
                        style: {
                          fontSize: '14px'
                        }
                      },
                      xaxis: {
                        type: 'datetime',
                        labels: {
                          show: false
                        }
                      },
                      yaxis: {
                        labels: {
                          formatter: (value) => formatCurrency(value)
                        }
                      },
                      stroke: {
                        curve: 'smooth',
                        width: 2
                      },
                      colors: ['#10b981', '#f59e0b'],
                      legend: {
                        show: true
                      },
                      grid: {
                        borderColor: '#f0f0f0'
                      }
                    };

                    // Tentar usar ApexCharts, com fallback para Recharts
                    if (useApexCharts) {
                      try {
                        return (
                          <div className="w-full space-y-4">
                            {/* Gráfico Candlestick Principal */}
                            <div>
                              <Chart
                                options={candlestickOptions}
                                series={candlestickSeries}
                                type="candlestick"
                                height={350}
                              />
                            </div>
                            
                            {/* Gráfico de Médias Móveis */}
                            <div>
                              <Chart
                                options={lineOptions}
                                series={lineSeries}
                                type="line"
                                height={200}
                              />
                            </div>
                            
                            {/* MACD Chart */}
                            <div>
                              <Chart
                                options={{
                                  chart: {
                                    type: 'bar',
                                    height: 120,
                                    toolbar: { show: false }
                                  },
                                  title: {
                                    text: 'MACD',
                                    style: { 
                                      fontSize: '14px',
                                      color: '#374151',
                                      fontWeight: 600
                                    }
                                  },
                                  xaxis: {
                                    type: 'datetime',
                                    labels: { 
                                      show: false 
                                    }
                                  },
                                  yaxis: {
                                    labels: {
                                      style: {
                                        colors: '#6b7280',
                                        fontSize: '10px'
                                      },
                                      formatter: (value) => {
                                        if (Math.abs(value) >= 1000) {
                                          return (value / 1000).toFixed(1) + 'K';
                                        }
                                        return value?.toFixed(2);
                                      }
                                    }
                                  },
                                  colors: ['#6366f1'],
                                  plotOptions: {
                                    bar: {
                                      columnWidth: '60%'
                                    }
                                  },
                                  grid: {
                                    borderColor: '#f1f5f9',
                                    strokeDashArray: 2
                                  },
                                  dataLabels: {
                                    enabled: false
                                  }
                                }}
                                series={[{
                                  name: 'MACD',
                                  data: candlestickData.map(item => ({
                                    x: new Date(item.date).getTime(),
                                    y: item.macd
                                  }))
                                }]}
                                type="bar"
                                height={120}
                              />
                            </div>
                            
                            {/* Volume Chart */}
                            <div>
                              <Chart
                                options={{
                                  chart: {
                                    type: 'bar',
                                    height: 100,
                                    toolbar: { show: false }
                                  },
                                  title: {
                                    text: 'Volume',
                                    style: { 
                                      fontSize: '14px',
                                      color: '#374151',
                                      fontWeight: 600
                                    }
                                  },
                                  xaxis: {
                                    type: 'datetime',
                                    labels: { 
                                      show: false 
                                    }
                                  },
                                  yaxis: {
                                    labels: {
                                      style: {
                                        colors: '#6b7280',
                                        fontSize: '10px'
                                      },
                                      formatter: (value) => {
                                        if (value >= 1000000000) {
                                          return (value / 1000000000).toFixed(1) + 'B';
                                        } else if (value >= 1000000) {
                                          return (value / 1000000).toFixed(1) + 'M';
                                        } else if (value >= 1000) {
                                          return (value / 1000).toFixed(1) + 'K';
                                        }
                                        return value?.toString();
                                      }
                                    }
                                  },
                                  colors: ['#10b981'],
                                  plotOptions: {
                                    bar: {
                                      columnWidth: '50%'
                                    }
                                  },
                                  grid: {
                                    borderColor: '#f1f5f9',
                                    strokeDashArray: 2
                                  },
                                  dataLabels: {
                                    enabled: false
                                  }
                                }}
                                series={[{
                                  name: 'Volume',
                                  data: candlestickData.map(item => ({
                                    x: new Date(item.date).getTime(),
                                    y: item.volume
                                  }))
                                }]}
                                type="bar"
                                height={100}
                              />
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.error('Erro no ApexCharts, usando Recharts como fallback:', error);
                        setUseApexCharts(false);
                      }
                    }

                    // Fallback com Recharts
                    return (
                      <div className="w-full space-y-4">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={candlestickData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis 
                                tickFormatter={(value) => formatCurrency(value)}
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip 
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length > 0) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white border rounded-lg shadow-lg p-3">
                                        <p className="font-semibold">{new Date(label).toLocaleDateString('pt-BR')}</p>
                                        <div className="space-y-1 text-sm">
                                          <p>Fechamento: <span className="font-medium">{formatCurrency(data.close)}</span></p>
                                          <p>Volume: <span className="font-medium">{formatVolume(data.volume)}</span></p>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              
                              {/* Linha de fechamento */}
                              <Line 
                                type="monotone" 
                                dataKey="close" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={false}
                                name="Preço"
                              />
                              
                              {/* Médias Móveis */}
                              <Line 
                                type="monotone" 
                                dataKey="sma20" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                dot={false}
                                name="SMA 20"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="sma50" 
                                stroke="#f59e0b" 
                                strokeWidth={2}
                                dot={false}
                                name="SMA 50"
                              />

                              {/* Linhas de suporte */}
                              {suportes.map((valor, idx) => (
                                <ReferenceLine 
                                  key={`suporte-${idx}`} 
                                  y={valor} 
                                  stroke="#3b82f6" 
                                  strokeDasharray="3 3" 
                                  label={{ value: `S${idx + 1}`, position: 'right' }}
                                />
                              ))}
                              
                              {/* Linhas de resistência */}
                              {resistencias.map((valor, idx) => (
                                <ReferenceLine 
                                  key={`resistencia-${idx}`} 
                                  y={valor} 
                                  stroke="#ef4444" 
                                  strokeDasharray="3 3" 
                                  label={{ value: `R${idx + 1}`, position: 'right' }}
                                />
                              ))}
                              
                              {/* Preço médio da carteira */}
                              {precoMedioCarteira && (
                                <ReferenceLine 
                                  y={precoMedioCarteira} 
                                  stroke="#f59e0b" 
                                  strokeDasharray="2 2"
                                  strokeWidth={3}
                                  label={{ value: "Preço Médio", position: "insideTopLeft" }}
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            Usando gráfico de linha simplificado
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

            {/* Informações adicionais */}
            <Separator />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Volume: {formatVolume(volume)}</span>
              <span>Atualizado: {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 