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

// Função para gerar dados mockados do gráfico de linha
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

// Função para calcular média móvel simples
function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  
  return result;
}

// Função para calcular média móvel exponencial
function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i]);
    } else {
      const ema = data[i] * k + (result[i - 1] || data[i]) * (1 - k);
      result.push(Number(ema.toFixed(2)));
    }
  }
  
  return result;
}

// Função para calcular Bandas de Bollinger
function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2) {
  const sma = calculateSMA(data, period);
  const upperBand: (number | null)[] = [];
  const lowerBand: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || sma[i] === null) {
      upperBand.push(null);
      lowerBand.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i]!;
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upperBand.push(Number((mean + (standardDeviation * stdDev)).toFixed(2)));
      lowerBand.push(Number((mean - (standardDeviation * stdDev)).toFixed(2)));
    }
  }
  
  return { upperBand, lowerBand, middleBand: sma };
}

// Função para gerar dados de candlestick mais realistas para análise técnica
export function generateCandlestickData(precoAtual: number, precoMedio: number, suporte1: number | null, resistencia1: number | null) {
  const data = [];
  const now = new Date();
  
  // Gerar 60 dias de dados para melhor visualização das médias móveis
  for (let i = 59; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Criar uma tendência mais realista
    const trendFactor = (60 - i) / 60; // Tendência gradual
    const basePrice = precoAtual * (0.9 + 0.2 * trendFactor + (Math.random() - 0.5) * 0.1);
    
    // Gerar OHLC
    const volatility = 0.025; // 2.5% de volatilidade diária
    const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const close = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * volatility);
    const low = Math.min(open, close) * (1 - Math.random() * volatility);
    
    // Volume simulado com padrão
    const volumeBase = 500000;
    const volumeVariation = Math.random() * 0.5 + 0.75; // 75% a 125% do volume base
    const volume = Math.floor(volumeBase * volumeVariation);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });
  }
  
  // Garantir que o último candle seja o preço atual
  if (data.length > 0) {
    const lastCandle = data[data.length - 1];
    lastCandle.close = precoAtual;
    lastCandle.high = Math.max(lastCandle.high, precoAtual);
    lastCandle.low = Math.min(lastCandle.low, precoAtual);
  }
  
  // Calcular indicadores técnicos
  const closePrices = data.map(d => d.close);
  
  // Médias móveis
  const sma20 = calculateSMA(closePrices, 20);
  const sma50 = calculateSMA(closePrices, 50);
  const ema12 = calculateEMA(closePrices, 12);
  const ema26 = calculateEMA(closePrices, 26);
  
  // Bandas de Bollinger
  const bollinger = calculateBollingerBands(closePrices, 20, 2);
  
  // MACD
  const macd = ema12.map((ema12Val, i) => {
    if (ema12Val === null || ema26[i] === null) return null;
    return Number((ema12Val - ema26[i]!).toFixed(2));
  });
  
  // Adicionar indicadores aos dados
  const enrichedData = data.map((item, index) => ({
    ...item,
    sma20: sma20[index],
    sma50: sma50[index],
    ema12: ema12[index],
    ema26: ema26[index],
    macd: macd[index],
    bollingerUpper: bollinger.upperBand[index],
    bollingerLower: bollinger.lowerBand[index],
    bollingerMiddle: bollinger.middleBand[index],
    precoMedio: precoMedio // Linha constante do preço médio da carteira
  }));
  
  return enrichedData;
} 