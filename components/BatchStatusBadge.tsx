import { cn } from '@/lib/utils';

export function BatchStatusBadge({ state }: { state: string }) {
  const stateColors: Record<string, string> = {
    IDLE: 'bg-slate-100 text-slate-700',
    SETUP: 'bg-blue-100 text-blue-700',
    RUNNING: 'bg-emerald-100 text-emerald-700',
    HOLD: 'bg-amber-100 text-amber-700',
    COMPLETE: 'bg-indigo-100 text-indigo-700',
    ABORT: 'bg-red-100 text-red-700',
  };

  return (
    <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase tracking-wider", stateColors[state] || stateColors.IDLE)}>
      {state}
    </span>
  );
}
