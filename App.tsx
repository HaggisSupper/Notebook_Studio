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
  chatHistory: [{ role: 'assistant', content: 'Welcome to Notebook Studio. Ready to analyze your sources and generate insights.' }]
};

const INITIAL_NOTEBOOK: Notebook = {
  id: 'nb-1',
  name: 'Initial Notebook',
  sources: [
    { id: '1', title: 'Getting Started', content: 'Notebook Studio - A multimodal analysis tool for Gen-X professionals. Create Reports, Infographics, Mindmaps, Flashcards, Slides, Tables, and Dashboards. Optimized for clarity, readability, and efficiency.', type: 'text' }
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
    <div className={`flex h-screen w-full overflow-hidden ${state.isDarkMode ? 'dark' : ''}`} style={{ backgroundColor: '#1E1E1E' }}>
      <div className="flex w-full h-full transition-colors" style={{ backgroundColor: '#1E1E1E', color: '#CCCCCC' }}>
        
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
          <header className="h-14 flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-150" style={{ backgroundColor: '#252526', borderBottom: '1px solid #3E3E42' }}>
            <div className="flex items-center gap-4">
              {!isSidebarPinned && <div className="w-8"></div>}
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded" style={{ backgroundColor: '#FF6B35' }}>
                  <span className="text-white font-bold text-sm">NS</span>
                </div>
                <div className="flex flex-col">
                   <h1 className="text-sm font-semibold leading-tight" style={{ color: '#FFFFFF' }}>{activeNotebook?.name || 'Notebook Studio'}</h1>
                   <span className="text-xs" style={{ color: '#999999' }}>{activePage?.name}</span>
                </div>
              </div>
              <div className="h-5 w-px mx-2" style={{ backgroundColor: '#3E3E42' }} />
              <div className="text-xs font-medium" style={{ color: '#999999' }}>{activeNotebook?.sources.length || 0} Source{activeNotebook?.sources.length !== 1 ? 's' : ''}</div>
            </div>

            <div className="flex items-center gap-2">
              <nav className="hidden md:flex items-center gap-1 p-1 rounded" style={{ backgroundColor: '#1E1E1E', border: '1px solid #3E3E42' }}>
                {(['report', 'dashboard', 'infographic', 'mindmap', 'flashcards', 'slides', 'table', 'canvas', 'chat'] as StudioView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setState(prev => ({...prev, activeView: view}))}
                    aria-label={`Switch to ${view} view`}
                    aria-current={state.activeView === view ? 'page' : undefined}
                    className={`px-3 py-2 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap capitalize ${state.activeView === view ? 'shadow-md' : ''}`}
                    style={state.activeView === view ? {
                      backgroundColor: '#FF6B35',
                      color: '#FFFFFF',
                      boxShadow: '0 0 12px rgba(255, 107, 53, 0.4)'
                    } : {
                      backgroundColor: 'transparent',
                      color: '#999999',
                      border: '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (state.activeView !== view) {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#FF6B35';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (state.activeView !== view) {
                        e.currentTarget.style.color = '#999999';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid #FF6B35';
                      e.currentTarget.style.outlineOffset = '2px';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 107, 53, 0.4)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                      if (state.activeView !== view) {
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {view}
                  </button>
                ))}
              </nav>
              {/* Mobile View Selector */}
              <div className="md:hidden">
                 <select 
                    value={state.activeView} 
                    onChange={(e) => setState(prev => ({...prev, activeView: e.target.value as StudioView}))}
                    aria-label="Select view"
                    className="rounded text-sm font-medium px-3 py-2 outline-none transition-all duration-150"
                    style={{ backgroundColor: '#2D2D30', color: '#CCCCCC', border: '2px solid #3E3E42' }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#FF6B35';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 107, 53, 0.4)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#3E3E42';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                 >
                    {(['report', 'dashboard', 'infographic', 'mindmap', 'flashcards', 'slides', 'table', 'canvas', 'chat'] as StudioView[]).map((view) => (
                       <option key={view} value={view}>{view.charAt(0).toUpperCase() + view.slice(1)}</option>
                    ))}
                 </select>
              </div>

              <div className="h-5 w-px mx-1 hidden md:block" style={{ backgroundColor: '#3E3E42' }} />
              <button 
                onClick={() => setIsStyleModalOpen(true)}
                aria-label="Set complexity and style preferences"
                className="px-3 py-2 rounded text-xs font-medium transition-all duration-150 hidden md:block"
                style={{ backgroundColor: 'transparent', color: '#CCCCCC', border: '2px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.backgroundColor = '#2D2D30';
                  e.currentTarget.style.borderColor = '#FF6B35';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#CCCCCC';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid #FF6B35';
                  e.currentTarget.style.outlineOffset = '2px';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 107, 53, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Style Settings
              </button>
              <button 
                onClick={() => setIsSqlModalOpen(true)}
                aria-label={state.sqlConfig.active ? 'Database active - Click to manage' : 'Connect to database'}
                className="px-3 py-2 rounded text-xs font-medium transition-all duration-150 hidden md:block"
                style={state.sqlConfig.active ? {
                  backgroundColor: '#2D2D30',
                  color: '#4ADE80',
                  border: '2px solid #4ADE80',
                  boxShadow: '0 0 12px rgba(74, 222, 128, 0.4)'
                } : {
                  backgroundColor: 'transparent',
                  color: '#CCCCCC',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!state.sqlConfig.active) {
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.backgroundColor = '#2D2D30';
                    e.currentTarget.style.borderColor = '#FF6B35';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!state.sqlConfig.active) {
                    e.currentTarget.style.color = '#CCCCCC';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid #FF6B35';
                  e.currentTarget.style.outlineOffset = '2px';
                  e.currentTarget.style.boxShadow = state.sqlConfig.active ? '0 0 12px rgba(74, 222, 128, 0.4)' : '0 0 12px rgba(255, 107, 53, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                  if (!state.sqlConfig.active) {
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {state.sqlConfig.active ? 'Database Active' : 'Connect Database'}
              </button>
              <div className="h-5 w-px mx-1 hidden md:block" style={{ backgroundColor: '#3E3E42' }} />
              <button 
                onClick={handleGenerateAll} 
                aria-label="Generate all views"
                title="Generate all views"
                className="px-3 py-2 rounded text-xs font-medium transition-all duration-150"
                style={{ backgroundColor: 'transparent', color: '#CCCCCC', border: '2px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.backgroundColor = '#2D2D30';
                  e.currentTarget.style.borderColor = '#FF6B35';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#CCCCCC';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid #FF6B35';
                  e.currentTarget.style.outlineOffset = '2px';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 107, 53, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Generate All
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Open settings"
                title="Settings"
                className="px-3 py-2 rounded text-xs font-medium transition-all duration-150"
                style={{ backgroundColor: 'transparent', color: '#CCCCCC', border: '2px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.backgroundColor = '#2D2D30';
                  e.currentTarget.style.borderColor = '#FF6B35';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#CCCCCC';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid #FF6B35';
                  e.currentTarget.style.outlineOffset = '2px';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 107, 53, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Settings
              </button>
            </div>
          </header>

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative" style={{ backgroundColor: '#1E1E1E' }}>
            <div className="max-w-6xl mx-auto min-h-full pb-64 relative z-10">
              {state.activeView !== 'chat' && !activePage?.generatedContent[state.activeView] && !state.isLoading ? (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center">
                  <div className="p-12 rounded-lg max-w-lg relative" style={{ backgroundColor: '#252526', border: '1px solid #3E3E42', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    {/* Close Button */}
                    <button 
                      onClick={cancelGeneration}
                      aria-label="Cancel and close"
                      className="absolute top-4 right-4 p-2 rounded transition-all duration-150"
                      style={{ color: '#999999', border: '2px solid transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#FF6B35';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#999999';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Ready to Generate</h2>
                    <p className="text-sm mb-8" style={{ color: '#999999' }}>Create a comprehensive {state.activeView} from your sources.</p>
                    
                    <div className="mb-8 text-left">
                      <label className="block text-xs font-semibold mb-2" style={{ color: '#999999' }}>Focus Area (Optional)</label>
                      <input 
                        type="text"
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                        placeholder="e.g., Focus on key trends and insights..."
                        aria-label="Focus area for generation"
                        className="w-full rounded p-3 outline-none transition-all duration-150"
                        style={{ backgroundColor: '#2D2D30', color: '#CCCCCC', border: '2px solid #3E3E42', fontSize: '0.875rem' }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#FF6B35';
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 107, 53, 0.4)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#3E3E42';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => handleGenerate(state.activeView)}
                        aria-label={`Generate ${state.activeView}`}
                        className="w-full py-3 rounded font-semibold transition-all duration-150"
                        style={{ backgroundColor: '#FF6B35', color: '#FFFFFF', fontSize: '0.875rem' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FF8556';
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 107, 53, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FF6B35';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        Generate {state.activeView.charAt(0).toUpperCase() + state.activeView.slice(1)}
                      </button>
                      <button 
                        onClick={handleGenerateAll}
                        aria-label="Generate all views"
                        className="w-full py-3 rounded font-medium transition-all duration-150"
                        style={{ backgroundColor: 'transparent', color: '#CCCCCC', fontSize: '0.875rem', border: '2px solid #3E3E42' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2D2D30';
                          e.currentTarget.style.borderColor = '#FF6B35';
                          e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = '#3E3E42';
                          e.currentTarget.style.color = '#CCCCCC';
                        }}
                      >
                        Generate All Views
                      </button>
                      <button 
                        onClick={cancelGeneration}
                        aria-label="Cancel"
                        className="w-full mt-1 py-2 text-xs font-medium transition-all duration-150"
                        style={{ color: '#999999' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#999999';
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : state.isLoading ? (
                <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-1 overflow-hidden rounded-full" style={{ backgroundColor: '#3E3E42' }}>
                    <div className="w-full h-full animate-[loading_1.5s_infinite]" style={{ backgroundColor: '#FF6B35' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#999999' }}>Generating content...</p>
                </div>
              ) : state.activeView === 'chat' ? (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-px mb-8" style={{ backgroundColor: '#3E3E42' }} />
                  <p className="text-base font-semibold mb-2" style={{ color: '#CCCCCC' }}>Chat Interface Ready</p>
                  <p className="text-sm max-w-md" style={{ color: '#999999' }}>Ask questions about your sources or request specific analysis using the chat input below.</p>
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

          {/* Floating Chat - Teal Accent for Conversational UI */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 pointer-events-none z-30">
            <div className="pointer-events-auto backdrop-blur-md rounded-lg shadow-2xl flex flex-col max-h-[450px] transition-all duration-150" style={{ backgroundColor: 'rgba(37, 37, 38, 0.95)', border: '1px solid #14B8A6', boxShadow: '0 0 20px rgba(20, 184, 166, 0.2)' }}>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {activePage?.chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className="max-w-[75%] px-6 py-4 rounded-lg leading-relaxed transition-all duration-150"
                      style={msg.role === 'user' ? {
                        backgroundColor: '#2D2D30',
                        color: '#FFFFFF',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        border: '1px solid #3E3E42'
                      } : {
                        backgroundColor: '#252526',
                        color: '#CCCCCC',
                        fontSize: '0.875rem',
                        border: '1px solid #14B8A6',
                        boxShadow: '0 0 8px rgba(20, 184, 166, 0.15)'
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={handleChat} className="p-4 flex gap-4" style={{ borderTop: '1px solid #3E3E42', backgroundColor: '#252526' }}>
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  aria-label="Chat message input"
                  className="flex-1 rounded px-4 py-3 outline-none transition-all duration-150"
                  style={{ 
                    backgroundColor: '#2D2D30', 
                    color: '#CCCCCC', 
                    border: '2px solid #3E3E42',
                    fontSize: '0.875rem'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#14B8A6';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(20, 184, 166, 0.4)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#3E3E42';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button 
                  type="submit" 
                  disabled={state.isLoading}
                  aria-label="Send message"
                  className="w-12 h-12 rounded flex items-center justify-center transition-all duration-150"
                  style={{ 
                    backgroundColor: '#14B8A6', 
                    color: '#FFFFFF',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!state.isLoading) {
                      e.currentTarget.style.backgroundColor = '#2DD4BF';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(20, 184, 166, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#14B8A6';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '2px solid #14B8A6';
                    e.currentTarget.style.outlineOffset = '2px';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(20, 184, 166, 0.4)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
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
        @keyframes loading { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(100%); } 
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1E1E1E; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #3E3E42; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: #454545; 
        }
        /* Smooth transitions for interactive elements */
        button,
        a,
        input,
        textarea,
        select,
        [role="button"],
        [type="button"],
        [type="submit"],
        [type="reset"] {
          transition-property: color, background-color, border-color, box-shadow;
          transition-duration: 150ms;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* Selection color */
        ::selection {
          background-color: #FF6B35;
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
};

export default App;
