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

        const widgetConfig = {
          "width": autosize ? "100%" : width,
          "height": autosize ? "100%" : height,
          "symbol": symbol,
          "interval": "D",
          "timezone": "America/Sao_Paulo",
          "theme": theme,
          "style": "1",
          "locale": "pt_BR",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "withdateranges": true,
          "range": "YTD",
          "hide_side_toolbar": false,
          "allow_symbol_change": false,
          "details": true,
          "hotlist": false,
          "calendar": false,
          "studies": ["Volume@tv-basicstudies"],
          "container_id": containerRef.current.id
        };

        script.innerHTML = JSON.stringify(widgetConfig);

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
  // Infelizmente o TradingView widget não suporta totalmente português
  // Vamos manter funcional mas adicionar uma nota explicativa
  const baseUrl = 'https://www.tradingview.com/embed-widget/advanced-chart/';
  const params = new URLSearchParams({
    'locale': 'pt_BR',
    'theme': theme,
    'symbol': symbol,
    'interval': 'D',
    'timezone': 'America/Sao_Paulo',
    'withdateranges': 'true',
    'range': 'YTD',
    'hide_side_toolbar': 'false',
    'allow_symbol_change': 'false',
    'details': 'true',
    'hotlist': 'false',
    'calendar': 'false',
    'studies': 'Volume@tv-basicstudies',
    'save_image': 'false',
    'hide_top_toolbar': 'false',
    'hide_legend': 'false'
  });

  const tradingViewUrl = `${baseUrl}?${params.toString()}`;

  return (
    <div className="w-full space-y-2">

      <div style={{ height: `${height}px` }}>
        <iframe
          src={tradingViewUrl}
          width="100%"
          height={height}
          frameBorder="0"
          allowTransparency={true}
          scrolling="no"
          title={`Gráfico TradingView - ${symbol}`}
          className="rounded-lg"
        />
      </div>
      <div className="text-xs text-gray-400 text-center">
        💡 Os dados são precisos e em tempo real, mesmo com interface em inglês
      </div>
    </div>
  );
}