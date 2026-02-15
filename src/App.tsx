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
import { generateStudioContent, performDeepResearch } from './services/llmService';
import * as sqlService from './services/sqlService';

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
    activeView: 'chat',
    isLoading: false,
    isDarkMode: true,
    settings: {
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
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
  
  // UX State
  const [userClickedGenerate, setUserClickedGenerate] = useState(false);

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
  // --- SQL Integration ---
  useEffect(() => {
    sqlService.initDatabase();
  }, []);

  const handleExecuteSQL = (query: string) => {
    try {
      const results = sqlService.runQuery(query);
      const schema = sqlService.getSchemaContext();
      setState(prev => ({
        ...prev,
        sqlConfig: {
          ...prev.sqlConfig,
          schemaContext: schema
        }
      }));
      return results;
    } catch (err) {
      console.error("SQL Execution Error:", err);
      return null;
    }
  };

  const handleAddSource = async (newSource: Omit<Source, 'id'>) => {
    const id = `src-${Date.now()}`;
    const source: Source = { ...newSource, id };

    // --- Phase 4: Data Ingestion Logic ---
    if (source.type === 'data' && source.content) {
      try {
        const jsonData = JSON.parse(source.content);
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        sqlService.importToTable(source.title.replace(/[^a-zA-Z0-9]/g, '_'), dataArray);
        
        // JSON First-pass via Local Model
        if (state.settings.localEnrichment) {
          console.log("[Ingest] Performing local first-pass summary for data:", source.title);
          // Simplified call to llmService for summary
          const summary = await generateStudioContent(
            [source], 
            'chat', 
            { ...state.settings, provider: 'local', model: 'local-model' }, 
            "Provide a one-paragraph statistical summary of this dataset."
          );
          source.content = `[LOCAL_SUMMARY]: ${summary}\n\n[RAW_DATA]:\n${source.content}`;
        }
      } catch (e) {
        console.warn("Failed to parse/import data source:", e);
      }
    }

    const updatedNotebooks = state.notebooks.map(nb => 
      nb.id === state.activeNotebookId 
        ? { ...nb, sources: [...nb.sources, source] }
        : nb
    );
    setState(prev => ({ ...prev, notebooks: updatedNotebooks }));
    
    // Update SQL schema context if data was added
    if (source.type === 'data') {
      const updatedSchema = sqlService.getSchemaContext();
      setState(prev => ({
        ...prev,
        sqlConfig: { ...prev.sqlConfig, schemaContext: updatedSchema }
      }));
    }
  };

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
    if (!activeNotebook || activeNotebook.sources.length === 0 || !activePage) {
      setState(prev => ({ ...prev, error: "No sources available. Please add sources to generate content." }));
      return;
    }
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
      console.error('Generation error:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || "Synthesis failure. Check console for details and retry." 
      }));
    }
  };

  const handleGenerateAll = async () => {
    if (!activeNotebook || activeNotebook.sources.length === 0 || !activePage) {
      setState(prev => ({ ...prev, error: "No sources available. Please add sources to generate content." }));
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    const views: Exclude<StudioView, 'chat' | 'canvas'>[] = ['report', 'infographic', 'mindmap', 'flashcards', 'slides', 'table', 'dashboard'];
    
    try {
      const results = await Promise.allSettled(
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
      let hasErrors = false;
      
      results.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
          newContent[views[i]] = result.value;
        } else if (result.status === 'rejected') {
          console.error(`Failed to generate ${views[i]}:`, result.reason);
          hasErrors = true;
        }
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: hasErrors ? "Some views failed to generate. Check console for details." : undefined,
        notebooks: prev.notebooks.map(nb => nb.id === prev.activeNotebookId ? {
          ...nb,
          pages: nb.pages.map(p => p.id === prev.activePageId ? {
             ...p,
             generatedContent: { ...p.generatedContent, ...newContent }
          } : p)
        } : nb)
      }));
    } catch (err: any) {
      console.error('Global synthesis error:', err);
      setState(prev => ({ ...prev, isLoading: false, error: "Global synthesis failed. " + (err.message || "Unknown error.") }));
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
    
    if (!activeNotebook || activeNotebook.sources.length === 0) {
      setState(prev => ({ ...prev, error: "No sources available. Please add sources before chatting." }));
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    const currentInput = chatInput; // Capture input before clearing
    
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
        currentInput,
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
         error: undefined,
         notebooks: prev.notebooks.map(n => n.id === prev.activeNotebookId ? {
            ...n,
            pages: n.pages.map(p => p.id === prev.activePageId ? {
               ...p,
               chatHistory: [...p.chatHistory, assistantMsg]
            } : p)
         } : n)
      }));

    } catch (err: any) {
      console.error('Chat error:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: "Chat relay failure: " + (err.message || "No response received.") 
      }));
    }
  };

  const cancelGeneration = () => {
    setState(prev => ({ ...prev, activeView: 'chat' }));
    setFocusArea('');
  };

  const handleConnectSql = () => {
      if (!sqlSchema.trim()) {
        alert("Please provide schema context before establishing bridge.");
        return;
      }
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
      <div className="flex w-full h-full bg-neutral-900 transition-colors selection:bg-neutral-800 selection:text-white">
        
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

            onAddSource={handleAddSource} 
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
          <header className="h-10 border-b border-neutral-800 flex items-center justify-between px-3 bg-neutral-900 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              {/* Spacer if sidebar unpinned and open to prevent overlap if necessary, though absolute positioning handles most */}
              {!isSidebarPinned && <div className="w-8"></div>}
              
              <div className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center text-black font-black text-[9px]">A</div>
              <div className="flex flex-col">
                 <h1 className="text-[10px] font-bold text-neutral-300 tracking-wider uppercase leading-none mb-0.5">{activeNotebook?.name || 'Studio Core'}</h1>
                 <span className="text-[8px] font-mono text-neutral-600 uppercase">{activePage?.name}</span>
              </div>
              <div className="h-3 w-[1px] bg-neutral-700 mx-1" />
              <div className="text-[9px] text-neutral-500 font-mono">SIGNAL CLUSTER: {activeNotebook?.sources.length || 0}</div>
            </div>

            <div className="flex items-center gap-1">
              <nav className="hidden md:flex items-center bg-neutral-800 p-0.5 rounded border border-neutral-700/50">
                {(['report', 'dashboard', 'infographic', 'mindmap', 'flashcards', 'slides', 'table', 'canvas', 'chat'] as StudioView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setState(prev => ({...prev, activeView: view}))}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all whitespace-nowrap uppercase tracking-wider border border-transparent ${state.activeView === view ? 'bg-neutral-700 text-neutral-100 border-neutral-600' : 'text-neutral-500 hover:text-neutral-300 hover:border-neutral-600'}`}
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
                    className="bg-neutral-800 text-neutral-300 text-[9px] font-bold uppercase p-1 rounded border border-neutral-700 outline-none"
                 >
                    {(['report', 'dashboard', 'infographic', 'mindmap', 'flashcards', 'slides', 'table', 'canvas', 'chat'] as StudioView[]).map((view) => (
                       <option key={view} value={view}>{view}</option>
                    ))}
                 </select>
              </div>

              <div className="h-3 w-[1px] bg-neutral-700 mx-2 hidden md:block" />
              <button 
                onClick={() => setIsStyleModalOpen(true)}
                className="p-1 rounded transition-all text-[9px] font-bold uppercase tracking-wider border border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800"
                title="Set Complexity & Style"
              >
                Style
              </button>
              <button 
                onClick={() => setIsSqlModalOpen(true)}
                className={`p-1 rounded transition-all text-[9px] font-bold uppercase tracking-wider border border-transparent ${state.sqlConfig.active ? 'text-green-400 bg-neutral-800 border-green-900/50' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                title="Connect Data Source"
              >
                {state.sqlConfig.active ? 'DB Active' : 'DB Connect'}
              </button>
              <div className="h-3 w-[1px] bg-neutral-700 mx-2 hidden md:block" />
              <button onClick={handleGenerateAll} title="Synthesize All" className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-all">⚡</button>
              <button onClick={() => setIsSettingsOpen(true)} className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-all">⚙</button>
            </div>
          </header>

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto bg-black/20 p-4 custom-scrollbar relative">
            <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-[0.02]">
              <span className="text-[100px] font-black select-none uppercase tracking-tighter">ANTIGRAVITY</span>
            </div>

            <div className="w-full max-w-full px-4 mx-auto min-h-full pb-64 relative z-10">
              {state.activeView !== 'chat' && !activePage?.generatedContent[state.activeView] && !state.isLoading ? (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-8 bg-neutral-900/80 rounded-lg border border-neutral-800 max-w-md shadow-2xl relative group backdrop-blur-sm">
                    {/* Close Button (X) */}
                    <button 
                      onClick={cancelGeneration}
                      className="absolute top-3 right-3 p-1 text-neutral-600 hover:text-white transition-all rounded hover:bg-neutral-800"
                      title="Cancel and close"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <h2 className="text-sm font-bold text-neutral-200 mb-1 tracking-wider uppercase">Terminal Idle</h2>
                    <p className="text-neutral-500 text-[10px] font-mono mb-6 leading-relaxed uppercase">Generate a comprehensive {state.activeView} from the cluster.</p>
                    
                    <div className="mb-6 text-left">
                      <label className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Synthesis Focus</label>
                      <input 
                        id="synthesis-focus"
                        type="text"
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                        placeholder="Define directive..."
                        className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 focus:border-orange-500 outline-none text-[10px] text-neutral-300 font-mono uppercase transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <button onClick={() => { setUserClickedGenerate(true); handleGenerate(state.activeView); }} className="w-full bg-neutral-100 text-black font-bold py-2.5 rounded uppercase tracking-wider text-[10px] hover:bg-white transition-colors">Execute Single View</button>
                      <button onClick={() => { setUserClickedGenerate(true); handleGenerateAll(); }} className="w-full bg-neutral-800 border border-neutral-700 text-neutral-400 font-bold py-2.5 rounded hover:bg-neutral-700 hover:text-white uppercase tracking-wider text-[10px] transition-colors">Execute Full Workspace</button>
                    </div>
                  </div>
                </div>
              ) : state.isLoading ? (
                <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-0.5 bg-neutral-800 overflow-hidden rounded-full">
                    <div className="w-full h-full bg-orange-500 animate-[loading_1s_infinite]" />
                  </div>
                  <p className="text-neutral-500 font-mono text-[9px] tracking-[0.4em] uppercase">Synthesizing...</p>
                </div>
              ) : state.activeView === 'chat' ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center opacity-20 pointer-events-none select-none">
                  <div className="w-16 h-[1px] bg-neutral-700 mb-4" />
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em]">Ready</p>
                </div>
              ) : !activePage?.generatedContent[state.activeView] && !userClickedGenerate ? (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center">
                   <div className="w-12 h-12 rounded-full border border-neutral-800 border-dashed mb-6 animate-[spin_10s_linear_infinite]"></div>
                   <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.4em] mb-4">Module Ready: {state.activeView}</h2>
                   <button 
                     onClick={() => setUserClickedGenerate(true)}
                     className="px-5 py-2 border border-neutral-700 text-neutral-400 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-neutral-800 hover:text-white transition-all"
                   >
                     Initialize Synthesis
                   </button>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-2">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                        <h2 className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Module: {state.activeView}</h2>
                     </div>
                     <button onClick={() => handleGenerate(state.activeView)} className="text-[9px] font-bold text-neutral-500 hover:text-white uppercase tracking-widest px-3 py-1 border border-neutral-800 rounded hover:bg-neutral-800 transition-all">Re-Synthesize</button>
                  </div>

                  <div className="space-y-8">
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
                <div className="mt-8 bg-neutral-900 border border-red-900/30 text-red-400 p-4 rounded text-[10px] font-mono uppercase tracking-widest text-center">ERROR: {state.error}</div>
              )}
            </div>
          </div>

          {/* Floating Chat */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 pointer-events-none z-30">
            <div className="pointer-events-auto bg-neutral-900/95 backdrop-blur-md rounded-lg border border-neutral-800 shadow-2xl flex flex-col transition-all duration-300" style={{ maxHeight: activePage?.chatHistory.length ? '50vh' : 'auto' }}>
              {activePage?.chatHistory.length > 0 && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar border-b border-neutral-800">
                  {activePage?.chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] px-3 py-2 rounded text-[11px] leading-relaxed ${msg.role === 'user' ? 'bg-neutral-200 text-black font-medium' : 'bg-neutral-800 text-neutral-300 font-mono border border-neutral-700'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
              
              <form onSubmit={handleChat} className="p-2 flex gap-2 bg-neutral-900 rounded-b-lg">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="INPUT COMMAND..."
                   className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-200 rounded px-4 py-3 outline-none text-[10px] font-bold uppercase tracking-widest transition-all focus:border-neutral-500"
                />
                <button type="submit" disabled={state.isLoading} className="bg-neutral-100 disabled:opacity-20 text-black w-10 rounded flex items-center justify-center hover:bg-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-neutral-900 rounded-lg w-full max-w-lg shadow-2xl border border-neutral-700 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                   <h2 className="text-sm font-bold text-neutral-200 tracking-wider uppercase">SQL Data Bridge</h2>
                   <button onClick={() => setIsSqlModalOpen(false)} className="text-neutral-500 hover:text-white transition-all p-1 hover:bg-neutral-800 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                        Secure Bridge active. Ingest schema or JSON dumps to enable localized query reasoning.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Server Ref</label>
                          <input type="text" value={sqlServer} onChange={e => setSqlServer(e.target.value)} placeholder="localhost" className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-[10px] text-neutral-300 transition-all focus:border-blue-500 outline-none" />
                       </div>
                       <div>
                          <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Database</label>
                          <input type="text" value={sqlDb} onChange={e => setSqlDb(e.target.value)} placeholder="AnalyticsDB" className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-[10px] text-neutral-300 transition-all focus:border-blue-500 outline-none" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Schema / Data Context</label>
                       <textarea 
                          id="sql-schema"
                          value={sqlSchema} 
                          onChange={e => setSqlSchema(e.target.value)} 
                          placeholder="PASTE TABLE SCHEMAS OR JSON DATA HERE..." 
                          className="w-full bg-neutral-800 border border-neutral-700 rounded p-3 h-32 text-[10px] font-mono text-neutral-300 resize-none outline-none transition-all focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleConnectSql}
                        className="flex-1 bg-neutral-100 hover:bg-white text-black font-bold py-2 rounded text-[10px] uppercase tracking-widest transition-all"
                      >
                        Establish Bridge
                      </button>
                      {state.sqlConfig.active && state.sqlConfig.transformLog && state.sqlConfig.transformLog.length > 0 && (
                        <button 
                          onClick={exportSqlTransformLog}
                          className="px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2 rounded text-[10px] uppercase tracking-widest border border-neutral-700"
                        >
                          Export Log
                        </button>
                      )}
                    </div>
                </div>
             </div>
          </div>
        )}

        {isStyleModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-neutral-900 rounded-lg w-full max-w-lg shadow-2xl border border-neutral-700 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                   <h2 className="text-sm font-bold text-neutral-200 tracking-wider uppercase">Style Definition</h2>
                   <button onClick={() => setIsStyleModalOpen(false)} className="text-neutral-500 hover:text-white transition-all p-1 hover:bg-neutral-800 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                        Configure output parameters.
                    </p>
                    <div>
                       <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Complexity</label>
                       <select 
                          value={complexityLevel} 
                          onChange={e => setComplexityLevel(e.target.value)} 
                          className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-[10px] text-neutral-300 outline-none focus:border-blue-500"
                       >
                          <option value="">Default</option>
                          <option value="simple">Simple</option>
                          <option value="moderate">Moderate</option>
                          <option value="detailed">Detailed</option>
                          <option value="technical">Technical</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Directives</label>
                       <textarea 
                          value={styleDefinition} 
                          onChange={e => setStyleDefinition(e.target.value)} 
                          placeholder="Enter custom style instructions..."
                          className="w-full bg-neutral-800 border border-neutral-700 rounded p-3 h-32 text-[10px] font-mono text-neutral-300 resize-none outline-none transition-all focus:border-blue-500"
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
                      className="w-full bg-neutral-100 hover:bg-white text-black font-bold py-2 rounded text-[10px] uppercase tracking-widest transition-all"
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #404040; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #525252; }
      `}</style>
    </div>
  );
};

export default App;
