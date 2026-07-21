'use client';
import { useEffect, useRef } from 'react';
import { SHELL } from '@/lib/shell';
import { DATA } from '@/lib/data';

// Checkpoint 1 of the Phase 2 port: React owns the page, the tuned graph physics run
// as a vanilla module mounted imperatively into the injected shell (per the porting
// non-negotiables — physics stays outside React). Shell is server-safe HTML; the graph
// mounts client-side. Next checkpoints React-ify the shell into components + add
// typeahead / skill chips / the export sheet / origin switching.
export default function Home() {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || !ref.current) return; // guard React strict-mode double-invoke
    mounted.current = true;
    ref.current.innerHTML = SHELL;
    import('@/lib/instrument.js').then((m) => (m as { mountInstrument: (d: unknown) => void }).mountInstrument(DATA));
  }, []);

  return <div ref={ref} suppressHydrationWarning />;
}
