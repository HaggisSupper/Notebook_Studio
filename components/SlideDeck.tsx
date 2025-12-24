
import React from 'react';
import { SlideDeckData } from '../types';

interface SlideDeckProps {
  data: SlideDeckData;
}

const SlideDeck: React.FC<SlideDeckProps> = ({ data }) => {
  if (!data || !data.slides || data.slides.length === 0) {
    return (
      <div className="text-center p-12 text-neutral-500 font-mono">
        No slides available. Generate content to view slide deck.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-8">
      <div className="text-center mb-24">
        <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-50 mb-4 uppercase tracking-tighter">{data.presentationTitle || 'Presentation'}</h1>
        <div className="h-2 w-24 bg-neutral-900 dark:bg-neutral-50 mx-auto"></div>
      </div>

      {data.slides.map((slide, idx) => {
        if (!slide || !slide.title) return null;
        return (
        <div key={idx} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg aspect-video shadow-2xl p-16 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-neutral-900 dark:bg-neutral-50"></div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-8 border-b border-neutral-100 dark:border-neutral-700 pb-4">
            {idx + 1}. {slide.title}
          </h2>
          <ul className="space-y-6">
            {slide.bullets && slide.bullets.map((bullet, bIdx) => (
              <li key={bIdx} className="flex items-start gap-4 text-xl text-neutral-600 dark:text-neutral-300">
                <span className="mt-2.5 w-2 h-2 rounded-full bg-neutral-900 dark:bg-neutral-50 shrink-0"></span>
                {bullet}
              </li>
            ))}
          </ul>
          <div className="absolute bottom-8 right-12 text-neutral-300 dark:text-neutral-600 font-mono text-sm">
            {String(idx + 1).padStart(2, '0')} / {String(data.slides.length).padStart(2, '0')}
          </div>
        </div>
      )})}
    </div>
  );
};

export default SlideDeck;
