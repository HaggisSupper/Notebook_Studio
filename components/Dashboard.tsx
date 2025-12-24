
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, 
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { DashboardData, DashboardChart, ChartType } from '../types';

interface DashboardProps {
  data: DashboardData;
}

const COLORS = ['#ffffff', '#a3a3a3', '#737373', '#404040', '#171717'];
const CHART_TYPES: ChartType[] = ['area', 'line', 'bar', 'scatter', 'pie', 'radar'];

const ChartRenderer: React.FC<{ chart: DashboardChart }> = ({ chart }) => {
  const [activeType, setActiveType] = useState<ChartType>(chart.chartType);

  const renderChart = () => {
    switch (activeType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart.data}
                dataKey={chart.dataKeys[0]} // Use first key for Pie value
                nameKey={chart.xAxisKey}    // Use X axis key for Pie label
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px', fontSize: '10px', color: '#e5e5e5' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chart.data}>
              <PolarGrid stroke="#404040" />
              <PolarAngleAxis dataKey={chart.xAxisKey} tick={{ fill: '#a3a3a3', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#737373', fontSize: 10 }} />
              {chart.dataKeys.map((key, i) => (
                <Radar key={key} name={key} dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.4} />
              ))}
              <Tooltip 
                 contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px', fontSize: '10px', color: '#e5e5e5' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
           <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#404040" />
              <XAxis dataKey={chart.xAxisKey} name={chart.xAxisKey} tick={{ fontSize: 10, fill: '#a3a3a3' }} />
              <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px', fontSize: '10px', color: '#e5e5e5' }} />
              {chart.dataKeys.map((key, i) => (
                 <Scatter key={key} name={key} data={chart.data} fill={COLORS[i % COLORS.length]} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#404040" />
              <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 10, fill: '#a3a3a3' }} />
              <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} />
              <Tooltip contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px', fontSize: '10px', color: '#e5e5e5' }} />
              {chart.dataKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#404040" />
              <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 10, fill: '#a3a3a3' }} />
              <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} />
              <Tooltip contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px', fontSize: '10px', color: '#e5e5e5' }} />
              {chart.dataKeys.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{r: 2}} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart.data}>
              <defs>
                {chart.dataKeys.map((key, i) => (
                  <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#404040" />
              <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 10, fill: '#a3a3a3' }} />
              <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} />
              <Tooltip contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '4px', fontSize: '10px', color: '#e5e5e5' }} />
              {chart.dataKeys.map((key, i) => (
                <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={`url(#color-${key})`} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 p-8 rounded-lg flex flex-col h-[400px]">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest">{chart.title}</h3>
        <div className="flex gap-1 bg-neutral-900 rounded p-1">
          {CHART_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`p-1.5 rounded text-[8px] uppercase font-black transition-colors ${activeType === t ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              title={t}
            >
              {t.slice(0, 1).toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 w-full min-h-0">
        {renderChart()}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-neutral-700 pb-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-50 uppercase tracking-tighter">{data.title}</h1>
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mt-1">Telemetry Dashboard v2.1</p>
        </div>
        <div className="px-3 py-1 bg-neutral-800 rounded border border-neutral-700 text-[10px] text-neutral-300 font-mono">
          STATUS: OPTIMAL
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.metrics.map((m, i) => (
          <div key={i} className="bg-neutral-800 border border-neutral-700 p-6 rounded-lg group hover:border-neutral-600 transition-all">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{m.label}</p>
            <p className="text-3xl font-black text-neutral-50 group-hover:scale-105 transition-transform origin-left">{m.value}</p>
            <p className="text-[10px] text-neutral-500 mt-2 font-mono italic">{m.detail}</p>
          </div>
        ))}
      </div>

      {/* Dynamic Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.charts.map((chart, i) => (
          <div key={i} className={i === 0 && data.charts.length % 2 !== 0 ? "md:col-span-2" : ""}>
            <ChartRenderer chart={chart} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
