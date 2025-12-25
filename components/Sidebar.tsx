
import React, { useState, useRef, useEffect } from 'react';
import { Source, Notebook, Page, LLMSettings } from '../types';
// @ts-ignore
import JSZip from 'jszip';
import { performDeepResearch } from '../services/llmService';

interface SidebarProps {
  notebooks: Notebook[];
  activeNotebookId: string;
  activePageId: string;
  onSwitchNotebook: (notebookId: string, pageId: string) => void;
  
  // Notebook CRUD
  onCreateNotebook: () => void;
  onDeleteNotebook: (id: string) => void;
  onRenameNotebook: (id: string, newName: string) => void;
  onReorderNotebooks: (startIndex: number, endIndex: number) => void;
  onImportNotebook: (notebook: Notebook) => void;

  // Page CRUD
  onCreatePage: (notebookId: string) => void;
  onDeletePage: (notebookId: string, pageId: string) => void;
  onRenamePage: (notebookId: string, pageId: string, newName: string) => void;
  onReorderPages: (notebookId: string, startIndex: number, endIndex: number) => void;

  // Sources
  onAddSource: (source: Omit<Source, 'id'>) => void;
  onRemoveSource: (id: string) => void;
  onReorderSources: (startIndex: number, endIndex: number) => void;
  
  // Undo/Redo for Sources
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Navigation UI
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isSidebarPinned: boolean;
  setIsSidebarPinned: (isPinned: boolean) => void;

