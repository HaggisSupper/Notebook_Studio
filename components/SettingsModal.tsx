
import React from 'react';
import { LLMSettings, LLMProvider } from '../types';
import App from '../App';

interface SettingsModalProps {
  settings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  // Ensure searchConfig exists for backward compatibility
  const initialSettings = {
    ...settings,
    searchConfig: settings.searchConfig || { provider: 'simulated', apiKey: '' }
  };
  
  const [localSettings, setLocalSettings] = React.useState(initialSettings);

  return (
    <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
          <h2 id="settings-modal-title" className="text-2xl font-black dark:text-white tracking-tight uppercase">Settings</h2>
          <button 
            onClick={onClose} 
            aria-label="Close settings"
            className="text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* LLM Provider Section */}
          <div className="space-y-4 border-b border-neutral-700 pb-6">
            <h3 className="text-xs font-black text-neutral-300 uppercase">LLM Configuration</h3>
            <div>
              <label className="block text-[0.6rem] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-3">Orchestrator</label>
              <select 
                value={localSettings.provider}
                onChange={(e) => setLocalSettings({...localSettings, provider: e.target.value as LLMProvider})}
                className="w-full bg-neutral-100 dark:bg-neutral-700 border-none rounded-2xl p-4 focus:ring-2 focus:ring-neutral-400 outline-none dark:text-white font-bold"
              >
                <option value="google">Internal (Gemini)</option>
                <option value="openrouter">OpenRouter API</option>
                <option value="local">Local Node (Ollama)</option>
              </select>
            </div>

            <div>
              <label className="block text-[0.6rem] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-3">Model Signature</label>
              <input 
                type="text"
                value={localSettings.model}
                onChange={(e) => setLocalSettings({...localSettings, model: e.target.value})}
                placeholder={localSettings.provider === 'google' ? 'gemini-3-pro-preview' : 'meta-llama/llama-3.1-405b'}
                className="w-full bg-neutral-100 dark:bg-neutral-700 border-none rounded-2xl p-4 focus:ring-2 focus:ring-neutral-400 outline-none dark:text-white font-mono text-sm"
              />
            </div>

            {localSettings.provider === 'openrouter' && (
              <div>
                <label className="block text-[0.6rem] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-3">Access Key</label>
                <input 
                  type="password"
                  value={localSettings.apiKey}
                  onChange={(e) => setLocalSettings({...localSettings, apiKey: e.target.value})}
                  placeholder="sk-or-..."
                  className="w-full bg-neutral-100 dark:bg-neutral-700 border-none rounded-2xl p-4 focus:ring-2 focus:ring-neutral-400 outline-none dark:text-white font-mono text-sm"
                />
              </div>
            )}

            {localSettings.provider === 'local' && (
              <div>
                <label className="block text-[0.6rem] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-3">Endpoint URL</label>
                <input 
                  type="text"
                  value={localSettings.baseUrl}
                  onChange={(e) => setLocalSettings({...localSettings, baseUrl: e.target.value})}
                  placeholder="http://localhost:11434/v1"
                  className="w-full bg-neutral-100 dark:bg-neutral-700 border-none rounded-2xl p-4 focus:ring-2 focus:ring-neutral-400 outline-none dark:text-white font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* Search/Agent Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-neutral-300 uppercase">Agent Tools (MCP / Search)</h3>
            <p className="text-[10px] text-neutral-500 font-mono">
              Configure external tools for the Deep Research Agent. 
              The 'Tavily' provider is recommended for reliable web search tool use across all LLMs.
            </p>
            
            <div>
              <label className="block text-[0.6rem] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-3">Search Provider</label>
              <select 
                value={localSettings.searchConfig.provider}
                onChange={(e) => setLocalSettings({...localSettings, searchConfig: { ...localSettings.searchConfig, provider: e.target.value as any }})}
                className="w-full bg-neutral-100 dark:bg-neutral-700 border-none rounded-2xl p-4 focus:ring-2 focus:ring-neutral-400 outline-none dark:text-white font-bold"
              >
                <option value="simulated">Simulated (Mock Data)</option>
                <option value="tavily">Tavily Search API</option>
              </select>
            </div>

            {localSettings.searchConfig.provider === 'tavily' && (
              <div>
                <label className="block text-[0.6rem] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-3">Search API Key</label>
                <input 
                  type="password"
                  value={localSettings.searchConfig.apiKey || ''}
                  onChange={(e) => setLocalSettings({...localSettings, searchConfig: { ...localSettings.searchConfig, apiKey: e.target.value }})}
                  placeholder="tvly-..."
                  className="w-full bg-neutral-100 dark:bg-neutral-700 border-none rounded-2xl p-4 focus:ring-2 focus:ring-neutral-400 outline-none dark:text-white font-mono text-sm"
                />
              </div>
            )}
          </div>

          <button 
            onClick={() => onSave(localSettings)}
            className="w-full bg-neutral-900 dark:bg-neutral-50 hover:opacity-90 text-neutral-50 dark:text-neutral-950 font-black py-5 rounded-[1.5rem] transition-all shadow-xl uppercase tracking-widest text-sm"
          >
            Apply Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
