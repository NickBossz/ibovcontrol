// Função para determinar o status do preço em relação aos suportes e resistências
export function getPriceStatus(precoAtual: number, suporte1: number | null, resistencia1: number | null) {
  if (!suporte1 || !resistencia1 || isNaN(suporte1) || isNaN(resistencia1)) return 'neutral';
  
  if (precoAtual < suporte1) return 'below-support';
  if (precoAtual > resistencia1) return 'above-resistance';
  return 'neutral';
}

// Função para calcular proximidade dos níveis
export function getProximityAlert(precoAtual: number, suporte1: number | null, resistencia1: number | null) {
  if (!suporte1 || !resistencia1 || isNaN(suporte1) || isNaN(resistencia1)) return null;
  
  const suporteProximity = ((suporte1 - precoAtual) / suporte1) * 100;
  const resistenciaProximity = ((precoAtual - resistencia1) / resistencia1) * 100;
  
  if (suporteProximity > 0 && suporteProximity <= 2) {
    return {
      type: 'suporte' as const,
      message: `Preço se aproximando do suporte 1`,
      percentage: suporteProximity.toFixed(1)
    };
  }
  
  if (resistenciaProximity > 0 && resistenciaProximity <= 2) {
    return {
      type: 'resistencia' as const,
      message: `Preço se aproximando da resistência 1`,
      percentage: resistenciaProximity.toFixed(1)
    };
  }
  
  return null;
}

// Função para gerar dados mockados do gráfico
export function generateChartData(precoAtual: number, suporte1: number | null, suporte2: number | null, resistencia1: number | null, resistencia2: number | null) {
  const data = [];
  const minPrice = Math.min(precoAtual, suporte2 || suporte1 || precoAtual * 0.9);
  const maxPrice = Math.max(precoAtual, resistencia2 || resistencia1 || precoAtual * 1.1);
  
  for (let i = 0; i < 20; i++) {
    const x = i;
    // Simular variação de preço com tendência
    const variation = Math.sin(i * 0.3) * 0.02 + (i - 10) * 0.005;
    const price = precoAtual * (1 + variation);
    data.push({ x, price });
  }
  
  return data;
} 