  // Settings for Agent
  settings: LLMSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  notebooks, 
  activeNotebookId, 
  activePageId,
  onSwitchNotebook, 
  onCreateNotebook, 
  onDeleteNotebook,
  onRenameNotebook,
  onReorderNotebooks,
  onImportNotebook,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  onReorderPages,
  onAddSource, 
  onRemoveSource,
  onReorderSources,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isSidebarOpen,
  setIsSidebarOpen,
  isSidebarPinned,
  setIsSidebarPinned,
  settings
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [researchQuery, setResearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<'text' | 'file' | 'url' | 'agent'>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  
  // Tree State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [draggedItem, setDraggedItem] = useState<{ type: 'notebook' | 'page' | 'source', id: string, parentId?: string, index: number } | null>(null);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set(notebooks.map(n => n.id)));
  
  // Accordion State
  const [openSections, setOpenSections] = useState<{explorer: boolean, sources: boolean}>({ explorer: true, sources: true });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const activeNotebook = notebooks.find(n => n.id === activeNotebookId);

  const toggleSection = (section: 'explorer' | 'sources') => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // --- Utility Functions ---
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Export Logic ---
  const handleExportNotebook = async (notebookId: string) => {
    const nb = notebooks.find(n => n.id === notebookId);
    if (!nb) return;

    setProcessStatus('Archiving...');
    setIsProcessing(true);
    const zip = new JSZip();
    const root = zip.folder(nb.name.replace(/[^a-z0-9]/gi, '_'));

    // 1. Notebook Metadata
    root.file("metadata.json", JSON.stringify({ id: nb.id, name: nb.name }, null, 2));

    // 2. Sources
    const sourcesFolder = root.folder("Sources");
    const sourcesManifest: any[] = [];
    
    nb.sources.forEach(source => {
      const ext = source.mimeType?.split('/')[1] || 'txt';
      const safeFilename = `source-${source.id}.${ext}`;
      sourcesManifest.push({
        id: source.id,
        title: source.title,
        type: source.type,
        mimeType: source.mimeType,
        filename: safeFilename,
        isBinary: !!source.data
      });
      if (source.data) {
        const base64Data = source.data.split(',')[1] || source.data;
        sourcesFolder.file(safeFilename, base64Data, { base64: true });
      } else {
        sourcesFolder.file(safeFilename, source.content || '');
      }
    });
    sourcesFolder.file("manifest.json", JSON.stringify(sourcesManifest, null, 2));

    // 3. Pages
    const pagesFolder = root.folder("Pages");
    nb.pages.forEach(page => {
      const pageFolder = pagesFolder.folder(page.name.replace(/[^a-z0-9]/gi, '_'));
      pageFolder.file("LLM Transcription.json", JSON.stringify({
        id: page.id,
        name: page.name,
        chatHistory: page.chatHistory
      }, null, 2));
      const artifactsFolder = pageFolder.folder("Artifacts");
      Object.entries(page.generatedContent).forEach(([key, content]) => {
        if (content) {
          artifactsFolder.file(`${key}.json`, JSON.stringify(content, null, 2));
        }
      });
    });

    const content = await zip.generateAsync({ type: "blob" });
    downloadBlob(content, `${nb.name}.zip`);
    setIsProcessing(false);
    setProcessStatus('');
  };

  // --- Import Logic ---
  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessStatus('Extracting...');
    setIsProcessing(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const rootDirName = Object.keys(zip.files).find(path => path.endsWith('/') && path.split('/').length === 2);
      const rootPath = rootDirName || "";

      const metaFile = zip.file(rootPath + "metadata.json");
      if (!metaFile) throw new Error("Invalid Archive: metadata.json missing");
      const meta = JSON.parse(await metaFile.async("string"));

      const sources: Source[] = [];
      const manifestFile = zip.file(rootPath + "Sources/manifest.json");
      if (manifestFile) {
        const manifest = JSON.parse(await manifestFile.async("string"));
        for (const item of manifest) {
          const fileData = zip.file(rootPath + "Sources/" + item.filename);
          if (fileData) {
            if (item.isBinary) {
              const base64 = await fileData.async("base64");
              sources.push({ ...item, data: `data:${item.mimeType};base64,${base64}` });
            } else {
              const text = await fileData.async("string");
              sources.push({ ...item, content: text });
            }
          }
        }
      }

      const pages: Page[] = [];
      const pagesFolder = zip.folder(rootPath + "Pages");
      
      if (pagesFolder) {
        const pageEntries: any[] = [];
        pagesFolder.forEach((relativePath, file) => {
           if (file.dir) {
              const parts = relativePath.split('/');
              if(parts.length === 2 && parts[1] === "") pageEntries.push(relativePath);
           }
        });

        for (const pagePath of pageEntries) {
            const transcriptFile = zip.file(rootPath + "Pages/" + pagePath + "LLM Transcription.json");
            if(transcriptFile) {
                const transcript = JSON.parse(await transcriptFile.async("string"));
                const generatedContent: any = {};
                const artifactsFolder = zip.folder(rootPath + "Pages/" + pagePath + "Artifacts");
                if(artifactsFolder) {
                    const artifactFiles = artifactsFolder.filter((path, file) => !file.dir && path.endsWith('.json'));
                    for(const artifact of artifactFiles) {
                        const fileName = artifact.name.split('/').pop()?.replace('.json', '') as string;
                        const content = JSON.parse(await artifact.async("string"));
                        generatedContent[fileName] = content;
                    }
                }
                pages.push({
                    id: transcript.id || Math.random().toString(36).substr(2, 9),
                    name: transcript.name,
                    chatHistory: transcript.chatHistory || [],
                    generatedContent: generatedContent
                });
            }
        }
      }

      const newNotebook: Notebook = {
        id: meta.id || Math.random().toString(36).substr(2, 9),
        name: meta.name || "Imported Notebook",
        sources: sources,
        pages: pages.length > 0 ? pages : [{ id: 'pg-import', name: 'Page 1', chatHistory: [], generatedContent: {} }]
      };

      onImportNotebook(newNotebook);
    } catch (err) {
      console.error("Import Failed", err);
      alert("Failed to import notebook. Invalid structure.");
    }
    setIsProcessing(false);
    setProcessStatus('');
    if(zipInputRef.current) zipInputRef.current.value = '';
  };

  // --- Source Handlers ---
  const handleAddText = () => {
    if (newTitle && newContent) {
      onAddSource({ title: newTitle, content: newContent, type: 'text' });
      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
    }
  };

