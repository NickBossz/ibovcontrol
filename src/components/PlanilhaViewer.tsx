import React, { useState } from 'react'
import { usePlanilhaData, usePlanilhaStats, useInvalidatePlanilha } from '@/hooks/usePlanilha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Search,
  Loader2,
  AlertCircle,
  PieChart
} from 'lucide-react'
import type { Ativo } from '@/services/googleSheets'
import { PlanilhaCharts } from './PlanilhaCharts'

export const PlanilhaViewer: React.FC = () => {
  const { data: planilhaData, isLoading, error, refetch } = usePlanilhaData()
  const { data: stats } = usePlanilhaStats()
  const invalidatePlanilha = useInvalidatePlanilha()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'codigo' | 'preco' | 'variacao' | 'volume'>('codigo')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleRefresh = async () => {
    try {
      await invalidatePlanilha.mutateAsync()
      await refetch()
      toast({
        title: "Dados atualizados",
        description: "Os dados da planilha foram atualizados com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar os dados",
        variant: "destructive",
      })
    }
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const filteredAtivos = planilhaData?.ativos
    .filter(ativo => 
      ativo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativo.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]
      
      if (sortBy === 'codigo' || sortBy === 'nome') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    }) || []

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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Erro ao carregar dados</h3>
              <p className="text-muted-foreground">
                Não foi possível carregar os dados da planilha
              </p>
            </div>
            <Button onClick={handleRefresh} disabled={invalidatePlanilha.isPending}>
              {invalidatePlanilha.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total de Ativos</p>
                <p className="text-2xl font-bold">{stats?.totalAtivos || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Em Alta</p>
                <p className="text-2xl font-bold text-green-600">{stats?.ativosAlta || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Em Baixa</p>
                <p className="text-2xl font-bold text-red-600">{stats?.ativosBaixa || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Volume Total</p>
                <p className="text-2xl font-bold">{formatNumber(stats?.volumeTotal || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dados da Planilha</CardTitle>
              <CardDescription>
                Dados em tempo real dos ativos da bolsa de valores
                {stats?.ultimaAtualizacao && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Última atualização: {new Date(stats.ultimaAtualizacao).toLocaleString('pt-BR')}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} disabled={invalidatePlanilha.isPending}>
              {invalidatePlanilha.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou nome do ativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('codigo')}
                  >
                    Código
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('preco')}
                  >
                    Preço
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('variacao')}
                  >
                    Variação
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('volume')}
                  >
                    Volume
                  </TableHead>
                  <TableHead>Valor Mercado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2">Carregando dados...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredAtivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Nenhum ativo encontrado para sua busca' : 'Nenhum ativo disponível'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAtivos.map((ativo) => (
                    <TableRow key={ativo.codigo}>
                      <TableCell className="font-medium">{ativo.codigo}</TableCell>
                      <TableCell>{ativo.nome}</TableCell>
                      <TableCell>{formatCurrency(ativo.preco)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={ativo.variacaoPercentual > 0 ? 'default' : 'destructive'}
                          >
                            {formatPercentage(ativo.variacaoPercentual)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(ativo.variacao)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(ativo.volume)}</TableCell>
                      <TableCell>{formatCurrency(ativo.valorMercado)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação simples */}
          {filteredAtivos.length > 0 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Mostrando {filteredAtivos.length} de {planilhaData?.totalAtivos || 0} ativos
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abas para diferentes visualizações */}
      <Tabs defaultValue="tabela" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tabela" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tabela de Dados
          </TabsTrigger>
          <TabsTrigger value="graficos" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Gráficos e Rankings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tabela" className="mt-6">
          {/* Conteúdo da tabela já está acima */}
        </TabsContent>
        
        <TabsContent value="graficos" className="mt-6">
          <PlanilhaCharts />
        </TabsContent>
      </Tabs>
    </div>
  )
} 