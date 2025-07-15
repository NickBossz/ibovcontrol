import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatVolume } from "@/lib/formatters";
import { getPriceStatus, getProximityAlert, generateChartData, generateCandlestickData } from "@/lib/technicalAnalysis";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, ComposedChart, Bar, AreaChart, Area } from 'recharts';

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
  const priceStatus = getPriceStatus(precoAtual, suporteResistencia.suporte1, suporteResistencia.resistencia1);
  const proximityAlert = getProximityAlert(precoAtual, suporteResistencia.suporte1, suporteResistencia.resistencia1);
  const chartData = generateChartData(
    precoAtual, 
    suporteResistencia.suporte1, 
    suporteResistencia.suporte2, 
    suporteResistencia.resistencia1, 
    suporteResistencia.resistencia2
  );

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
        return 'Dentro do Canal';
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

  const hasValidLevels = suporteResistencia.suporte1 && suporteResistencia.resistencia1 && 
                        !isNaN(suporteResistencia.suporte1) && !isNaN(suporteResistencia.resistencia1);

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

            {/* Suportes e Resistências - Versão compacta */}
            {hasValidLevels ? (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <h4 className="font-medium text-xs text-blue-700 mb-2 flex items-center justify-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Suportes
                  </h4>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">S1</div>
                    <div className="text-sm font-semibold text-blue-600">{formatCurrency(suporteResistencia.suporte1)}</div>
                    {suporteResistencia.suporte2 && (
                      <>
                        <div className="text-xs text-muted-foreground">S2</div>
                        <div className="text-sm font-semibold text-blue-600">{formatCurrency(suporteResistencia.suporte2)}</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-xs text-red-700 mb-2 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Resistências
                  </h4>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">R1</div>
                    <div className="text-sm font-semibold text-red-600">{formatCurrency(suporteResistencia.resistencia1)}</div>
                    {suporteResistencia.resistencia2 && (
                      <>
                        <div className="text-xs text-muted-foreground">R2</div>
                        <div className="text-sm font-semibold text-red-600">{formatCurrency(suporteResistencia.resistencia2)}</div>
                      </>
                    )}
                  </div>
                </div>
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
            {/* Header do modal */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="text-xl font-bold">{suporteResistencia.ativo_codigo}</h3>
                <p className="text-muted-foreground">{suporteResistencia.ativo_nome}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(precoAtual)}</div>
                <div className={cn(
                  "text-sm font-medium",
                  variacaoPercentual >= 0 ? "text-financial-gain" : "text-financial-loss"
                )}>
                  {formatPercent(variacaoPercentual)}
                </div>
              </div>
            </div>

            {/* Status e alertas */}
            <div className="space-y-4">
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

            {/* Suportes e Resistências detalhados */}
            {hasValidLevels ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-blue-700 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Níveis de Suporte
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-800">Suporte 1</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(suporteResistencia.suporte1)}</span>
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        Distância: {((suporteResistencia.suporte1! - precoAtual) / precoAtual * 100).toFixed(2)}%
                      </div>
                    </div>
                    {suporteResistencia.suporte2 && (
                      <div className="p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-700">Suporte 2</span>
                          <span className="text-lg font-bold text-blue-500">{formatCurrency(suporteResistencia.suporte2)}</span>
                        </div>
                        <div className="text-sm text-blue-500 mt-1">
                          Distância: {((suporteResistencia.suporte2 - precoAtual) / precoAtual * 100).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-red-700 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Níveis de Resistência
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-800">Resistência 1</span>
                        <span className="text-lg font-bold text-red-600">{formatCurrency(suporteResistencia.resistencia1)}</span>
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        Distância: {((precoAtual - suporteResistencia.resistencia1!) / precoAtual * 100).toFixed(2)}%
                      </div>
                    </div>
                    {suporteResistencia.resistencia2 && (
                      <div className="p-3 bg-red-50/50 border border-red-200/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-red-700">Resistência 2</span>
                          <span className="text-lg font-bold text-red-500">{formatCurrency(suporteResistencia.resistencia2)}</span>
                        </div>
                        <div className="text-sm text-red-500 mt-1">
                          Distância: {((precoAtual - suporteResistencia.resistencia2) / precoAtual * 100).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Este ativo não possui suportes e resistências configurados pelos administradores.
                </AlertDescription>
              </Alert>
            )}

            {/* Gráfico Candlestick */}
            {showChart && hasValidLevels && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">Análise Técnica Avançada (60 dias)</h4>
                    {precoMedioCarteira && (
                      <div className="text-sm text-muted-foreground">
                        Preço médio da carteira: <span className="font-semibold">{formatCurrency(precoMedioCarteira)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Gráfico Principal - Área com OHLC */}
                  <div className="h-80 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={candlestickData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          domain={['dataMin - 1', 'dataMax + 1']}
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
                                    <p>Abertura: <span className="font-medium">{formatCurrency(data.open)}</span></p>
                                    <p>Máxima: <span className="font-medium text-green-600">{formatCurrency(data.high)}</span></p>
                                    <p>Mínima: <span className="font-medium text-red-600">{formatCurrency(data.low)}</span></p>
                                    <p>Fechamento: <span className="font-medium">{formatCurrency(data.close)}</span></p>
                                    <p>Volume: <span className="font-medium">{formatVolume(data.volume)}</span></p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        
                        {/* Área de máximas e mínimas */}
                        <Area
                          type="monotone"
                          dataKey="high"
                          stroke="none"
                          fill="url(#priceGradient)"
                          fillOpacity={0.2}
                        />
                        <Area
                          type="monotone"
                          dataKey="low"
                          stroke="none"
                          fill="#ffffff"
                          fillOpacity={1}
                        />
                        
                        {/* Linha de fechamento */}
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                          name="Preço"
                        />

                        {/* Médias Móveis */}
                        <Line 
                          type="monotone" 
                          dataKey="sma20" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="none"
                          name="SMA 20"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sma50" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="none"
                          name="SMA 50"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ema12" 
                          stroke="#8b5cf6" 
                          strokeWidth={1.5}
                          dot={false}
                          strokeDasharray="4 4"
                          name="EMA 12"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ema26" 
                          stroke="#ec4899" 
                          strokeWidth={1.5}
                          dot={false}
                          strokeDasharray="4 4"
                          name="EMA 26"
                        />

                        {/* Bandas de Bollinger */}
                        <Line 
                          type="monotone" 
                          dataKey="bollingerUpper" 
                          stroke="#6b7280" 
                          strokeWidth={1}
                          dot={false}
                          strokeDasharray="2 2"
                          name="Bollinger Superior"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bollingerLower" 
                          stroke="#6b7280" 
                          strokeWidth={1}
                          dot={false}
                          strokeDasharray="2 2"
                          name="Bollinger Inferior"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bollingerMiddle" 
                          stroke="#9ca3af" 
                          strokeWidth={1}
                          dot={false}
                          strokeDasharray="1 1"
                          name="Bollinger Média"
                        />

                        {/* Linhas de referência */}
                        {suporteResistencia.suporte1 && (
                          <ReferenceLine 
                            y={suporteResistencia.suporte1} 
                            stroke="#3b82f6" 
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{ value: "S1", position: "insideTopRight" }}
                          />
                        )}
                        {suporteResistencia.suporte2 && (
                          <ReferenceLine 
                            y={suporteResistencia.suporte2} 
                            stroke="#1d4ed8" 
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{ value: "S2", position: "insideTopRight" }}
                          />
                        )}
                        {suporteResistencia.resistencia1 && (
                          <ReferenceLine 
                            y={suporteResistencia.resistencia1} 
                            stroke="#dc2626" 
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{ value: "R1", position: "insideBottomRight" }}
                          />
                        )}
                        {suporteResistencia.resistencia2 && (
                          <ReferenceLine 
                            y={suporteResistencia.resistencia2} 
                            stroke="#991b1b" 
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{ value: "R2", position: "insideBottomRight" }}
                          />
                        )}
                        {precoMedioCarteira && (
                          <ReferenceLine 
                            y={precoMedioCarteira} 
                            stroke="#f59e0b" 
                            strokeDasharray="2 2"
                            strokeWidth={3}
                            label={{ value: "Preço Médio Carteira", position: "insideTopLeft", style: { fontSize: 12, fontWeight: 'bold' } }}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* MACD */}
                  <div className="h-24 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={candlestickData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => value.toFixed(2)}
                        />
                        <Bar 
                          dataKey="macd" 
                          fill="#6366f1"
                          opacity={0.7}
                        />
                        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
                        <Tooltip 
                          formatter={(value: number) => [value?.toFixed(4), 'MACD']}
                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Volume */}
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={candlestickData}>
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <Bar 
                          dataKey="volume" 
                          fill="#8884d8" 
                          opacity={0.6}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatVolume(value), 'Volume']}
                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legenda Completa */}
                  <div className="space-y-3 mt-4">
                    {/* Primeira linha - Preços e Médias Móveis Principais */}
                    <div className="flex justify-center flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                        <span className="font-medium">Preço</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-green-500"></div>
                        <span>SMA 20</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-yellow-500"></div>
                        <span>SMA 50</span>
                      </div>
                      {precoMedioCarteira && (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-orange-500" style={{ borderTop: '2px dashed' }}></div>
                          <span className="font-medium">Preço Médio Carteira</span>
                        </div>
                      )}
                    </div>

                    {/* Segunda linha - EMAs e Bollinger */}
                    <div className="flex justify-center flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-purple-500" style={{ borderTop: '1px dashed' }}></div>
                        <span>EMA 12</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-pink-500" style={{ borderTop: '1px dashed' }}></div>
                        <span>EMA 26</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-gray-500" style={{ borderTop: '1px dotted' }}></div>
                        <span>Bollinger</span>
                      </div>
                    </div>

                    {/* Terceira linha - Suportes e Resistências */}
                    <div className="flex justify-center flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-600" style={{ borderTop: '2px dashed' }}></div>
                        <span>Suportes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-red-600" style={{ borderTop: '2px dashed' }}></div>
                        <span>Resistências</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500"></div>
                        <span>MACD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 opacity-30"></div>
                        <span>Volume</span>
                      </div>
                    </div>
                  </div>
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