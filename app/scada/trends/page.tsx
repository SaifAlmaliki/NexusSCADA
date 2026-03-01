'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Download, RefreshCw, Settings2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data generator
const generateTrendData = (points: number) => {
  const data = [];
  let t1 = 85;
  let p1 = 2.1;
  let l1 = 65;
  
  for (let i = 0; i < points; i++) {
    const time = new Date();
    time.setMinutes(time.getMinutes() - (points - i) * 5);
    
    t1 += (Math.random() - 0.5) * 2;
    p1 += (Math.random() - 0.5) * 0.1;
    l1 += (Math.random() - 0.5) * 1;
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Number(t1.toFixed(1)),
      pressure: Number(p1.toFixed(2)),
      level: Number(l1.toFixed(1)),
    });
  }
  return data;
};

const mockData = generateTrendData(60); // Last 5 hours

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedTags, setSelectedTags] = useState(['temp', 'pressure']);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historical Trends</h1>
          <p className="text-sm text-slate-500 mt-1">Analyze historical tag data and process variables.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={18} className="mr-2" />
            Export Data
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              {['15m', '1h', '8h', '24h', '7d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    timeRange === range 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Calendar size={16} className="mr-2" />
              Custom Range
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" title="Refresh">
              <RefreshCw size={18} />
            </button>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" title="Settings">
              <Settings2 size={18} />
            </button>
          </div>
        </CardHeader>
        
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700 mr-2">Selected Tags:</span>
            
            <button 
              onClick={() => toggleTag('temp')}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-2",
                selectedTags.includes('temp') 
                  ? "bg-orange-50 border-orange-200 text-orange-700" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", selectedTags.includes('temp') ? "bg-orange-500" : "bg-slate-300")} />
              R101_TEMP (°C)
            </button>
            
            <button 
              onClick={() => toggleTag('pressure')}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-2",
                selectedTags.includes('pressure') 
                  ? "bg-blue-50 border-blue-200 text-blue-700" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", selectedTags.includes('pressure') ? "bg-blue-500" : "bg-slate-300")} />
              R101_PRESS (bar)
            </button>
            
            <button 
              onClick={() => toggleTag('level')}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-2",
                selectedTags.includes('level') 
                  ? "bg-teal-50 border-teal-200 text-teal-700" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", selectedTags.includes('level') ? "bg-teal-500" : "bg-slate-300")} />
              R101_LEVEL (%)
            </button>
            
            <button className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 transition-colors flex items-center">
              + Add Tag
            </button>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="h-[500px] w-full">
            {selectedTags.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10} 
                    minTickGap={30}
                  />
                  
                  {selectedTags.includes('temp') && (
                    <YAxis 
                      yAxisId="temp" 
                      orientation="left" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#f97316', fontSize: 12 }} 
                      dx={-10}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                  )}
                  
                  {selectedTags.includes('pressure') && (
                    <YAxis 
                      yAxisId="pressure" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#3b82f6', fontSize: 12 }} 
                      dx={10}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                  )}
                  
                  {selectedTags.includes('level') && (
                    <YAxis 
                      yAxisId="level" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#14b8a6', fontSize: 12 }} 
                      dx={50}
                      domain={[0, 100]}
                    />
                  )}

                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 500 }}
                    labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  {selectedTags.includes('temp') && (
                    <Line 
                      yAxisId="temp"
                      type="monotone" 
                      dataKey="temp" 
                      name="R101_TEMP (°C)"
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  )}
                  
                  {selectedTags.includes('pressure') && (
                    <Line 
                      yAxisId="pressure"
                      type="monotone" 
                      dataKey="pressure" 
                      name="R101_PRESS (bar)"
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  )}
                  
                  {selectedTags.includes('level') && (
                    <Line 
                      yAxisId="level"
                      type="monotone" 
                      dataKey="level" 
                      name="R101_LEVEL (%)"
                      stroke="#14b8a6" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Activity className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-600">No tags selected</p>
                <p className="text-sm mt-1">Select one or more tags above to view trends.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
