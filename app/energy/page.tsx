'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScope } from '@/components/ScopeProvider';
import { HierarchyScopeSelector } from '@/components/HierarchyScopeSelector';

type HierarchyLevel = 'line' | 'area' | 'site' | 'multi-plant';

type EnergyMeterItem = {
  id: string;
  tagId: string;
  meterType: string;
  tag: {
    endpoint: {
      site: { id: string; name: string };
      area: { id: string; name: string } | null;
      line: { id: string; name: string } | null;
      equipment: { id: string; name: string } | null;
    };
  };
};

const TIME_PRESETS: { label: string; start: string; end: string }[] = [
  { label: '24h', start: '-24h', end: 'now' },
  { label: '7d', start: '-7d', end: 'now' },
  { label: '30d', start: '-30d', end: 'now' },
];

export default function EnergyPage() {
  const { siteId: scopeSiteId, setSiteId: setScopeSiteId } = useScope();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [areaId, setAreaId] = useState<string>('');
  const [lineId, setLineId] = useState<string>('');

  useEffect(() => {
    setSiteId(scopeSiteId ?? null);
  }, [scopeSiteId]);

  const handleScopeChange = (scope: { siteId: string | null; areaId: string | null; lineId: string | null }) => {
    if (scope.siteId !== scopeSiteId) setScopeSiteId(scope.siteId ?? undefined);
    setSiteId(scope.siteId);
    setAreaId(scope.areaId ?? '');
    setLineId(scope.lineId ?? '');
  };

  const [meters, setMeters] = useState<EnergyMeterItem[]>([]);
  const [level, setLevel] = useState<HierarchyLevel>('site');
  const [timePreset, setTimePreset] = useState(0);
  const [series, setSeries] = useState<Array<{ time: string; value: number; [k: string]: unknown }>>([]);
  const [comparisonSeries, setComparisonSeries] = useState<Record<string, Array<{ time: string; value: number }>>>({});
  const [loading, setLoading] = useState(false);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const f = async () => {
      try {
        const res = await fetch('/api/energy/meters');
        if (res.ok) setMeters(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingHierarchy(false);
      }
    };
    f();
  }, []);

  const areas = meters
    .filter((m) => !siteId || m.tag.endpoint.site.id === siteId)
    .reduce((acc, m) => {
      const a = m.tag.endpoint.area;
      if (a && !acc.some((x: { id: string }) => x.id === a.id)) acc.push({ id: a.id, name: a.name, siteId: m.tag.endpoint.site.id });
      return acc;
    }, [] as { id: string; name: string; siteId: string }[]);

  const lines = meters
    .filter((m) => (!areaId || m.tag.endpoint.area?.id === areaId) && (!siteId || m.tag.endpoint.site.id === siteId))
    .reduce((acc, m) => {
      const l = m.tag.endpoint.line;
      if (l && !acc.some((x: { id: string }) => x.id === l.id)) acc.push({ id: l.id, name: l.name, areaId: m.tag.endpoint.area?.id ?? '' });
      return acc;
    }, [] as { id: string; name: string; areaId: string }[]);

  const fetchConsumption = async (params: { start: string; end: string; siteId?: string; areaId?: string; lineId?: string }) => {
    const sp = new URLSearchParams({
      start: params.start,
      end: params.end,
      level: level,
      ...(params.siteId && { siteId: params.siteId }),
      ...(params.areaId && { areaId: params.areaId }),
      ...(params.lineId && { lineId: params.lineId }),
    });
    const res = await fetch(`/api/energy/consumption?${sp}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? `Request failed (${res.status})`);
    }
    return data.series as Array<{ time: string; value: number }>;
  };

  useEffect(() => {
    if (loadingHierarchy) return;
    const preset = TIME_PRESETS[timePreset];
    if (!preset) return;
    const scopeOk =
      level === 'multi-plant' ||
      (level === 'site' && siteId) ||
      (level === 'area' && siteId && areaId) ||
      (level === 'line' && lineId);
    if (!scopeOk) {
      setSeries([]);
      setComparisonSeries({});
      return;
    }

    setLoading(true);
    setFetchError(null);
    const run = async () => {
      try {
        const main = await fetchConsumption({
          start: preset.start,
          end: preset.end,
          ...(siteId && { siteId }),
          ...(areaId && { areaId }),
          ...(lineId && { lineId }),
        });
        setSeries(main);

    if (level === 'multi-plant') {
          const bySite: Record<string, Array<{ time: string; value: number }>> = {};
          await Promise.all(
        meters
          .reduce((acc, m) => {
            const s = m.tag.endpoint.site;
            if (!acc.some((x) => x.id === s.id)) acc.push(s);
            return acc;
          }, [] as { id: string; name: string }[])
          .map(async (s) => {
            const data = await fetchConsumption({ start: preset.start, end: preset.end, siteId: s.id });
            bySite[s.name] = data;
          })
          );
          setComparisonSeries(bySite);
        } else if (level === 'site' && siteId && areas.length > 1) {
          const byArea: Record<string, Array<{ time: string; value: number }>> = {};
          await Promise.all(
            areas.map(async (a) => {
              const data = await fetchConsumption({ start: preset.start, end: preset.end, siteId, areaId: a.id });
              byArea[a.name] = data;
            })
          );
          setComparisonSeries(byArea);
        } else if (level === 'area' && areaId && lines.length > 1) {
          const byLine: Record<string, Array<{ time: string; value: number }>> = {};
          await Promise.all(
            lines.map(async (l) => {
              const data = await fetchConsumption({ start: preset.start, end: preset.end, lineId: l.id });
              byLine[l.name] = data;
            })
          );
          setComparisonSeries(byLine);
        } else {
          setComparisonSeries({});
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load consumption data';
        setFetchError(message);
        setSeries([]);
        setComparisonSeries({});
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [level, siteId, areaId, lineId, timePreset, loadingHierarchy]);

  const comparisonEntries = Object.entries(comparisonSeries);
  const chartData = series.length
    ? series.map((s) => ({ ...s, time: new Date(s.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }))
    : [];

  const comparisonChartData = (() => {
    if (comparisonEntries.length === 0) return [];
    const timeMap = new Map<string, { time: string; displayTime: string; [k: string]: unknown }>();
    for (const [name, points] of comparisonEntries) {
      for (const p of points) {
        const t = p.time;
        if (!timeMap.has(t)) {
          timeMap.set(t, {
            time: t,
            displayTime: new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          });
        }
        timeMap.get(t)![name] = p.value;
      }
    }
    return Array.from(timeMap.values())
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .map(({ time: _t, displayTime, ...names }) => ({ time: displayTime, ...names }));
  })();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="text-amber-500" />
          Energy Dashboard
        </h1>
        <p className="text-slate-500">View consumption by line, section, plant, or multi-plant</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as HierarchyLevel)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="multi-plant">Multi-plant</option>
              <option value="site">Plant (site)</option>
              <option value="area">Section (area)</option>
              <option value="line">Line</option>
            </select>
            <HierarchyScopeSelector
              siteId={siteId}
              areaId={areaId || null}
              lineId={lineId || null}
              onScopeChange={handleScopeChange}
              showEquipment={false}
              className="flex-wrap"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {TIME_PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setTimePreset(i)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  timePreset === i ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingHierarchy ? (
            <div className="h-[400px] flex items-center justify-center text-slate-500">Loading hierarchy...</div>
          ) : meters.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-500">
              <Activity className="h-12 w-12 mb-2 opacity-50" />
              <p>No energy meters configured.</p>
              <p className="text-sm mt-1">Add energy meters in Settings → Connectors → Energy meters.</p>
            </div>
          ) : loading ? (
            <div className="h-[400px] flex items-center justify-center text-slate-500">Loading data...</div>
          ) : fetchError ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-600">
              <p className="font-medium">Could not load energy data</p>
              <p className="text-sm text-slate-500 mt-1">{fetchError}</p>
              {fetchError.includes('Unauthorized') && (
                <p className="text-sm mt-2">Sign in to view energy consumption.</p>
              )}
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-500">
              <p>No data for the selected scope and time range.</p>
              <p className="text-sm mt-1">Ensure Telegraf is writing to the energy measurement and connectors are publishing.</p>
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                    minTickGap={40}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 500 }}
                    labelStyle={{ color: '#64748b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Consumption"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {comparisonEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    minTickGap={40}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  {comparisonEntries.map(([name], i) => {
                    const colors = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                    const color = colors[i % colors.length];
                    return (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        name={name}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
