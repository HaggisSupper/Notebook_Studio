import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Source, StudioState, StudioView, LLMSettings, ChatMessage, Notebook, Page } from './types';
import Sidebar from './components/Sidebar';
import Report from './components/Report';
import Infographic from './components/Infographic';
import Mindmap from './components/Mindmap';
import FlashCards from './components/FlashCards';
import SlideDeck from './components/SlideDeck';
import TableView from './components/TableView';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import Canvas from './components/Canvas';
import { generateStudioContent } from './services/llmService';

const INITIAL_PAGE: Page = {
  id: 'pg-1',
  name: 'Page 1',
  generatedContent: {},
  chatHistory: [{ role: 'assistant', content: 'Antigravity systems online. Ready for multimodal analysis.' }]
};

const INITIAL_NOTEBOOK: Notebook = {
  id: 'nb-1',
  name: 'Initial Protocol',
  sources: [
    { id: '1', title: 'Studio Protocol', content: 'NotebookLM Studio Clone. Grayscale visual studio antigravity aesthetics. Supports: Multimodal Reports, Infographics, Mindmaps, Flashcards, Slides, Tables, and Telemetry Dashboards. Powered by Google Gemini.', type: 'text' }
  ],
  pages: [INITIAL_PAGE]
};

const App: React.FC = () => {
  const [state, setState] = useState<StudioState>({
    notebooks: [INITIAL_NOTEBOOK],
    activeNotebookId: 'nb-1',
    activePageId: 'pg-1',
    activeView: 'report',
    isLoading: false,
    isDarkMode: true,
    settings: {
      provider: 'google',
      model: 'gemini-3-pro-preview',
      searchConfig: {
        provider: 'simulated',
        apiKey: ''
      }
    },
    sqlConfig: {
      active: false,
      schemaContext: ''
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [complexityLevel, setComplexityLevel] = useState('');
  const [styleDefinition, setStyleDefinition] = useState('');
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);

  // Source History State for Undo/Redo
  const [sourceHistory, setSourceHistory] = useState<{past: Notebook[][], future: Notebook[][]}>({ past: [], future: [] });
  
  // SQL Form State
  const [sqlServer, setSqlServer] = useState('');
  const [sqlDb, setSqlDb] = useState('');
  const [sqlSchema, setSqlSchema] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derived state
  const activeNotebook = state.notebooks.find(n => n.id === state.activeNotebookId) || state.notebooks[0];
  const activePage = activeNotebook?.pages.find(p => p.id === state.activePageId) || activeNotebook?.pages[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activePage?.chatHistory]);

  // --- Source History Helpers ---
  const pushSourceHistory = () => {
    setSourceHistory(prev => ({
      past: [...prev.past, state.notebooks],
      future: []
    }));
  };

  const undoSourceChange = () => {
    if (sourceHistory.past.length === 0) return;
    const previous = sourceHistory.past[sourceHistory.past.length - 1];
    const newPast = sourceHistory.past.slice(0, -1);
    
    setSourceHistory({
      past: newPast,
      future: [state.notebooks, ...sourceHistory.future]
    });
    setState(prev => ({ ...prev, notebooks: previous }));
  };

  const redoSourceChange = () => {
    if (sourceHistory.future.length === 0) return;
    const next = sourceHistory.future[0];
    const newFuture = sourceHistory.future.slice(1);

    setSourceHistory({
      past: [...sourceHistory.past, state.notebooks],
      future: newFuture
    });
    setState(prev => ({ ...prev, notebooks: next }));
  };

  // --- Notebook CRUD ---
  const handleCreateNotebook = useCallback(() => {
    const name = prompt("Notebook Name:") || "Untitled Notebook";
    const newPage: Page = {
       id: Math.random().toString(36).substr(2, 9),
       name: 'Page 1',
       generatedContent: {},
       chatHistory: [{ role: 'assistant', content: 'New workspace initialized.' }]
    };
    const newNb: Notebook = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      sources: [],
      pages: [newPage]
    };
    setState(prev => ({
      ...prev,
      notebooks: [...prev.notebooks, newNb],
      activeNotebookId: newNb.id,
      activePageId: newPage.id
    }));
  }, []);

  const handleImportNotebook = useCallback((notebook: Notebook) => {
    setState(prev => ({
      ...prev,
      notebooks: [...prev.notebooks, notebook],
      activeNotebookId: notebook.id,
      activePageId: notebook.pages[0].id
    }));
  }, []);

  const handleDeleteNotebook = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this notebook? This action cannot be undone.')) return;
    setState(prev => {
      const remaining = prev.notebooks.filter(n => n.id !== id);
      if (remaining.length === 0) {
         return {
            ...prev,
            notebooks: [INITIAL_NOTEBOOK],
            activeNotebookId: INITIAL_NOTEBOOK.id,
            activePageId: INITIAL_NOTEBOOK.pages[0].id
         };
      }
      return {
         ...prev,
         notebooks: remaining,
         activeNotebookId: remaining[0].id,
         activePageId: remaining[0].pages[0].id
      };
    });
  }, []);

  const handleRenameNotebook = useCallback((id: string, newName: string) => {
    setState(prev => ({
       ...prev,
       notebooks: prev.notebooks.map(n => n.id === id ? { ...n, name: newName } : n)
    }));
  }, []);

  const handleReorderNotebooks = useCallback((startIndex: number, endIndex: number) => {
    setState(prev => {
      const result = Array.from(prev.notebooks);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { ...prev, notebooks: result };
    });
  }, []);

  // --- Page CRUD ---
  const handleCreatePage = useCallback((notebookId: string) => {
     const newPage: Page = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Page ${Math.floor(Math.random() * 1000)}`,
        generatedContent: {},
        chatHistory: [{ role: 'assistant', content: 'New page initialized.' }]
     };
     setState(prev => ({
        ...prev,
        notebooks: prev.notebooks.map(n => n.id === notebookId ? { ...n, pages: [...n.pages, newPage] } : n),
        activeNotebookId: notebookId,
        activePageId: newPage.id
     }));
  }, []);

  const handleDeletePage = useCallback((notebookId: string, pageId: string) => {
     if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) return;
     setState(prev => {
        const nb = prev.notebooks.find(n => n.id === notebookId);
        if (!nb) return prev;
        if (nb.pages.length <= 1) {
           alert("A notebook must have at least one page.");
           return prev;
        }
        const newPages = nb.pages.filter(p => p.id !== pageId);
        const newActivePageId = pageId === prev.activePageId ? newPages[0].id : prev.activePageId;
        
        return {
           ...prev,
           notebooks: prev.notebooks.map(n => n.id === notebookId ? { ...n, pages: newPages } : n),
           activePageId: newActivePageId
        };
     });
  }, []);

  const handleRenamePage = useCallback((notebookId: string, pageId: string, newName: string) => {
    setState(prev => ({
       ...prev,
       notebooks: prev.notebooks.map(n => n.id === notebookId ? {
          ...n,
          pages: n.pages.map(p => p.id === pageId ? { ...p, name: newName } : p)
       } : n)
    }));
  }, []);

  const handleReorderPages = useCallback((notebookId: string, startIndex: number, endIndex: number) => {
     setState(prev => ({
        ...prev,
        notebooks: prev.notebooks.map(n => {
           if (n.id !== notebookId) return n;
           const result = Array.from(n.pages);
           const [removed] = result.splice(startIndex, 1);
           result.splice(endIndex, 0, removed);
           return { ...n, pages: result };
        })
     }));
  }, []);

  const handleSwitchNotebook = useCallback((notebookId: string, pageId: string) => {
    setState(prev => ({ ...prev, activeNotebookId: notebookId, activePageId: pageId }));
  }, []);

  // --- Source Management ---
  const addSource = useCallback((source: Omit<Source, 'id'>) => {
    pushSourceHistory();
    setState(prev => ({
      ...prev,
      notebooks: prev.notebooks.map(nb => nb.id === prev.activeNotebookId ? {
        ...nb,
        sources: [...nb.sources, { ...source, id: Math.random().toString(36).substr(2, 9) }]
      } : nb)
    }));
  }, [state.activeNotebookId, state.notebooks]); // Added dependencies to ensure pushHistory captures correct state

  const removeSource = useCallback((id: string) => {
    pushSourceHistory();
    setState(prev => ({
      ...prev,
      notebooks: prev.notebooks.map(nb => nb.id === prev.activeNotebookId ? {
        ...nb,
        sources: nb.sources.filter(s => s.id !== id)
      } : nb)
    }));
  }, [state.activeNotebookId, state.notebooks]);

  const handleReorderSources = useCallback((startIndex: number, endIndex: number) => {
     pushSourceHistory();
     setState(prev => ({
        ...prev,
        notebooks: prev.notebooks.map(nb => {
           if (nb.id !== prev.activeNotebookId) return nb;
           const result = Array.from(nb.sources);
           const [removed] = result.splice(startIndex, 1);
           result.splice(endIndex, 0, removed);
           return { ...nb, sources: result };
        })
     }));
  }, [state.activeNotebookId, state.notebooks]);


  // --- Generators ---
  const handleGenerate = async (view: StudioView) => {
    if (!activeNotebook || activeNotebook.sources.length === 0 || !activePage) return;
    setState(prev => ({ ...prev, isLoading: true, activeView: view, error: undefined }));
    try {
      const result = await generateStudioContent(
        activeNotebook.sources, 
        view as any, 
        state.settings, 
        undefined, 
        focusArea,
        state.sqlConfig.active ? state.sqlConfig.schemaContext : undefined,
        activePage.complexityLevel || complexityLevel,
        activePage.styleDefinition || styleDefinition
      );
      
      // Log SQL transforms for table generation
      if (view === 'table' && state.sqlConfig.active) {
        addSqlTransform(
          'TABLE_GENERATION',
          'Generated flat table output from SQL schema',
          {
            inputFields: ['sql_schema', 'chat_context'],
            outputFields: result?.headers || [],
            calculation: 'Extracted and flattened data based on conversation context'
          }
        );
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        notebooks: prev.notebooks.map(nb => nb.id === prev.activeNotebookId ? {
          ...nb,
          pages: nb.pages.map(p => p.id === prev.activePageId ? {
             ...p,
             generatedContent: { ...p.generatedContent, [view]: result }
          } : p)
        } : nb)
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: err.message || "Synthesis failure. Retry." }));
    }
  };

  const handleGenerateAll = async () => {
    if (!activeNotebook || activeNotebook.sources.length === 0 || !activePage) return;
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    const views: Exclude<StudioView, 'chat' | 'canvas'>[] = ['report', 'infographic', 'mindmap', 'flashcards', 'slides', 'table', 'dashboard'];
    
    try {
      const results = await Promise.all(
        views.map(view => generateStudioContent(
            activeNotebook.sources, 
            view, 
            state.settings, 
            undefined, 
            focusArea,
            state.sqlConfig.active ? state.sqlConfig.schemaContext : undefined,
            activePage.complexityLevel || complexityLevel,
            activePage.styleDefinition || styleDefinition
        ).catch(e => null))
      );
      
      const newContent: any = {};
      views.forEach((v, i) => { if(results[i]) newContent[v] = results[i]; });

      setState(prev => ({
        ...prev,
        isLoading: false,
        notebooks: prev.notebooks.map(nb => nb.id === prev.activeNotebookId ? {
          ...nb,
          pages: nb.pages.map(p => p.id === prev.activePageId ? {
             ...p,
             generatedContent: { ...p.generatedContent, ...newContent }
          } : p)
        } : nb)
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: "Global synthesis failed." }));
    }
  };

  const handleReportTitleChange = useCallback((newTitle: string) => {
    setState(prev => ({
      ...prev,
      notebooks: prev.notebooks.map(nb => 
        nb.id === prev.activeNotebookId
          ? {
              ...nb,
              pages: nb.pages.map(p => p.id === prev.activePageId && p.generatedContent.report ? {
                 ...p,
                 generatedContent: {
                    ...p.generatedContent,
                    report: { ...p.generatedContent.report!, title: newTitle }
                 }
              } : p)
            }
          : nb
      )
    }));
  }, []);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || state.isLoading || !activePage) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    // Optimistic update
    setState(prev => ({
       ...prev,
       isLoading: true,
       notebooks: prev.notebooks.map(n => n.id === prev.activeNotebookId ? {
          ...n,
          pages: n.pages.map(p => p.id === prev.activePageId ? {
             ...p,
             chatHistory: [...p.chatHistory, userMsg]
          } : p)
       } : n)
    }));
    setChatInput('');

    try {
      const response = await generateStudioContent(
        activeNotebook.sources, 
        'chat', 
        state.settings, 
        chatInput,
        undefined,
        state.sqlConfig.active ? state.sqlConfig.schemaContext : undefined,
        activePage.complexityLevel || complexityLevel,
        activePage.styleDefinition || styleDefinition
      );
      
      // Log SQL transforms if query involves data manipulation
      if (state.sqlConfig.active && (chatInput.toLowerCase().includes('query') || chatInput.toLowerCase().includes('select') || chatInput.toLowerCase().includes('transform') || chatInput.toLowerCase().includes('calculate'))) {
        addSqlTransform(
          'QUERY_EXECUTION',
          `User query: ${chatInput.substring(0, 50)}...`,
          {
            inputFields: ['user_query'],
            outputFields: ['response'],
            calculation: 'AI-generated response based on SQL schema context'
          }
        );
      }
      
      const assistantMsg: ChatMessage = { role: 'assistant', content: response };
      
      setState(prev => ({
         ...prev,
         isLoading: false,
         notebooks: prev.notebooks.map(n => n.id === prev.activeNotebookId ? {
            ...n,
            pages: n.pages.map(p => p.id === prev.activePageId ? {
               ...p,
               chatHistory: [...p.chatHistory, assistantMsg]
            } : p)
         } : n)
      }));

    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: "Relay failure: " + (err.message || "No signal.") }));
    }
  };

  const cancelGeneration = () => {
    setState(prev => ({ ...prev, activeView: 'chat' }));
    setFocusArea('');
  };

  const handleConnectSql = () => {
      setState(prev => ({
          ...prev,
          sqlConfig: {
              active: true,
              schemaContext: sqlSchema,
              server: sqlServer,
              database: sqlDb,
              transformLog: []
          }
      }));
      setIsSqlModalOpen(false);
  };

  const addSqlTransform = (operation: string, description: string, details?: any) => {
    setState(prev => ({
      ...prev,
      sqlConfig: {
        ...prev.sqlConfig,
        transformLog: [
          ...(prev.sqlConfig.transformLog || []),
          {
            timestamp: new Date().toISOString(),
            operation,
            description,
            ...details
          }
        ]
      }
    }));
  };

  const exportSqlTransformLog = () => {
    if (!state.sqlConfig.transformLog || state.sqlConfig.transformLog.length === 0) {
      alert('No transform log to export!');
      return;
    }

    const logData = {
      server: state.sqlConfig.server,
      database: state.sqlConfig.database,
      exportDate: new Date().toISOString(),
      transforms: state.sqlConfig.transformLog
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sql-transform-log-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${state.isDarkMode ? 'dark' : ''}`}>
      <div className="flex w-full h-full bg-neutral-700 transition-colors selection:bg-neutral-600 selection:text-white">
        
        {/* Sidebar */}
        <div className="flex-shrink-0 z-50">
          <Sidebar 
            notebooks={state.notebooks} 
            activeNotebookId={state.activeNotebookId}
            activePageId={state.activePageId}
            onSwitchNotebook={handleSwitchNotebook} 
            
            onCreateNotebook={handleCreateNotebook}
            onDeleteNotebook={handleDeleteNotebook}
            onRenameNotebook={handleRenameNotebook}
            onReorderNotebooks={handleReorderNotebooks}
            onImportNotebook={handleImportNotebook}

            onCreatePage={handleCreatePage}
            onDeletePage={handleDeletePage}
            onRenamePage={handleRenamePage}
            onReorderPages={handleReorderPages}

            onAddSource={addSource} 
            onRemoveSource={removeSource} 
            onReorderSources={handleReorderSources}

            onUndo={undoSourceChange}
            onRedo={redoSourceChange}
            canUndo={sourceHistory.past.length > 0}
            canRedo={sourceHistory.future.length > 0}

            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isSidebarPinned={isSidebarPinned}
            setIsSidebarPinned={setIsSidebarPinned}
            settings={state.settings}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          
          {/* Top Navigation Bar */}
          <header className="h-12 border-b border-neutral-600 flex items-center justify-between px-4 bg-neutral-700 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              {/* Spacer if sidebar unpinned and open to prevent overlap if necessary, though absolute positioning handles most */}
              {!isSidebarPinned && <div className="w-8"></div>}
              
              <div className="w-5 h-5 bg-neutral-100 rounded flex items-center justify-center text-black font-black text-[10px]">A</div>
              <div className="flex flex-col">
                 <h1 className="text-[10px] font-black text-neutral-400 tracking-widest uppercase leading-none mb-0.5">{activeNotebook?.name || 'Studio Core'}</h1>
                 <span className="text-[8px] font-mono text-neutral-600 uppercase">{activePage?.name}</span>
              </div>
              <div className="h-4 w-[1px] bg-neutral-500 mx-1" />
              <div className="text-[10px] text-neutral-400 font-mono italic">CLUSTER: {activeNotebook?.sources.length || 0} SIGNALS</div>
            </div>

            <div className="flex items-center gap-1">
              <nav className="hidden md:flex items-center bg-neutral-700 p-0.5 rounded border border-neutral-600">
                {(['report', 'dashboard', 'infographic', 'mindmap', 'flashcards', 'slides', 'table', 'canvas', 'chat'] as StudioView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setState(prev => ({...prev, activeView: view}))}
                    className={`px-3 py-1 rounded text-[9px] font-black transition-all whitespace-nowrap uppercase tracking-widest border-2 border-transparent ${state.activeView === view ? 'bg-neutral-600 text-neutral-100 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'text-neutral-400 hover:text-neutral-200 hover:border-orange-500'}`}
                  >
                    {view}
                  </button>
                ))}
              </nav>
              {/* Mobile View Selector Simplification */}
              <div className="md:hidden">
                 <select 
                    value={state.activeView} 
                    onChange={(e) => setState(prev => ({...prev, activeView: e.target.value as StudioView}))}
                    className="bg-neutral-600 text-neutral-200 text-[9px] font-black uppercase p-1 rounded border-2 border-transparent hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)] outline-none"
                 >
                    {(['report', 'dashboard', 'infographic', 'mindmap', 'flashcards', 'slides', 'table', 'canvas', 'chat'] as StudioView[]).map((view) => (
                       <option key={view} value={view}>{view}</option>
                    ))}
                 </select>
              </div>

              <div className="h-4 w-[1px] bg-neutral-500 mx-2 hidden md:block" />
              <button 
                onClick={() => setIsStyleModalOpen(true)}
                className="p-1.5 rounded transition-all text-[9px] font-black uppercase tracking-widest border-2 border-transparent text-neutral-300 hover:text-white hover:bg-neutral-600 hover:border-orange-500"
                title="Set Complexity & Style"
              >
                Style
              </button>
              <button 
                onClick={() => setIsSqlModalOpen(true)}
                className={`p-1.5 rounded transition-all text-[9px] font-black uppercase tracking-widest border-2 ${state.sqlConfig.active ? 'text-green-400 bg-neutral-600 border-green-700 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-neutral-300 hover:text-white hover:bg-neutral-600 border-transparent hover:border-orange-500'}`}
                title="Connect Data Source"
              >
                {state.sqlConfig.active ? 'DB Active' : 'DB Connect'}
              </button>
              <div className="h-4 w-[1px] bg-neutral-500 mx-2 hidden md:block" />
              <button onClick={handleGenerateAll} title="Synthesize All" className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-600 rounded transition-all border-2 border-transparent hover:border-orange-500">⚡</button>
              <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-600 rounded transition-all border-2 border-transparent hover:border-orange-500">⚙</button>
            </div>
          </header>

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto bg-neutral-700 p-10 custom-scrollbar relative">
            <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-5">
              <span className="text-[120px] font-black select-none uppercase tracking-tighter">ANTIGRAVITY</span>
            </div>

            <div className="max-w-6xl mx-auto min-h-full pb-64 relative z-10">
              {state.activeView !== 'chat' && !activePage?.generatedContent[state.activeView] && !state.isLoading ? (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-16 bg-neutral-600 rounded-lg border border-neutral-500 max-w-lg shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)] relative group">
                    {/* Close Button (X) */}
                    <button 
                      onClick={cancelGeneration}
                      className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-all border-2 border-transparent hover:border-orange-500 rounded"
                      title="Cancel and close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <h2 className="text-xl font-black text-neutral-100 mb-2 tracking-widest uppercase">Terminal Idle</h2>
                    <p className="text-neutral-400 text-[10px] font-mono mb-10 leading-relaxed uppercase">Generate a comprehensive {state.activeView} from the cluster.</p>
                    
                    <div className="mb-8 text-left">
                      <label className="block text-[8px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-3">Synthesis Focus</label>
                      <input 
                        type="text"
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                        placeholder="Define directive..."
                        className="w-full bg-neutral-700 border-2 border-neutral-500 rounded p-4 focus:ring-0 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)] outline-none text-xs text-neutral-300 font-mono uppercase transition-all hover:border-orange-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleGenerate(state.activeView)} className="w-full bg-white text-black font-black py-4 rounded uppercase tracking-[0.2em] text-[10px] hover:bg-neutral-200 transition-all border-2 border-transparent focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]">Execute Single View</button>
                      <button onClick={handleGenerateAll} className="w-full bg-neutral-700 border-2 border-neutral-500 text-neutral-300 font-black py-4 rounded hover:bg-neutral-500 uppercase tracking-[0.2em] text-[10px] transition-all hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]">Execute Full Workspace</button>
                      <button onClick={cancelGeneration} className="w-full mt-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest hover:text-neutral-200 transition-all border-2 border-transparent hover:border-orange-500 rounded p-2">Abort Procedure</button>
                    </div>
                  </div>
                </div>
              ) : state.isLoading ? (
                <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-0.5 bg-neutral-500 overflow-hidden">
                    <div className="w-full h-full bg-white animate-[loading_1.5s_infinite]" />
                  </div>
                  <p className="text-neutral-400 font-mono text-[9px] tracking-[0.4em] uppercase">Synthesizing Signal Data...</p>
                </div>
              ) : state.activeView === 'chat' ? (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-24 h-[1px] bg-neutral-500 mb-8" />
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.5em]">Command Interface Active</p>
                  <p className="text-[9px] font-mono text-neutral-500 mt-4 max-w-xs uppercase">Cluster is ready for natural language interrogation.</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000">
                  <div className="flex justify-between items-center mb-12">
                     <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-neutral-100 animate-pulse"></div>
                        <h2 className="text-[10px] font-black text-neutral-50 uppercase tracking-[0.3em]">Module: {state.activeView}</h2>
                     </div>
                     <div className="h-[1px] flex-1 bg-neutral-600 mx-8"></div>
                     <button onClick={() => handleGenerate(state.activeView)} className="text-[9px] font-black text-neutral-400 hover:text-white uppercase tracking-widest px-4 py-2 border-2 border-neutral-600 rounded hover:bg-neutral-600 transition-all hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]">Re-Synthesize</button>
                  </div>

                  <div className="space-y-12">
                    {state.activeView === 'report' && <Report data={activePage!.generatedContent.report!} onTitleChange={handleReportTitleChange} />}
                    {state.activeView === 'infographic' && <Infographic data={activePage!.generatedContent.infographic!} />}
                    {state.activeView === 'mindmap' && <Mindmap data={activePage!.generatedContent.mindmap!} />}
                    {state.activeView === 'flashcards' && <FlashCards data={activePage!.generatedContent.flashcards!} />}
                    {state.activeView === 'slides' && <SlideDeck data={activePage!.generatedContent.slides!} />}
                    {state.activeView === 'table' && <TableView data={activePage!.generatedContent.table!} />}
                    {state.activeView === 'dashboard' && <Dashboard data={activePage!.generatedContent.dashboard!} />}
                    {state.activeView === 'canvas' && <Canvas />}
                  </div>
                </div>
              )}

              {state.error && (
                <div className="mt-8 bg-neutral-700 border border-neutral-500 text-neutral-400 p-6 rounded text-[10px] font-mono uppercase tracking-widest text-center shadow-lg">ERROR_CODE_552: {state.error}</div>
              )}
            </div>
          </div>

          {/* Floating Chat */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 pointer-events-none z-30">
            <div className="pointer-events-auto bg-neutral-700/95 backdrop-blur-md rounded border border-neutral-600 shadow-2xl flex flex-col max-h-[450px]">
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {activePage?.chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-6 py-4 rounded text-xs leading-relaxed ${msg.role === 'user' ? 'bg-neutral-100 text-black font-black uppercase' : 'bg-neutral-600 text-neutral-200 font-mono'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={handleChat} className="p-4 border-t border-neutral-600 flex gap-4 bg-neutral-700">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="INPUT COMMAND OR QUERY..."
                  className="flex-1 bg-neutral-600 border-2 border-neutral-500 text-neutral-100 rounded px-6 py-4 outline-none text-[10px] font-black uppercase tracking-widest transition-all hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                />
                <button type="submit" disabled={state.isLoading} className="bg-neutral-100 disabled:opacity-20 text-black w-14 h-14 rounded flex items-center justify-center transition-all hover:bg-white border-2 border-transparent hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg></button>
              </form>
            </div>
          </div>
        </main>

        {isSettingsOpen && (
          <SettingsModal 
            settings={state.settings} 
            onSave={(newSettings) => { setState(prev => ({ ...prev, settings: newSettings })); setIsSettingsOpen(false); }} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        )}

        {isSqlModalOpen && (
          <div className="fixed inset-0 bg-neutral-700/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <div className="bg-neutral-600 rounded-[2rem] w-full max-w-lg shadow-2xl border border-neutral-500 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-neutral-500 flex justify-between items-center">
                   <h2 className="text-xl font-black text-white tracking-tight uppercase">SQL Data Bridge (Simulation)</h2>
                   <button onClick={() => setIsSqlModalOpen(false)} className="text-neutral-400 hover:text-white transition-all border-2 border-transparent hover:border-orange-500 rounded p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-[10px] text-neutral-300 font-mono leading-relaxed">
                        Browser security prevents direct TCP connections to SQL Servers. This bridge allows you to ingest a schema or dataset dump (JSON/CSV) which the AI will treat as a live database for complex queries, joins, and aggregations.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Server Ref</label>
                          <input type="text" value={sqlServer} onChange={e => setSqlServer(e.target.value)} placeholder="localhost" className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-3 text-xs text-white transition-all hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)] outline-none" />
                       </div>
                       <div>
                          <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Database</label>
                          <input type="text" value={sqlDb} onChange={e => setSqlDb(e.target.value)} placeholder="AnalyticsDB" className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-3 text-xs text-white transition-all hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)] outline-none" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Schema / Data Dump Context</label>
                       <textarea 
                          value={sqlSchema} 
                          onChange={e => setSqlSchema(e.target.value)} 
                          placeholder="PASTE TABLE SCHEMAS OR JSON DATA HERE..." 
                          className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-4 h-40 text-[10px] font-mono text-neutral-200 resize-none outline-none transition-all hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                        />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleConnectSql}
                        className="flex-1 bg-white hover:bg-neutral-200 text-black font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs border-2 border-transparent focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                      >
                        Establish Bridge
                      </button>
                      {state.sqlConfig.active && state.sqlConfig.transformLog && state.sqlConfig.transformLog.length > 0 && (
                        <button 
                          onClick={exportSqlTransformLog}
                          className="px-6 bg-neutral-500 hover:bg-neutral-400 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs border-2 border-transparent hover:border-orange-500"
                        >
                          Export Log
                        </button>
                      )}
                    </div>
                    {state.sqlConfig.active && state.sqlConfig.transformLog && state.sqlConfig.transformLog.length > 0 && (
                      <div className="mt-4 p-4 bg-neutral-700 rounded-xl border border-neutral-500">
                        <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Transform Log ({state.sqlConfig.transformLog.length} operations)</label>
                        <div className="max-h-32 overflow-y-auto text-[9px] font-mono text-neutral-300 space-y-1">
                          {state.sqlConfig.transformLog.slice(-5).map((log, idx) => (
                            <div key={idx} className="text-neutral-400">
                              {new Date(log.timestamp).toLocaleTimeString()}: {log.operation} - {log.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
             </div>
          </div>
        )}

        {isStyleModalOpen && (
          <div className="fixed inset-0 bg-neutral-700/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <div className="bg-neutral-600 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-neutral-500 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-neutral-500 flex justify-between items-center">
                   <h2 className="text-xl font-black text-white tracking-tight uppercase">Complexity & Style Definition</h2>
                   <button onClick={() => setIsStyleModalOpen(false)} className="text-neutral-400 hover:text-white transition-all border-2 border-transparent hover:border-orange-500 rounded p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-[10px] text-neutral-300 font-mono leading-relaxed">
                        Define complexity level and style preferences for all generated outputs. These settings will guide the AI in creating content that matches your desired scope and aesthetic.
                    </p>
                    <div>
                       <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Complexity Level</label>
                       <select 
                          value={complexityLevel} 
                          onChange={e => setComplexityLevel(e.target.value)} 
                          className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-3 text-xs text-white transition-all hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)] outline-none"
                       >
                          <option value="">Default</option>
                          <option value="simple">Simple - Brief and straightforward</option>
                          <option value="moderate">Moderate - Balanced depth</option>
                          <option value="detailed">Detailed - Comprehensive analysis</option>
                          <option value="technical">Technical - Expert-level detail</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Style Definition</label>
                       <textarea 
                          value={styleDefinition} 
                          onChange={e => setStyleDefinition(e.target.value)} 
                          placeholder="E.g., 'Use professional tone, include specific examples, focus on actionable insights...'" 
                          className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-4 h-32 text-[10px] font-mono text-neutral-200 resize-none outline-none transition-all hover:border-orange-500 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                        />
                    </div>
                    <button 
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          notebooks: prev.notebooks.map(nb => nb.id === prev.activeNotebookId ? {
                            ...nb,
                            pages: nb.pages.map(p => p.id === prev.activePageId ? {
                              ...p,
                              complexityLevel,
                              styleDefinition
                            } : p)
                          } : nb)
                        }));
                        setIsStyleModalOpen(false);
                      }}
                      className="w-full bg-white hover:bg-neutral-200 text-black font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs border-2 border-transparent focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                    >
                      Apply Settings
                    </button>
                </div>
             </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
};

export default App;
