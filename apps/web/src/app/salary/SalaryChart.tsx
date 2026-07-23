'use client';
import { useEffect, useRef } from 'react';

type Point = { year: number; p25: number; p50: number; p75: number };
export type ChartData = { series: Point[]; current?: Point | null; aiYear?: number | null };

/* Mounts the vanilla-canvas salary time-series. The numbers are already in the
   server-rendered HTML (the band table); this is the visual layer, so a client
   mount is the right progressive enhancement. */
export default function SalaryChart({ data }: { data: ChartData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    import('@/lib/salarychart.js').then((m) => {
      if (!cancelled && ref.current) (m as { initSalaryChart: (c: HTMLCanvasElement, d: ChartData) => void }).initSalaryChart(ref.current, data);
    });
    return () => { cancelled = true; };
  }, [data]);
  return <canvas ref={ref} className="sal-canvas" role="img" aria-label="Salary over time: 25th to 75th percentile band with the median line" />;
}
