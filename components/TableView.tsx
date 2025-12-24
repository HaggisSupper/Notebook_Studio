
import React from 'react';
import { TableData } from '../types';

interface TableViewProps {
  data: TableData;
}

const TableView: React.FC<TableViewProps> = ({ data }) => {
  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="p-6 border-b border-neutral-700 flex justify-between items-center">
        <h2 className="text-sm font-black text-neutral-50 uppercase tracking-[0.2em]">{data.title}</h2>
        <div className="flex gap-2">
           <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
           <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
           <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-700/50">
              {data.headers.map((header, i) => (
                <th key={i} className="px-6 py-4 text-[0.6rem] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700/50">
            {data.rows.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-700/20 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4 text-xs font-medium text-neutral-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
