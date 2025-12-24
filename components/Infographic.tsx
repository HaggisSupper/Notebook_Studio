
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InfographicData } from '../types';

interface InfographicProps {
  data: InfographicData;
}

const COLORS = ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

const Infographic: React.FC<InfographicProps> = ({ data }) => {
  return (
    <div className="p-12 bg-white dark:bg-neutral-800 rounded-[3rem] shadow-2xl border border-neutral-100 dark:border-neutral-700 max-w-4xl mx-auto space-y-16">
      <div className="text-center">
        <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-50 mb-6 uppercase tracking-tighter">{data.title}</h1>
        <p className="text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto font-medium leading-relaxed">{data.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {data.stats.map((stat, idx) => (
          <div key={idx} className="bg-neutral-50 dark:bg-neutral-700 p-10 rounded-[2rem] border border-neutral-100 dark:border-neutral-600 text-center transition-transform hover:-translate-y-1">
            <p className="text-[0.6rem] font-black text-neutral-400 dark:text-neutral-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <p className="text-4xl font-black text-neutral-950 dark:text-neutral-50">{stat.value}</p>
            {stat.trend && (
              <div className="mt-3">
                <span className={`text-[0.6rem] font-black px-2 py-0.5 rounded uppercase tracking-widest ${stat.trend === 'up' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                  {stat.trend === 'up' ? 'Growth' : 'Decline'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-700 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-600">
        <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-50 mb-8 uppercase tracking-tight">Signal Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#525252" className="dark:opacity-20" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a3a3a3', fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a3a3a3', fontWeight: 700 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#262626', color: '#fff', fontSize: '12px' }}
                cursor={{ fill: '#404040', opacity: 0.2 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-50 mb-8 uppercase tracking-tight">Critical Vectors</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-5 bg-neutral-100/50 dark:bg-neutral-700/30 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-700 transition-colors hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50">
              <span className="flex-shrink-0 w-8 h-8 bg-neutral-900 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-950 text-xs rounded-full flex items-center justify-center font-black">
                {idx + 1}
              </span>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">{point}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Infographic;
