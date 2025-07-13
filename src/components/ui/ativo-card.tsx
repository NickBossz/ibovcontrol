import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUpIcon, TrendingDownIcon, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatVolume } from "@/lib/formatters";

interface AtivoCardProps {
  ativo: {
    sigla: string;
    referencia: string;
    precoAtual: number;
    variacaoPercentual: number;
    volume: number;
    ultimaAtualizacao: string;
  };
  suporteResistencia?: {
    suporte1: number | null;
    resistencia1: number | null;
  };
  priceStatus: 'below-support' | 'above-resistance' | 'neutral';
  onEdit?: () => void;
  onRemove?: () => void;
  isLoading?: boolean;
}

export function AtivoCard({ 
  ativo, 
  suporteResistencia, 
  priceStatus, 
  onEdit, 
  onRemove, 
  isLoading = false 
}: AtivoCardProps) {
  const getStatusColor = () => {
    switch (priceStatus) {
      case 'below-support':
        return 'border-l-red-500';
      case 'above-resistance':
        return 'border-l-green-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const getStatusIcon = () => {
    switch (priceStatus) {
      case 'below-support':
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      case 'above-resistance':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (priceStatus) {
      case 'below-support':
        return 'Abaixo do Suporte';
      case 'above-resistance':
        return 'Acima da Resistência';
      default:
        return 'Dentro do Canal';
    }
  };

  const getStatusBadgeClass = () => {
    switch (priceStatus) {
      case 'below-support':
        return 'border-red-300 text-red-700 bg-red-50';
      case 'above-resistance':
        return 'border-green-300 text-green-700 bg-green-50';
      default:
        return 'border-blue-300 text-blue-700 bg-blue-50';
    }
  };

  return (
    <Card className={cn(
      "transition-all hover:shadow-md border-l-4",
      getStatusColor()
    )}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Ativo */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {ativo.sigla.slice(0, 2)}
              </div>
              <div>
                <div className="font-semibold text-lg">{ativo.sigla}</div>
                <div className="text-sm text-muted-foreground truncate max-w-32">
                  {ativo.referencia}
                </div>
              </div>
            </div>
          </div>

          {/* Preço e Variação */}
          <div className="lg:col-span-3">
            <div className="space-y-1">
              <div className="text-xl font-bold">{formatCurrency(ativo.precoAtual)}</div>
              <div className="flex items-center gap-1">
                {ativo.variacaoPercentual >= 0 ? (
                  <TrendingUpIcon className="h-4 w-4 text-financial-gain" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-financial-loss" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  ativo.variacaoPercentual >= 0 ? "text-financial-gain" : "text-financial-loss"
                )}>
                  {formatPercent(ativo.variacaoPercentual)}
                </span>
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="lg:col-span-2">
            <div className="text-sm text-muted-foreground">Volume</div>
            <div className="font-medium">{formatVolume(ativo.volume)}</div>
          </div>

          {/* Suportes e Resistências */}
          <div className="lg:col-span-3">
            {suporteResistencia && suporteResistencia.suporte1 && suporteResistencia.resistencia1 ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Suporte</div>
                  <div className="text-sm font-medium text-blue-600">
                    {formatCurrency(suporteResistencia.suporte1)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Resistência</div>
                  <div className="text-sm font-medium text-red-600">
                    {formatCurrency(suporteResistencia.resistencia1)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">N/A</div>
            )}
          </div>

          {/* Status */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass())}>
                {getStatusText()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Ações */}
        {(onEdit || onRemove) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {onEdit && (
              <Button variant="outline" size="sm">
                Editar
              </Button>
            )}
            {onRemove && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRemove}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remover
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 