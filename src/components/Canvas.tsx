
import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CanvasProps {
  initialContent?: string;
}

// Valid Mermaid diagram types
const VALID_MERMAID_TYPES = [
  'graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram',
  'erdiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline', 'gitgraph',
  'c4context', 'quadrantchart', 'xychart', 'block', 'architecture'
];

const Canvas: React.FC<CanvasProps> = ({ initialContent = '' }) => {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'markdown' | 'mermaid'>('markdown');
  const [isEditing, setIsEditing] = useState(true);
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
    if (mode === 'mermaid' && content && !isEditing) {
      renderMermaid();
    }
  }, [content, mode, isEditing]);

  const renderMermaid = async () => {
    if (!content.trim()) {
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = `<div class="text-neutral-400 font-mono text-sm p-4">Enter Mermaid diagram syntax in edit mode</div>`;
      }
      return;
    }

    try {
      // Validate basic Mermaid syntax before attempting render
      const firstLine = content.trim().split('\n')[0].toLowerCase();
      
      const hasValidType = VALID_MERMAID_TYPES.some(type => firstLine.includes(type));
      if (!hasValidType) {
        throw new Error('Invalid diagram type. Must start with a valid Mermaid diagram declaration (e.g., "graph TD", "sequenceDiagram", etc.)');
      }

      const { svg } = await mermaid.render('mermaid-diagram', content);
      setMermaidSvg(svg);
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = svg;
      }
    } catch (error: any) {
      console.error('Mermaid rendering error:', error);
      setMermaidSvg('');
      
      // Provide helpful error message
      const errorMessage = error.message || String(error);
      const helpText = `
        <div class="text-red-400 font-mono text-xs p-4 bg-neutral-800 rounded">
          <div class="font-bold mb-2">⚠️ Mermaid Syntax Error</div>
          <div class="mb-2">${errorMessage}</div>
          <div class="text-neutral-400 text-[10px] mt-3">
            <strong>Common issues:</strong><br/>
            • Diagram must start with a valid type (graph, flowchart, sequenceDiagram, etc.)<br/>
            • Check for unmatched brackets or quotes<br/>
            • Verify node IDs don't contain special characters<br/>
            • Ensure proper indentation and syntax
          </div>
        </div>
      `;
      
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = helpText;
      }
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
    link.download = 'diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exampleMermaid = `graph TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

  const exampleMarkdown = `# Welcome to Canvas

This is a **Markdown** editor with support for:

- **Bold** and *italic* text
- Lists and nested items
  - Sub-item 1
  - Sub-item 2
- [Links](https://example.com)
- Code blocks

\`\`\`javascript
const hello = () => {
  console.log("Hello World!");
};
\`\`\`

## Tables

| Feature | Status |
|---------|--------|
| Markdown | ✓ |
| Mermaid | ✓ |
| Export | ✓ |
`;

  return (
    <div className="w-full h-full flex flex-col bg-neutral-700 rounded-lg border border-neutral-600 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-600 bg-neutral-600">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('markdown')}
            className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
              mode === 'markdown'
                ? 'bg-neutral-700 text-white border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                : 'bg-neutral-500 text-neutral-300 border-transparent hover:border-orange-500'
            }`}
          >
            Markdown
          </button>
          <button
            onClick={() => setMode('mermaid')}
            className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
              mode === 'mermaid'
                ? 'bg-neutral-700 text-white border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                : 'bg-neutral-500 text-neutral-300 border-transparent hover:border-orange-500'
            }`}
          >
            Mermaid
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border-2 border-transparent hover:border-orange-500 bg-neutral-500 text-white"
          >
            {isEditing ? '👁️ Preview' : '✏️ Edit'}
          </button>
          
          {mode === 'mermaid' && !isEditing && (
            <button
              onClick={exportAsSvg}
              className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border-2 border-transparent hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)] bg-neutral-500 text-white"
            >
              Export SVG
            </button>
          )}

          <button
            onClick={() => setContent(mode === 'mermaid' ? exampleMermaid : exampleMarkdown)}
            className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border-2 border-transparent hover:border-orange-500 bg-neutral-500 text-neutral-300"
          >
            Load Example
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {isEditing && (
          <div className="flex-1 overflow-auto">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={mode === 'mermaid' ? 'Enter Mermaid diagram syntax...' : 'Enter Markdown content...'}
              className="w-full h-full p-6 bg-neutral-700 text-neutral-200 font-mono text-sm resize-none outline-none border-2 border-transparent focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all"
            />
          </div>
        )}

        {/* Preview */}
        {!isEditing && (
          <div className="flex-1 overflow-auto p-6 bg-neutral-600">
            {mode === 'markdown' ? (
              <div className="prose prose-invert prose-neutral max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || 'No content to preview'}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-full">
                <div ref={mermaidRef} className="mermaid-container">
                  {!content && <div className="text-neutral-400 text-sm">Enter Mermaid syntax and preview to render</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .prose {
          color: #e5e5e5;
        }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: #fff;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .prose a {
          color: #fb923c;
          text-decoration: none;
        }
        .prose a:hover {
          color: #f97316;
          text-decoration: underline;
        }
        .prose code {
          background-color: #404040;
          color: #fbbf24;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-weight: 600;
        }
        .prose pre {
          background-color: #262626;
          border: 1px solid #404040;
          border-radius: 0.5rem;
        }
        .prose pre code {
          background-color: transparent;
          color: #e5e5e5;
          padding: 0;
        }
        .prose table {
          border-collapse: collapse;
          width: 100%;
        }
        .prose th {
          background-color: #404040;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
        }
        .prose td, .prose th {
          border: 1px solid #525252;
          padding: 0.75rem;
        }
        .prose tr:nth-child(even) {
          background-color: #404040;
        }
        .prose strong {
          color: #fff;
          font-weight: 900;
        }
        .prose ul, .prose ol {
          padding-left: 1.5rem;
        }
        .prose li {
          margin: 0.5rem 0;
        }
        
        .mermaid-container svg {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};

export default Canvas;
