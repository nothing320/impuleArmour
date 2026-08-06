import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, ColorType, CandlestickSeries } from 'lightweight-charts';
import { useHyperliquidWs } from '../hooks/useHyperliquidWs';
import { useUiStore } from '../store/uiStore';
import { HYPERLIQUID_API_URL, HYPERLIQUID_TESTNET_API_URL } from '../lib/api';
import { Maximize, Minimize } from 'lucide-react';

interface ChartProps {
  market: string;
}

export function Chart({ market }: ChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isTestnet = useUiStore(s => s.isTestnet);
  const timeframe = useUiStore(s => s.chartTimeframe);
  const setTimeframe = useUiStore(s => s.setChartTimeframe);
  
  const { subscribe } = useHyperliquidWs(isTestnet);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {

    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#888',
      },
      grid: {
        vertLines: { color: '#222' },
        horzLines: { color: '#222' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#222',
      },
      crosshair: {
        mode: 0,
      }
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = series;


    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      if (!seriesRef.current) return;
      try {
        const url = isTestnet ? HYPERLIQUID_TESTNET_API_URL : HYPERLIQUID_API_URL;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'candleSnapshot',
            req: { coin: market, interval: timeframe, startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, endTime: Date.now() }
          }),
        });
        const data = await res.json();
        if (active && Array.isArray(data)) {
          const formatted = data.map((d: any) => ({
            time: (d.t / 1000) as Time,
            open: parseFloat(d.o),
            high: parseFloat(d.h),
            low: parseFloat(d.l),
            close: parseFloat(d.c),
          }));
          seriesRef.current.setData(formatted);
        }
      } catch (e) {
        console.error('Failed to load candle history', e);
      }
    };

    loadHistory();

    return () => { active = false; };
  }, [market, timeframe, isTestnet]);

  useEffect(() => {
    const unsub = subscribe({ type: 'candle', coin: market, interval: timeframe }, (data: any) => {
      if (seriesRef.current && data.c) {
        seriesRef.current.update({
          time: (data.t / 1000) as Time,
          open: parseFloat(data.o),
          high: parseFloat(data.h),
          low: parseFloat(data.l),
          close: parseFloat(data.c),
        });
      }
    });

    return unsub;
  }, [market, timeframe, subscribe]);

  return (
    <div ref={wrapperRef} className={`flex flex-col w-full h-full relative ${isFullscreen ? 'bg-[#0a0a0a]' : ''}`}>
      <div className="absolute top-2 left-4 z-10 flex gap-2">
        {['1m', '5m', '15m', '1h', '4h', '1d'].map(tf => (
          <button 
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`text-xs px-2 py-1 rounded ${timeframe === tf ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
          >
            {tf}
          </button>
        ))}
      </div>
      <div className="absolute top-2 right-4 z-10">
        <button 
          onClick={toggleFullscreen}
          className="p-1.5 rounded bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
      <div ref={chartContainerRef} className="flex-1 w-full h-full" />
    </div>
  );
}
