import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanilhaData } from "@/hooks/usePlanilha";
import { Ativo } from "@/services/googleSheets";

interface AtivoSelectorProps {
  value?: string;
  onSelect: (ativo: Ativo) => void;
  placeholder?: string;
  disabled?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatVolume(value: number) {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function AtivoSelector({ value, onSelect, placeholder = "Buscar ativo...", disabled = false }: AtivoSelectorProps) {
  const { data: planilhaData, isLoading } = usePlanilhaData();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar ativos baseado no termo de busca
  const filteredAtivos = planilhaData?.ativos
    .filter(ativo => 
      ativo.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativo.referencia.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10) || []; // Limitar a 10 resultados

  // Encontrar ativo selecionado
  const selectedAtivo = planilhaData?.ativos.find(ativo => ativo.sigla === value);

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredAtivos.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredAtivos.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && filteredAtivos[selectedIndex]) {
            handleSelectAtivo(filteredAtivos[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredAtivos]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAtivo = (ativo: Ativo) => {
    onSelect(ativo);
    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        inputRef.current?.focus();
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Input principal */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={isOpen ? searchTerm : (selectedAtivo ? `${selectedAtivo.sigla} - ${selectedAtivo.referencia}` : "")}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={handleToggleDropdown}
          disabled={disabled}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Dropdown de opções */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Carregando ativos...</span>
              </div>
            ) : filteredAtivos.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchTerm ? "Nenhum ativo encontrado" : "Digite para buscar ativos"}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {filteredAtivos.map((ativo, index) => (
                  <div
                    key={ativo.sigla}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedIndex === index && "bg-muted"
                    )}
                    onClick={() => handleSelectAtivo(ativo)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ativo.sigla}</span>
                        <Badge 
                          variant={ativo.variacaoPercentual >= 0 ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            ativo.variacaoPercentual >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}
                        >
                          {ativo.variacaoPercentual >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {formatPercent(ativo.variacaoPercentual)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {ativo.referencia}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{formatCurrency(ativo.precoAtual)}</div>
                      <div className="text-muted-foreground">Vol: {formatVolume(ativo.volume)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 