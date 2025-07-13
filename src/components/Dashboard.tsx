import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/ui/stats-card";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  Volume2,
  Building2,
  Target,
  Info,
  Zap,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatVolume, formatDateTime } from "@/lib/formatters";
import { getPriceStatus } from "@/lib/technicalAnalysis";
import { usePlanilhaData } from "@/hooks/usePlanilha";
import { useSuportesResistencias } from "@/hooks/useSuportesResistencias";
import { useToast } from "@/hooks/use-toast";
import { Ativo } from "@/services/googleSheets";
import { SuporteResistenciaCard } from "./SuporteResistenciaCard";
import { AtivoCard } from "@/components/ui/ativo-card";

export function Dashboard() {
  const { data: planilhaData, isLoading, error, refetch } = usePlanilhaData();
  const { data: suportesResistencias, isLoading: loadingSuportes } = useSuportesResistencias();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'sigla' | 'referencia' | 'precoAtual' | 'variacaoPercentual' | 'volume'>('sigla');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da bolsa",
        variant: "destructive",
      });
    }
  }, [error]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Dados atualizados",
        description: "Os dados da bolsa foram atualizados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar os dados",
        variant: "destructive",
      });
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAtivos = planilhaData?.ativos
    .filter(ativo => 
      ativo.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativo.referencia.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];
      
      if (sortBy === 'sigla' || sortBy === 'referencia') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }) || [];

  // Combinar dados dos ativos com suportes e resistências
  const ativosComSuportes = filteredAtivos.map(ativo => {
    const suporteResistencia = suportesResistencias?.find(sr => sr.ativo_codigo === ativo.sigla);
    return {
      ...ativo,
      suporteResistencia
    };
  });

  // Estatísticas do mercado
  const totalAtivos = planilhaData?.totalAtivos || 0;
  const ativosEmAlta = planilhaData?.ativos.filter(a => a.variacaoPercentual > 0).length || 0;
  const ativosEmBaixa = planilhaData?.ativos.filter(a => a.variacaoPercentual < 0).length || 0;
  const mediaVariacao = planilhaData?.ativos.reduce((acc, ativo) => acc + ativo.variacaoPercentual, 0) / totalAtivos || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard da Bolsa</h1>
          <p className="text-muted-foreground">
            Informações em tempo real dos ativos da bolsa de valores
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar Dados
        </Button>
      </div>

      {/* Cards de Resumo do Mercado */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Ativos"
          value={totalAtivos}
          description="Ativos monitorados"
          icon={BarChart3}
          isLoading={isLoading}
        />
        
        <StatsCard
          title="Média de Variação"
          value={formatPercent(mediaVariacao)}
          description="Variação média do dia"
          icon={TrendingUp}
          isLoading={isLoading}
          valueClassName={cn(
            mediaVariacao >= 0 ? "text-financial-gain" : "text-financial-loss"
          )}
        />
        
        <StatsCard
          title="Em Alta"
          value={ativosEmAlta}
          description="Ativos com variação positiva"
          icon={TrendingUp}
          isLoading={isLoading}
          valueClassName="text-financial-gain"
        />
        
        <StatsCard
          title="Em Baixa"
          value={ativosEmBaixa}
          description="Ativos com variação negativa"
          icon={TrendingDown}
          isLoading={isLoading}
          valueClassName="text-financial-loss"
        />
      </div>

      {/* Alertas de Mercado */}
      {ativosComSuportes.some(ativo => {
        const suporteResistencia = ativo.suporteResistencia;
        if (!suporteResistencia?.suporte1 || !suporteResistencia?.resistencia1) return false;
        const priceStatus = getPriceStatus(ativo.precoAtual, suporteResistencia.suporte1, suporteResistencia.resistencia1);
        return priceStatus !== 'neutral';
      }) && (
        <Alert className="border-2 border-orange-300 bg-orange-50">
          <Zap className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <strong>Atenção!</strong> Alguns ativos estão próximos ou ultrapassaram seus níveis de suporte/resistência. 
            Clique em "Cards" para visualizar os detalhes.
          </AlertDescription>
        </Alert>
      )}

      {/* Busca e Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Visualização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por sigla ou nome da empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Tabela
              </Button>
              <Button 
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Cards
              </Button>
            </div>
          </div>
          
          {viewMode === 'table' && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Ordenar por:</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={sortBy === 'sigla' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('sigla')}
                  >
                    Sigla {sortBy === 'sigla' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button 
                    variant={sortBy === 'precoAtual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('precoAtual')}
                  >
                    Preço {sortBy === 'precoAtual' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button 
                    variant={sortBy === 'variacaoPercentual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('variacaoPercentual')}
                  >
                    Variação {sortBy === 'variacaoPercentual' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button 
                    variant={sortBy === 'volume' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('volume')}
                  >
                    Volume {sortBy === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Visualização de Ativos */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {viewMode === 'table' ? (
              <>
                <BarChart3 className="h-5 w-5" />
                Ativos da Bolsa
              </>
            ) : (
              <>
                <Target className="h-5 w-5" />
                Suportes e Resistências
              </>
            )}
            <Badge variant="secondary" className="ml-2">
              {filteredAtivos.length} ativos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'cards' ? (
            // Visualização em Cards
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading || loadingSuportes ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Carregando dados...</span>
                  </div>
                </div>
              ) : ativosComSuportes.length > 0 ? (
                ativosComSuportes
                  .filter(ativo => ativo.suporteResistencia) // Mostrar apenas ativos com suportes/resistências
                  .map((ativo) => (
                    <SuporteResistenciaCard
                      key={ativo.sigla}
                      suporteResistencia={ativo.suporteResistencia!}
                      precoAtual={ativo.precoAtual}
                      variacaoPercentual={ativo.variacaoPercentual}
                      volume={ativo.volume}
                      showChart={true}
                      showAlert={false}
                    />
                  ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum ativo com suportes e resistências encontrado" : "Nenhum ativo com suportes e resistências disponível"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Visualização em Tabela Melhorada
            <div className="space-y-4">
              {/* Lista de ativos */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Carregando dados da bolsa...</span>
                  </div>
                </div>
              ) : ativosComSuportes.length > 0 ? (
                <div className="grid gap-4">
                  {ativosComSuportes.map((ativo) => {
                    const suporteResistencia = ativo.suporteResistencia;
                    const priceStatus = suporteResistencia ? 
                      (ativo.precoAtual < (suporteResistencia.suporte1 || 0) ? 'below-support' :
                       ativo.precoAtual > (suporteResistencia.resistencia1 || 0) ? 'above-resistance' : 'neutral') : 'neutral';
                    
                    return (
                      <AtivoCard
                        key={ativo.sigla}
                        ativo={ativo}
                        suporteResistencia={suporteResistencia}
                        priceStatus={priceStatus}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum ativo encontrado" : "Nenhum ativo disponível"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações de Atualização */}
      {planilhaData && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Última Atualização</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(planilhaData.ultimaAtualizacao)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Ativos</p>
                  <p className="text-xs text-muted-foreground">{planilhaData.totalAtivos} ativos monitorados</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Com Suportes/Resistências</p>
                  <p className="text-xs text-muted-foreground">
                    {suportesResistencias?.length || 0} ativos configurados
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}