  const handleAddUrl = async () => {
    if (!newUrl) return;
    setIsAdding(false);
    setProcessStatus('Fetching URL...');
    setIsProcessing(true);
    let title = newUrl;
    try {
      const urlObj = new URL(newUrl);
      title = urlObj.hostname + (urlObj.pathname.length > 1 ? urlObj.pathname : '');
    } catch (e) {}

    try {
      const response = await fetch(newUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      onAddSource({ title: title, content: text, type: 'url' });
    } catch (error) {
      console.warn("CORS/Network error fetching URL, storing as reference:", error);
      onAddSource({ 
        title: title, 
        content: `[URL Reference]: ${newUrl}\n(Note: Content could not be automatically fetched due to browser security policies. The AI will use the URL as context.)`, 
        type: 'url' 
      });
    }
    setNewUrl('');
    setIsProcessing(false);
    setProcessStatus('');
  };

  const handleDeepResearch = async () => {
    if (!researchQuery) return;
    setIsAdding(false);
    setProcessStatus('Deep Researching...');
    setIsProcessing(true);

    try {
      const result = await performDeepResearch(researchQuery, settings);
      onAddSource({ title: result.title, content: result.content, type: 'text' });
    } catch (error: any) {
      console.error("Deep Research Failed", error);
      alert("Deep Research Failed: " + error.message);
    }
    
    setResearchQuery('');
    setIsProcessing(false);
    setProcessStatus('');
  };

  const extractTextFromPPTX = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const zip = await JSZip.loadAsync(arrayBuffer);
    let extractedText = "";
    const slideFiles = Object.keys(zip.files).filter(fileName => 
      fileName.startsWith("ppt/slides/slide") && fileName.endsWith(".xml")
    );
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      return numA - numB;
    });
    for (const fileName of slideFiles) {
      const slideXml = await zip.files[fileName].async("string");
      const slideTextMatch = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
      if (slideTextMatch) {
         const slideText = slideTextMatch.map((t: string) => t.replace(/<[^>]+>/g, '')).join(' ');
         extractedText += `[SLIDE ${fileName.replace(/\D/g, '')}]: ${slideText}\n\n`;
      }
    }
    return extractedText || "No text content found in slides.";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessStatus(`Ingesting ${file.name.split('.').pop()}...`);

    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isData = file.type.includes('json') || file.type.includes('csv') || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.tsv');
    const isCode = file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.py') || file.name.endsWith('.js') || file.name.endsWith('.ts');
    const isPPT = file.name.endsWith('.pptx') || file.type.includes('presentation');

    if (isPPT) {
       const arrayBuffer = await file.arrayBuffer();
       try {
         const text = await extractTextFromPPTX(arrayBuffer);
         onAddSource({
           title: file.name,
           content: text,
           mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
           type: 'ppt'
         });
       } catch (err) {
         console.error("PPT Parse Error", err);
         alert("Failed to parse PPTX file.");
       }
       setIsProcessing(false);
       setProcessStatus('');
       setIsAdding(false);
       return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (isImage || isAudio) {
        onAddSource({ title: file.name, data: result, mimeType: file.type, type: isImage ? 'image' : 'audio' });
      } else {
        let finalType: 'data' | 'code' | 'text' = 'text';
        if (isData) finalType = 'data';
        if (isCode) finalType = 'code';
        onAddSource({ title: file.name, content: result, mimeType: file.type || 'text/plain', type: finalType });
      }
      setIsProcessing(false);
      setProcessStatus('');
      setIsAdding(false);
    };

    if (isImage || isAudio) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  // --- Tree Handlers ---
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNotebooks);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedNotebooks(newExpanded);
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEditing = (id: string, isNotebook: boolean, parentId?: string) => {
    if (isNotebook) onRenameNotebook(id, editName);
    else if (parentId) onRenamePage(parentId, id, editName);
    setEditingId(null);
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, type: 'notebook' | 'page' | 'source', id: string, index: number, parentId?: string) => {
    e.stopPropagation();
    setDraggedItem({ type, id, index, parentId });
    e.dataTransfer.effectAllowed = 'move';
    // Create ghost image if needed
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, type: 'notebook' | 'page' | 'source', index: number, parentId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    if (draggedItem.type === 'notebook' && type === 'notebook') {
      if (draggedItem.index !== index) onReorderNotebooks(draggedItem.index, index);
    } else if (draggedItem.type === 'page' && type === 'page' && draggedItem.parentId === parentId) {
      if (draggedItem.index !== index && parentId) onReorderPages(parentId, draggedItem.index, index);
    } else if (draggedItem.type === 'source' && type === 'source') {
      if (draggedItem.index !== index) onReorderSources(draggedItem.index, index);
    }
    setDraggedItem(null);
  };

  // CSS for slide-out
  const sidebarClass = `
    h-full bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all duration-300 ease-in-out z-50
    ${isSidebarPinned ? 'relative w-80' : 'fixed top-0 left-0 shadow-2xl'}
    ${!isSidebarPinned && !isSidebarOpen ? '-translate-x-full w-80' : 'translate-x-0 w-80'}
  `;

  return (
    <>
      {/* Sidebar Handle / Toggle (when closed or unpinned) */}
      {!isSidebarPinned && !isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 bg-neutral-900 text-neutral-400 p-2 rounded-lg border border-neutral-700 hover:text-white shadow-lg transition-all"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}

      {/* Sidebar Container */}
      <div className={sidebarClass}>
         {/* Sidebar Header */}
         <div className="p-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900">
            <h2 className="text-[10px] font-black text-neutral-400 tracking-[0.3em] uppercase">Antigravity Studio</h2>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => { setIsSidebarPinned(!isSidebarPinned); if(!isSidebarPinned) setIsSidebarOpen(true); }}
                 className={`p-1.5 rounded transition-colors ${isSidebarPinned ? 'text-white bg-neutral-800' : 'text-neutral-500 hover:text-neutral-300'}`}
                 title={isSidebarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
               </button>
               {!isSidebarPinned && (
                 <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-neutral-500 hover:text-white">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               )}
            </div>
         </div>

        {/* --- Explorer Accordion --- */}
        <div className="border-b border-neutral-800 flex-shrink-0">
           <button 
             onClick={() => toggleSection('explorer')}
             className="w-full flex items-center justify-between p-4 text-[10px] font-black text-neutral-100 uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
           >
             <span>Explorer</span>
             <svg className={`w-3 h-3 transition-transform ${openSections.explorer ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </button>
           
           {openSections.explorer && (
             <div className="p-2 space-y-1 max-h-[30vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                {/* Controls */}
                <div className="flex gap-2 px-2 pb-2">
                  <button onClick={() => zipInputRef.current?.click()} className="text-neutral-500 hover:text-white transition-colors" title="Import Notebook (Zip)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </button>
                  <input type="file" ref={zipInputRef} hidden accept=".zip" onChange={handleImportZip} />
                  <button onClick={onCreateNotebook} className="text-neutral-500 hover:text-white transition-colors" title="New Notebook">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>

                {/* Notebook List */}
                {notebooks.map((nb, nbIndex) => (
                   <div 
                      key={nb.id} 
                      className="mb-1"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'notebook', nb.id, nbIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'notebook', nbIndex)}
                   >
                      <div className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${activeNotebookId === nb.id ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'}`}>
                         <button onClick={(e) => { e.stopPropagation(); toggleExpand(nb.id); }} className="text-neutral-500 hover:text-white">
                            <svg className={`w-3 h-3 transition-transform ${expandedNotebooks.has(nb.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                         </button>
                         <div className="flex-1 min-w-0" onClick={() => onSwitchNotebook(nb.id, nb.pages[0].id)}>
                            {editingId === nb.id ? (
                               <input 
                                  type="text" 
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  onBlur={() => saveEditing(nb.id, true)}
                                  onKeyDown={e => e.key === 'Enter' && saveEditing(nb.id, true)}
                                  autoFocus
                                  className="w-full bg-black text-white text-[10px] p-1 rounded border border-neutral-600 outline-none"
                                  onClick={e => e.stopPropagation()}
                               />
                            ) : (
                               <span 
                                  className={`block text-[10px] font-black uppercase tracking-widest truncate ${activeNotebookId === nb.id ? 'text-white' : 'text-neutral-400'}`}
                                  onDoubleClick={() => startEditing(nb.id, nb.name)}
                               >
                                  {nb.name}
                               </span>
                            )}
                         </div>
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleExportNotebook(nb.id); }} className="text-neutral-500 hover:text-white" title="Export">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onCreatePage(nb.id); }} className="text-neutral-500 hover:text-white" title="Add Page">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteNotebook(nb.id); }} className="text-neutral-500 hover:text-red-500" title="Delete">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
                            </button>
                         </div>
                      </div>
                      
                      {/* Nested Pages */}
                      {expandedNotebooks.has(nb.id) && (
                         <div className="ml-4 pl-2 border-l border-neutral-800 mt-1 space-y-0.5">
                            {nb.pages.map((page, pIndex) => (
                               <div 
                                  key={page.id} 
                                  className={`group/page flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${activePageId === page.id && activeNotebookId === nb.id ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30'}`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, 'page', page.id, pIndex, nb.id)}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, 'page', pIndex, nb.id)}
                                  onClick={() => onSwitchNotebook(nb.id, page.id)}
                               >
                                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 group-hover/page:bg-neutral-400"></div>
                                  <div className="flex-1 min-w-0">
                                     {editingId === page.id ? (
                                        <input 
                                           type="text" 
                                           value={editName}
                                           onChange={e => setEditName(e.target.value)}
                                           onBlur={() => saveEditing(page.id, false, nb.id)}
                                           onKeyDown={e => e.key === 'Enter' && saveEditing(page.id, false, nb.id)}
                                           autoFocus
                                           className="w-full bg-black text-white text-[10px] p-0.5 rounded border border-neutral-600 outline-none"
                                           onClick={e => e.stopPropagation()}
                                        />
                                     ) : (
                                        <span 
                                           className="block text-[10px] font-mono truncate"
                                           onDoubleClick={(e) => { e.stopPropagation(); startEditing(page.id, page.name); }}
                                        >
                                           {page.name}
                                        </span>
                                     )}
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); onDeletePage(nb.id, page.id); }} className="opacity-0 group-hover/page:opacity-100 text-neutral-600 hover:text-red-500 p-0.5">
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
                                  </button>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                ))}
             </div>
           )}
        </div>

        {/* --- Context Signals (Sources) Accordion --- */}
        <div className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-neutral-800">
               <button 
                 onClick={() => toggleSection('sources')}
                 className="w-full flex items-center justify-between p-4 text-[10px] font-black text-neutral-100 uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
               >
                 <span>Context Signals</span>
                 <svg className={`w-3 h-3 transition-transform ${openSections.sources ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </button>
               
               {/* Source Controls (Add, Undo, Redo) */}
               {openSections.sources && (
                  <div className="flex items-center justify-between px-4 pb-2">
                     <div className="flex gap-2">
                        <button onClick={onUndo} disabled={!canUndo} className="text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors" title="Undo Source Change">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button onClick={onRedo} disabled={!canRedo} className="text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors" title="Redo Source Change">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                        </button>
                     </div>
                     <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-neutral-800 text-white p-1.5 rounded hover:bg-neutral-700 transition-all"
                        title="Add Signal"
                     >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                     </button>
                  </div>
               )}
            </div>

            {openSections.sources && (
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col min-h-0 animate-in slide-in-from-bottom-2 duration-200">
                {/* Add Source Form */}
                {isAdding && (
                  <div className="mb-6 p-3 bg-neutral-900 border border-neutral-800 rounded">
                    <div className="flex mb-3 bg-neutral-800 rounded p-1">
                      <button onClick={() => setAddMode('text')} className={`flex-1 py-1 text-[7px] font-black uppercase rounded ${addMode === 'text' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}>Text</button>
                      <button onClick={() => setAddMode('file')} className={`flex-1 py-1 text-[7px] font-black uppercase rounded ${addMode === 'file' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}>File</button>
                      <button onClick={() => setAddMode('url')} className={`flex-1 py-1 text-[7px] font-black uppercase rounded ${addMode === 'url' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}>URL</button>
                      <button onClick={() => setAddMode('agent')} className={`flex-1 py-1 text-[7px] font-black uppercase rounded ${addMode === 'agent' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}>Agent</button>
                    </div>

                    {isProcessing && (
                       <div className="mb-3 text-center">
                          <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin mx-auto mb-1"></div>
                          <span className="text-[8px] text-neutral-400 uppercase tracking-widest">{processStatus}</span>
                       </div>
                    )}

                    {!isProcessing && addMode === 'file' && (
                      <>
                        <div className="flex gap-2 mb-3">
                          <button 
                            className="flex-1 bg-neutral-800 text-[8px] font-black uppercase p-2 border border-neutral-700 hover:border-white transition-all text-neutral-400 hover:text-white rounded"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Select File
                          </button>
                          <input 
                            type="file" 
                            hidden 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept="image/*,audio/*,application/pdf,application/json,text/csv,text/plain,text/markdown,.md,.tsv,.js,.py,.html,.css,.pptx,.docx"
                          />
                        </div>
                        <p className="text-[7px] text-neutral-600 font-mono text-center mb-2">SUPPORTS: PPTX, PDF, DOCX, IMG, AUDIO, CODE, CSV, JSON</p>
                      </>
                    )}

                    {!isProcessing && addMode === 'text' && (
                      <>
                        <input
                          type="text"
                          placeholder="TITLE"
                          className="w-full mb-2 p-2 bg-neutral-800 border border-neutral-700 rounded text-[9px] font-mono outline-none text-neutral-200 uppercase"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                          placeholder="DATA"
                          className="w-full mb-2 p-2 bg-neutral-800 border border-neutral-700 rounded h-20 text-[9px] font-mono outline-none text-neutral-400 resize-none"
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={handleAddText} className="flex-1 py-1.5 rounded font-black text-[9px] uppercase tracking-widest btn-primary-orange">Inject</button>
                          <button onClick={() => setIsAdding(false)} className="flex-1 py-1.5 rounded font-black text-[9px] uppercase btn-secondary-orange">Abort</button>
                        </div>
                      </>
                    )}

                    {!isProcessing && addMode === 'url' && (
                      <>
                        <input
                          type="text"
                          placeholder="https://example.com"
                          className="w-full mb-2 p-2 bg-neutral-800 border border-neutral-700 rounded text-[9px] font-mono outline-none text-neutral-200"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={handleAddUrl} className="flex-1 py-1.5 rounded font-black text-[9px] uppercase tracking-widest btn-primary-orange">Fetch</button>
                          <button onClick={() => setIsAdding(false)} className="flex-1 py-1.5 rounded font-black text-[9px] uppercase btn-secondary-orange">Abort</button>
                        </div>
                      </>
                    )}

                    {!isProcessing && addMode === 'agent' && (
                      <>
                        <div className="bg-neutral-800 p-2 mb-2 rounded border border-neutral-700">
                           <p className="text-[8px] text-neutral-400 font-mono mb-2">DEEP RESEARCH AGENT</p>
                           <textarea
                            placeholder="Describe research topic..."
                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-[9px] font-mono outline-none text-neutral-300 resize-none h-20"
                            value={researchQuery}
                            onChange={(e) => setResearchQuery(e.target.value)}
                           />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleDeepResearch} className="flex-1 py-1.5 rounded font-black text-[9px] uppercase tracking-widest btn-primary-orange">Research</button>
                          <button onClick={() => setIsAdding(false)} className="flex-1 py-1.5 rounded font-black text-[9px] uppercase btn-secondary-orange">Abort</button>
                        </div>
                      </>
                    )}
                    
                    {!isProcessing && addMode === 'file' && (
                      <button onClick={() => setIsAdding(false)} className="w-full py-1.5 rounded font-black text-[9px] uppercase btn-secondary-orange">Abort</button>
                    )}
                  </div>
                )}

                <div className="space-y-2 pb-4">
                  {!activeNotebook || activeNotebook.sources.length === 0 ? (
                    <p className="text-neutral-600 text-[8px] font-mono uppercase tracking-widest text-center py-10 italic">No signals</p>
                  ) : (
                    activeNotebook.sources.map((source, index) => (
                      <div 
                        key={source.id} 
                        className="group p-3 bg-neutral-800 border border-neutral-700 hover:border-neutral-600 transition-all relative rounded-lg cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'source', source.id, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'source', index)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                           <div className="text-neutral-600 cursor-grab">
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM16 6a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 11-4 0 2 2 0 014 0zM16 18a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                           </div>
                           <div className={`w-1 h-2 transition-colors ${source.type === 'data' ? 'bg-blue-500' : source.type === 'image' ? 'bg-purple-500' : source.type === 'audio' ? 'bg-red-500' : source.type === 'url' ? 'bg-green-500' : source.type === 'ppt' ? 'bg-orange-500' : 'bg-neutral-600'} group-hover:bg-white`}></div>
                           <h3 className="font-black text-neutral-200 text-[9px] truncate pr-4 uppercase tracking-tight flex-1">{source.title}</h3>
                        </div>
                         <div className="flex gap-2 pl-4">
                            <span className="text-[7px] font-black bg-neutral-900 text-neutral-500 px-1 rounded uppercase">{source.type}</span>
                            <span className="text-[7px] font-black bg-neutral-900 text-neutral-500 px-1 rounded uppercase">
                               {source.content ? (source.content.length / 1024).toFixed(1) + 'KB' : 'BINARY'}
                            </span>
                         </div>
                        <button
                          onClick={() => onRemoveSource(source.id)}
                          className="absolute top-2 right-2 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Hover Preview Tooltip */}
                        <div className="hidden lg:block absolute left-full top-0 ml-4 w-64 bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-2 border-b border-neutral-800 pb-1">{source.title}</h4>
                          {source.type === 'image' && source.data ? (
                             <img src={source.data} className="w-full rounded mb-1" alt="Preview" />
                          ) : source.type === 'audio' ? (
                             <div className="h-16 flex items-center justify-center gap-1">
                                {[...Array(8)].map((_, i) => (
                                   <div key={i} className="w-1 bg-neutral-400 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                             </div>
                          ) : (
                             <pre className="text-[8px] text-neutral-400 font-mono whitespace-pre-wrap break-all max-h-40 overflow-hidden relative leading-tight">
                               {source.content?.substring(0, 300)}
                               {source.content && source.content.length > 300 && <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-neutral-900 to-transparent"></div>}
                             </pre>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
      
      {/* Overlay when open on mobile or unpinned */}
      {!isSidebarPinned && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
