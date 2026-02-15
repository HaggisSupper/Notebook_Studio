
import React, { useState } from 'react';
import { LLMSettings } from '../types';

interface SettingsModalProps {
  settings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<LLMSettings>(settings);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-lg w-full max-w-xl shadow-2xl border border-neutral-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center shrink-0 bg-neutral-900/50">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <h2 className="text-sm font-bold text-neutral-200 tracking-wider uppercase">System Configuration</h2>
           </div>
           <button onClick={onClose} className="text-neutral-500 hover:text-white transition-all p-1 hover:bg-neutral-800 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar bg-neutral-900">
            
            {/* Provider Selection */}
            <div className="space-y-1">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">LLM Provider</label>
                <div className="grid grid-cols-3 gap-2">
                    {['google', 'openrouter', 'local'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setLocalSettings(prev => ({ ...prev, provider: p as any }))}
                            className={`py-2 px-3 rounded border text-[10px] font-bold uppercase tracking-wider transition-all ${localSettings.provider === p ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Model & API Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                   <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Model ID</label>
                   <input 
                      type="text" 
                      value={localSettings.model} 
                      onChange={e => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-[10px] text-neutral-200 font-mono transition-all hover:border-neutral-500 focus:border-orange-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">API Key ({localSettings.provider})</label>
                   <input 
                      type="password" 
                      value={localSettings.apiKey || ''} 
                      onChange={e => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={localSettings.provider === 'google' ? "AIza..." : "sk-..."}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-[10px] text-neutral-200 font-mono transition-all hover:border-neutral-500 focus:border-orange-500 outline-none"
                   />
                </div>
            </div>

            {/* Local / OpenRouter Base URL */}
            {localSettings.provider !== 'google' && (
                <div>
                   <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Base URL</label>
                   <input 
                      type="text" 
                      value={localSettings.baseUrl || ''} 
                      onChange={e => setLocalSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder={localSettings.provider === 'local' ? "http://localhost:11434/v1" : "https://openrouter.ai/api/v1"}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-[10px] text-neutral-200 font-mono transition-all hover:border-neutral-500 focus:border-orange-500 outline-none"
                   />
                </div>
            )}

            {/* Search Config */}
            <div className="p-3 bg-neutral-800/50 rounded border border-neutral-700/50">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                   <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Deep Research</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                        <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Provider</label>
                        <select 
                           value={localSettings.searchConfig.provider}
                           onChange={e => setLocalSettings(prev => ({ ...prev, searchConfig: { ...prev.searchConfig, provider: e.target.value as any } }))}
                           className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-[10px] text-neutral-300 outline-none focus:border-blue-500"
                        >
                            <option value="simulated">Simulated (Demo)</option>
                            <option value="tavily">Tavily API</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1">Key</label>
                        <input 
                           type="password" 
                           value={localSettings.searchConfig.apiKey || ''} 
                           onChange={e => setLocalSettings(prev => ({ ...prev, searchConfig: { ...prev.searchConfig, apiKey: e.target.value } }))}
                           placeholder="tvly-..."
                           className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-[10px] text-neutral-300 outline-none focus:border-blue-500"
                        />
                     </div>
                </div>
            </div>
            
            {/* MCP Servers */}
            <div>
               <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">MCP Servers</label>
               <textarea 
                  value={localSettings.mcpServers?.join('\n') || ''} 
                  onChange={e => setLocalSettings(prev => ({ ...prev, mcpServers: e.target.value.split('\n').filter(line => line.trim().length > 0) }))}
                  placeholder="http://localhost:3000/sse"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 h-16 text-[10px] font-mono text-neutral-300 resize-none outline-none transition-all hover:border-neutral-500 focus:border-orange-500"
               />
            </div>
        
        </div>
        
        <div className="p-4 border-t border-neutral-800 shrink-0 bg-neutral-900">
             <button 
               onClick={() => onSave(localSettings)}
               className="w-full bg-neutral-100 hover:bg-white text-black font-bold py-2 rounded text-[10px] uppercase tracking-widest transition-all border border-transparent focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
             >
               Save Configuration
             </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
