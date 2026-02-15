import React, { useEffect, useRef, useState } from 'react';
import { MindmapNode } from '../types';
import mermaid from 'mermaid';

interface MindmapProps {
  data: MindmapNode;
}

const Mindmap: React.FC<MindmapProps> = ({ data }) => {
  const [useMermaid, setUseMermaid] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidSvg, setMermaidSvg] = useState<string>('');

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'dark',
      themeVariables: {
        primaryColor: '#404040',
        primaryTextColor: '#fff',
        primaryBorderColor: '#737373',
        lineColor: '#737373',
        secondaryColor: '#525252',
        tertiaryColor: '#262626',
      }
    });
  }, []);

  useEffect(() => {
    if (useMermaid && data) {
      renderMermaidMindmap();
    }
  }, [useMermaid, data]);

  const convertToMermaidSyntax = (node: MindmapNode): string => {
    if (!node || !node.label) return '';
    
    let syntax = 'mindmap\n';
    
    const traverse = (n: MindmapNode, indent: number) => {
      const indentation = ' '.repeat(indent);
      // Escape label to prevent Mermaid syntax errors, remove parens/special chars
      const cleanLabel = n.label.replace(/[()]/g, '').trim();
      // Determine shape based on depth (root: circle, others: default/rounded)
      const shapeStart = indent === 2 ? '((' : indent === 4 ? '(' : '[';
      const shapeEnd = indent === 2 ? '))' : indent === 4 ? ')' : ']';

      syntax += `${indentation}${shapeStart}${cleanLabel}${shapeEnd}\n`;

      if (n.children && n.children.length > 0) {
        n.children.forEach(child => traverse(child, indent + 2));
      }
    };

    traverse(node, 2); // Root indent
    return syntax;
  };

  const renderMermaidMindmap = async () => {
    const mermaidSyntax = convertToMermaidSyntax(data);
    
    try {
      const { svg } = await mermaid.render('mindmap-diagram', mermaidSyntax);
      setMermaidSvg(svg);
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = svg;
      }
    } catch (error) {
      console.error('Mermaid mindmap rendering error:', error);
      // Fallback or error indication?
    }
  };

  const exportAsSvg = () => {
    if (!mermaidSvg) {
      alert('Please render the Mermaid diagram first!');
      return;
    }

    const blob = new Blob([mermaidSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderNode = (node: MindmapNode, depth = 0, index = 0, totalSiblings = 1) => {
    if (!node || !node.id || !node.label) {
      return null;
    }
    
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className={`
          px-8 py-4 rounded-2xl border-2 shadow-xl mb-6 transition-all hover:scale-105 uppercase tracking-tighter relative z-10
          ${depth === 0 ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-black border-neutral-900' : 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold'}
          ${depth === 1 ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-100 dark:border-neutral-600'}
        `}>
          {node.label}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="flex gap-12 relative pt-8">
             {/* Vertical line from parent to children container */}
            <div className="absolute top-0 left-1/2 w-[2px] h-8 bg-neutral-300 dark:bg-neutral-600 transform -translate-x-1/2" />

            {node.children.map((child, idx) => {
              if (!child) return null;
              const isFirst = idx === 0;
              const isLast = idx === node.children!.length - 1;
              const isOnly = node.children!.length === 1;

              return (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Horizontal connection line */}
                {!isOnly && (
                  <>
                    <div className={`absolute top-0 right-0 h-[2px] bg-neutral-300 dark:bg-neutral-600 ${isFirst ? 'w-1/2' : 'w-full'} ${isLast ? 'hidden' : ''}`} />
                    <div className={`absolute top-0 left-0 h-[2px] bg-neutral-300 dark:bg-neutral-600 ${isLast ? 'w-1/2' : 'w-full'} ${isFirst ? 'hidden' : ''}`} />
                  </>
                )}

                {/* Vertical line to child node */}
                <div className="absolute top-0 left-1/2 w-[2px] h-6 bg-neutral-300 dark:bg-neutral-600 transform -translate-x-1/2" />

                {/* Child Node Content (pushed down by h-6) */}
                <div className="pt-6">
                   {renderNode(child, depth + 1, idx, node.children!.length)}
                </div>
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
    <div className="p-16 w-full min-h-[700px] bg-neutral-50 dark:bg-neutral-800/20 rounded-[3rem] border-2 border-dashed border-neutral-200 dark:border-neutral-700">
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setUseMermaid(!useMermaid)}
          className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border-2 border-neutral-600 hover:border-orange-500 bg-neutral-600 text-white"
        >
          {useMermaid ? 'Tree View' : 'Mermaid View'}
        </button>
        {useMermaid && (
          <button
            onClick={exportAsSvg}
            className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border-2 border-transparent hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)] bg-neutral-600 text-white"
          >
            Export SVG
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-center overflow-x-auto min-h-[500px]">
        {useMermaid ? (
          <div ref={mermaidRef} className="mermaid-container" />
        ) : (
          <div className="min-w-max flex flex-col items-center p-8">
            {renderNode(data)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Mindmap;
