
import React from 'react';
import { MindmapNode } from '../types';

interface MindmapProps {
  data: MindmapNode;
}

const Mindmap: React.FC<MindmapProps> = ({ data }) => {
  const renderNode = (node: MindmapNode, depth = 0, index = 0) => {
    if (!node || !node.id || !node.label) {
      return null;
    }
    
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className={`
          px-8 py-4 rounded-2xl border-2 shadow-xl mb-6 transition-all hover:scale-105 uppercase tracking-tighter
          ${depth === 0 ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-black border-neutral-900' : 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold'}
          ${depth === 1 ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-100 dark:border-neutral-600'}
        `}>
          {node.label}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="flex gap-12 relative">
            <div className="absolute top-[-24px] left-1/2 w-[3px] h-6 bg-neutral-300 dark:bg-neutral-600 transform -translate-x-1/2" />
            {node.children.map((child, idx) => {
              if (!child) return null;
              return (
              <div key={child.id} className="relative flex flex-col items-center pt-6">
                {/* Horizontal connection line */}
                {node.children && node.children.length > 1 && idx === 0 && (
                  <div className="absolute top-0 right-0 w-1/2 h-[3px] bg-neutral-300 dark:bg-neutral-600" />
                )}
                {node.children && node.children.length > 1 && idx === node.children.length - 1 && (
                  <div className="absolute top-0 left-0 w-1/2 h-[3px] bg-neutral-300 dark:bg-neutral-600" />
                )}
                {node.children && node.children.length > 1 && idx > 0 && idx < node.children.length - 1 && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-neutral-300 dark:bg-neutral-600" />
                )}
                <div className="absolute top-0 left-1/2 w-[3px] h-6 bg-neutral-300 dark:bg-neutral-600 transform -translate-x-1/2" />
                {renderNode(child, depth + 1, idx)}
              </div>
            )})}
          </div>
        )}
      </div>
    );
  };

  if (!data || !data.id || !data.label) {
    return (
      <div className="text-center p-12 text-neutral-500 font-mono">
        No mindmap data available. Generate content to view mindmap.
      </div>
    );
  }

  return (
    <div className="p-16 w-full min-h-[700px] flex items-center justify-center overflow-x-auto bg-neutral-50 dark:bg-neutral-800/20 rounded-[3rem] border-2 border-dashed border-neutral-200 dark:border-neutral-700">
      <div className="min-w-max flex flex-col items-center p-8">
        {renderNode(data)}
      </div>
    </div>
  );
};

export default Mindmap;
