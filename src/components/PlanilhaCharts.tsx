import React from 'react'
import { useAtivosAlta, useAtivosBaixa, useAtivosVolume, useAtivosValorMercado } from '@/hooks/usePlanilha'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Loader2 } from 'lucide-react'

export const PlanilhaCharts: React.FC = () => {
  const { data: ativosAlta, isLoading: loadingAlta } = useAtivosAlta(5)
  const { data: ativosBaixa, isLoading: loadingBaixa } = useAtivosBaixa(5)
  const { data: ativosVolume, isLoading: loadingVolume } = useAtivosVolume(5)
  const { data: ativosValorMercado, isLoading: loadingValorMercado } = useAtivosValorMercado(5)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const LoadingCard = () => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Ativos em Alta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top 5 em Alta
            </CardTitle>
            <CardDescription>
              Ativos com maior variação positiva
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAlta ? (
              <LoadingCard />
            ) : (
              <div className="space-y-3">
                {ativosAlta?.map((ativo, index) => (
                  <div key={ativo.codigo} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{ativo.codigo}</div>
                        <div className="text-sm text-muted-foreground">{ativo.nome}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatPercentage(ativo.variacaoPercentual)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(ativo.preco)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Ativos em Baixa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Top 5 em Baixa
            </CardTitle>
            <CardDescription>
              Ativos com maior variação negativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBaixa ? (
              <LoadingCard />
            ) : (
              <div className="space-y-3">
                {ativosBaixa?.map((ativo, index) => (
                  <div key={ativo.codigo} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{ativo.codigo}</div>
                        <div className="text-sm text-muted-foreground">{ativo.nome}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">
                        {formatPercentage(ativo.variacaoPercentual)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(ativo.preco)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 por Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Top 5 por Volume
            </CardTitle>
            <CardDescription>
              Ativos com maior volume de negociação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVolume ? (
              <LoadingCard />
            ) : (
              <div className="space-y-3">
                {ativosVolume?.map((ativo, index) => (
                  <div key={ativo.codigo} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{ativo.codigo}</div>
                        <div className="text-sm text-muted-foreground">{ativo.nome}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatNumber(ativo.volume)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(ativo.preco)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 por Valor de Mercado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              Top 5 por Valor de Mercado
            </CardTitle>
            <CardDescription>
              Ativos com maior valor de mercado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingValorMercado ? (
              <LoadingCard />
            ) : (
              <div className="space-y-3">
                {ativosValorMercado?.map((ativo, index) => (
                  <div key={ativo.codigo} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{ativo.codigo}</div>
                        <div className="text-sm text-muted-foreground">{ativo.nome}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(ativo.valorMercado)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage(ativo.variacaoPercentual)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 