import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  height?: number;
  width?: number;
  suportes?: number[];
  resistencias?: number[];
  precoMedioCarteira?: number;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewWidget({
  symbol,
  theme = 'light',
  autosize = true,
  height = 450,
  width,
  suportes = [],
  resistencias = [],
  precoMedioCarteira
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const loadTradingViewScript = () => {
      if (typeof window !== 'undefined' && containerRef.current) {
        // Remove any existing widget
        containerRef.current.innerHTML = '';

        // Create script element for TradingView
        script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;

        // Preparar os drawings para suportes e resistências
        const drawings: any[] = [];

        // Adicionar linhas de suporte
        suportes.forEach((valor, idx) => {
          drawings.push({
            type: 'horizontal_line',
            id: `suporte_${idx}`,
            time: Date.now(),
            price: valor,
            color: '#3b82f6',
            linewidth: 2,
            linestyle: 1, // dashed
            text: `S${idx + 1}`,
            fontsize: 12
          });
        });

        // Adicionar linhas de resistência
        resistencias.forEach((valor, idx) => {
          drawings.push({
            type: 'horizontal_line',
            id: `resistencia_${idx}`,
            time: Date.now(),
            price: valor,
            color: '#ef4444',
            linewidth: 2,
            linestyle: 1, // dashed
            text: `R${idx + 1}`,
            fontsize: 12
          });
        });

        // Adicionar linha do preço médio da carteira
        if (precoMedioCarteira) {
          drawings.push({
            type: 'horizontal_line',
            id: 'preco_medio',
            time: Date.now(),
            price: precoMedioCarteira,
            color: '#f59e0b',
            linewidth: 3,
            linestyle: 2, // dotted
            text: 'Preço Médio',
            fontsize: 12
          });
        }

        script.innerHTML = JSON.stringify({
          autosize: autosize,
          symbol: symbol,
          interval: 'D',
          timezone: 'America/Sao_Paulo',
          theme: theme,
          style: '1',
          locale: 'pt_BR',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: containerRef.current.id,
          height: autosize ? undefined : height,
          width: autosize ? undefined : width,
          studies: [
            'Volume@tv-basicstudies',
            'MASimple@tv-basicstudies'
          ],
          drawings: drawings,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
          gridColor: theme === 'light' ? 'rgba(240, 243, 250, 1)' : 'rgba(42, 46, 57, 1)',
          loading_screen: {
            backgroundColor: theme === 'light' ? '#ffffff' : '#131722',
            foregroundColor: theme === 'light' ? '#787b86' : '#787b86'
          }
        });

        containerRef.current.appendChild(script);
      }
    };

    // Load script after a small delay to ensure DOM is ready
    const timeout = setTimeout(loadTradingViewScript, 100);

    return () => {
      clearTimeout(timeout);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, theme, autosize, height, width, suportes, resistencias, precoMedioCarteira]);

  return (
    <div className="tradingview-widget-container w-full h-full">
      <div
        ref={containerRef}
        id={`tradingview_${symbol.replace(':', '_')}_${Date.now()}`}
        className="w-full h-full"
        style={{ height: autosize ? '100%' : `${height}px` }}
      />
    </div>
  );
}

// Componente alternativo mais simples usando iframe
export function TradingViewIframe({
  symbol,
  theme = 'light',
  height = 450
}: {
  symbol: string;
  theme?: 'light' | 'dark';
  height?: number;
}) {
  const tradingViewUrl = `https://www.tradingview.com/embed-widget/advanced-chart/?locale=pt_BR&theme=${theme}&symbol=${encodeURIComponent(symbol)}&interval=D&timezone=America%2FSao_Paulo&hide_top_toolbar=false&hide_legend=false&save_image=false&backgroundColor=${theme === 'light' ? 'rgba(255%2C255%2C255%2C1)' : 'rgba(0%2C0%2C0%2C1)'}&gridColor=${theme === 'light' ? 'rgba(240%2C243%2C250%2C1)' : 'rgba(42%2C46%2C57%2C1)'}`;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <iframe
        src={tradingViewUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allowTransparency={true}
        scrolling="no"
        title={`TradingView Chart - ${symbol}`}
        className="rounded-lg"
      />
    </div>
  );
}