
import React, { useState } from 'react';
import { FlashCardData } from '../types';

interface FlashCardProps {
  data: FlashCardData;
}

const FlashCards: React.FC<FlashCardProps> = ({ data }) => {
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());

  const toggleFlip = (index: number) => {
    const newFlipped = new Set(flippedIndices);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedIndices(newFlipped);
  };
  
  if (!data || !data.cards || data.cards.length === 0) {
    return (
      <div className="text-center p-12 text-neutral-500 font-mono">
        No flashcards available. Generate content to view flashcards.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto p-4">
      {data.cards.map((card, idx) => {
        if (!card || !card.question || !card.answer) {
          return null;
        }
        return (
        <div 
          key={idx} 
          onClick={() => toggleFlip(idx)}
          className="relative h-64 w-full cursor-pointer perspective-1000 group"
        >
          <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${flippedIndices.has(idx) ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-white dark:bg-neutral-700 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-center shadow-sm">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{card.question}</h3>
              <div className="absolute bottom-4 right-6 text-xs text-neutral-400 font-mono">FRONT</div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-neutral-900 dark:bg-neutral-100 p-8 rounded-3xl flex items-center justify-center text-center shadow-xl">
              <p className="text-lg text-neutral-100 dark:text-neutral-900 leading-relaxed">{card.answer}</p>
              <div className="absolute bottom-4 right-6 text-xs text-neutral-500 font-mono">BACK</div>
            </div>
          </div>
        </div>
      )})}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashCards;
