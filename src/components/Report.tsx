
import React, { useState, useEffect } from 'react';
import { ReportData } from '../types';

interface ReportProps {
  data: ReportData;
  onTitleChange?: (newTitle: string) => void;
}

const Report: React.FC<ReportProps> = ({ data, onTitleChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data?.title || '');
  
  // Undo/Redo History Stacks
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  useEffect(() => {
    setEditValue(data?.title || '');
  }, [data?.title]);
  
  if (!data) {
    return (
      <div className="text-center p-12 text-neutral-500 font-mono">
        No report data available. Generate content to view report.
      </div>
    );
  }

  const handleSave = () => {
    setIsEditing(false);
    if (onTitleChange && editValue.trim() !== '' && editValue !== data.title) {
      setPast([...past, data.title]);
      setFuture([]); // Clear future on new change
      onTitleChange(editValue);
    } else {
      setEditValue(data.title);
    }
  };

  const handleUndo = () => {
    if (past.length === 0 || !onTitleChange) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setPast(newPast);
    setFuture([data.title, ...future]);
    onTitleChange(previous);
  };

  const handleRedo = () => {
    if (future.length === 0 || !onTitleChange) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setFuture(newFuture);
    setPast([...past, data.title]);
    onTitleChange(next);
  };

  return (
    <article className="bg-white dark:bg-neutral-800 max-w-4xl mx-auto p-16 shadow-2xl border border-neutral-100 dark:border-neutral-700 rounded-[2.5rem] relative group">
      
      {/* Undo/Redo Controls - Visible on Hover */}
      <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <button 
           onClick={handleUndo} 
           disabled={past.length === 0}
           className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-30 transition-all text-xs font-black uppercase tracking-wider"
           title="Undo Title Change"
         >
           Undo
         </button>
         <button 
           onClick={handleRedo} 
           disabled={future.length === 0}
           className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-30 transition-all text-xs font-black uppercase tracking-wider"
           title="Redo Title Change"
         >
           Redo
         </button>
      </div>

      <header className="mb-16 border-b border-neutral-100 dark:border-neutral-700 pb-12">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="w-full text-5xl font-black text-neutral-900 dark:text-neutral-50 mb-8 leading-[1.1] tracking-tighter uppercase bg-transparent border-b-2 border-neutral-900 dark:border-neutral-100 outline-none pb-2"
          />
        ) : (
          <h1 
            onClick={() => onTitleChange && setIsEditing(true)}
            className={`text-5xl font-black text-neutral-900 dark:text-neutral-50 mb-8 leading-[1.1] tracking-tighter uppercase ${onTitleChange ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
            title={onTitleChange ? "Click to edit title" : undefined}
          >
            {data.title}
          </h1>
        )}
        <div className="bg-neutral-50 dark:bg-neutral-700 p-8 rounded-3xl border-l-8 border-neutral-900 dark:border-neutral-100 shadow-sm">
          <h2 className="text-[0.6rem] font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-[0.3em] mb-3">Executive Summary</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed italic text-lg">{data.executiveSummary}</p>
        </div>
      </header>

      <div className="space-y-16">
        {data.sections && data.sections.length > 0 ? (
          data.sections.map((section, idx) => (
            <section key={idx}>
              <h3 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 mb-6 uppercase tracking-tight">{section.heading || `Section ${idx + 1}`}</h3>
              <div className="text-neutral-600 dark:text-neutral-400 leading-loose text-lg space-y-6">
                {section.body && section.body.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center p-8 text-neutral-500">No sections available in this report.</div>
        )}
      </div>

      <footer className="mt-20 pt-12 border-t border-neutral-100 dark:border-neutral-700">
        <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-6 uppercase tracking-tight">Terminal Analysis</h3>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-lg">{data.conclusion || 'No conclusion available.'}</p>
      </footer>
    </article>
  );
};

export default Report;
