
import React, { useState } from 'react';
import { LLMSettings } from '../types';

interface SettingsModalProps {
  settings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
  onClose: () => void;
}

/**
 * Masks an API key to show only the last 4 characters
 * Example: "sk-1234567890abcdef" -> "sk-...cdef"
 */
const maskApiKey = (key: string | undefined): string => {
  if (!key || key.length < 8) return '';
  const prefix = key.substring(0, Math.min(3, key.indexOf('-') + 1));
  const suffix = key.substring(key.length - 4);
  return `${prefix}...${suffix}`;
};

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<LLMSettings>(settings);

  return (
    <div className="fixed inset-0 bg-neutral-700/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-600 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-neutral-500 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-neutral-500 flex justify-between items-center shrink-0">
           <h2 className="text-xl font-black text-white tracking-tight uppercase">System Configuration</h2>
           <button onClick={onClose} className="text-neutral-400 hover:text-white transition-all border-2 border-transparent hover:border-orange-500 rounded p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            
            {/* Provider Selection */}
            <div className="space-y-2">
                <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em]">LLM Provider</label>
                <div className="grid grid-cols-3 gap-2">
                    {['google', 'openrouter', 'local'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setLocalSettings(prev => ({ ...prev, provider: p as any }))}
                            className={`p-3 rounded-lg border-2 text-xs font-bold uppercase tracking-wider transition-all ${localSettings.provider === p ? 'bg-orange-600 border-orange-500 text-white' : 'bg-neutral-700 border-neutral-600 text-neutral-400 hover:border-neutral-400'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Model & API Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Model ID</label>
                   <input 
                      type="text" 
                      value={localSettings.model} 
                      onChange={e => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-3 text-xs text-white transition-all hover:border-orange-500 focus:border-orange-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">API Key ({localSettings.provider})</label>
                   <input 
                      type="password" 
                      value={localSettings.apiKey || ''} 
                      onChange={e => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={localSettings.provider === 'google' ? "AIza..." : "sk-..."}
                      className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-3 text-xs text-white transition-all hover:border-orange-500 focus:border-orange-500 outline-none"
                   />
                   {localSettings.apiKey && (
                     <p className="text-[9px] text-neutral-500 mt-1">
                       Current: {maskApiKey(localSettings.apiKey)}
                     </p>
                   )}
                </div>
            </div>

            {/* Local / OpenRouter Base URL */}
            {localSettings.provider !== 'google' && (
                <div>
                   <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Base URL</label>
                   <input 
                      type="text" 
                      value={localSettings.baseUrl || ''} 
                      onChange={e => setLocalSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder={localSettings.provider === 'local' ? "http://localhost:11434/v1" : "https://openrouter.ai/api/v1"}
                      className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-3 text-xs text-white transition-all hover:border-orange-500 focus:border-orange-500 outline-none"
                   />
                </div>
            )}

            {/* Search Config */}
            <div className="p-4 bg-neutral-700/50 rounded-xl border border-neutral-600">
                <h3 className="text-xs font-black text-neutral-300 uppercase tracking-wider mb-4">Deep Research Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Search Provider</label>
                        <select 
                           value={localSettings.searchConfig.provider}
                           onChange={e => setLocalSettings(prev => ({ ...prev, searchConfig: { ...prev.searchConfig, provider: e.target.value as any } }))}
                           className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-lg p-2 text-xs text-white outline-none"
                        >
                            <option value="simulated">Simulated (Demo)</option>
                            <option value="tavily">Tavily API</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Search API Key</label>
                        <input 
                           type="password" 
                           value={localSettings.searchConfig.apiKey || ''} 
                           onChange={e => setLocalSettings(prev => ({ ...prev, searchConfig: { ...prev.searchConfig, apiKey: e.target.value } }))}
                           placeholder="tvly-..."
                           className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-lg p-2 text-xs text-white outline-none"
                        />
                        {localSettings.searchConfig.apiKey && (
                          <p className="text-[9px] text-neutral-500 mt-1">
                            Current: {maskApiKey(localSettings.searchConfig.apiKey)}
                          </p>
                        )}
                     </div>
                </div>
            </div>
            
            {/* MCP Servers */}
            <div>
               <label className="block text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">MCP Servers (One URL per line)</label>
               <textarea 
                  value={localSettings.mcpServers?.join('\n') || ''} 
                  onChange={e => setLocalSettings(prev => ({ ...prev, mcpServers: e.target.value.split('\n').filter(line => line.trim().length > 0) }))}
                  placeholder="http://localhost:3000/sse"
                  className="w-full bg-neutral-700 border-2 border-neutral-500 rounded-xl p-4 h-24 text-[10px] font-mono text-neutral-200 resize-none outline-none transition-all hover:border-orange-500 focus:border-orange-500"
               />
               <p className="text-[9px] text-neutral-500 mt-1">* Requires standard MCP SSE endpoints.</p>
            </div>
        
        </div>
        
        <div className="p-8 border-t border-neutral-500 shrink-0">
             <button 
               onClick={() => onSave(localSettings)}
               className="w-full bg-white hover:bg-neutral-200 text-black font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs border-2 border-transparent focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.5)]"
             >
               Save System Configuration
             </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
