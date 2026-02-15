import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTool, getGeminiTools, TOOL_DEFINITIONS } from './toolService';
import { LLMSettings } from '../types';

// Mock the mcpClient
vi.mock('./mcpClient', () => ({
  fetchToolsFromMcp: vi.fn(() => Promise.resolve([
    { name: 'mcp_tool', description: 'MCP test tool', inputSchema: { type: 'object' } }
  ])),
  callMcpTool: vi.fn(() => Promise.resolve('MCP tool result'))
}));

// Mock fetch for search/page operations
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('toolService', () => {
  const baseSettings: LLMSettings = {
    provider: 'google',
    model: 'gemini-pro',
    searchConfig: { provider: 'simulated' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TOOL_DEFINITIONS', () => {
    it('should have search_web tool defined', () => {
      const searchTool = TOOL_DEFINITIONS.find(t => t.function.name === 'search_web');
      expect(searchTool).toBeDefined();
      expect(searchTool?.function.parameters.properties.query).toBeDefined();
    });

    it('should have fetch_page_content tool defined', () => {
      const fetchTool = TOOL_DEFINITIONS.find(t => t.function.name === 'fetch_page_content');
      expect(fetchTool).toBeDefined();
      expect(fetchTool?.function.parameters.properties.url).toBeDefined();
    });
  });

  describe('executeTool', () => {
    it('should execute search_web with simulated results', async () => {
      const result = await executeTool('search_web', { query: 'test' }, baseSettings);
      
      expect(result).toContain('[SIMULATED]');
    });

    it('should execute search_web with Tavily API when key provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [{ title: 'Real result' }] })
      });

      const settingsWithKey = {
        ...baseSettings,
        searchConfig: { provider: 'tavily' as const, apiKey: 'mock-key-for-test' }
      };
      
      const result = await executeTool('search_web', { query: 'test' }, settingsWithKey);
      
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should execute fetch_page_content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>Page content</body></html>')
      });

      const result = await executeTool('fetch_page_content', { url: 'https://example.com' }, baseSettings);
      
      expect(result).toContain('Page content');
    });

    it('should fall back to MCP tools for unknown tools', async () => {
      const settingsWithMcp = {
        ...baseSettings,
        mcpServers: ['https://mcp.example.com']
      };

      const result = await executeTool('mcp_tool', { arg: 'value' }, settingsWithMcp);
      
      expect(result).toBe('MCP tool result');
    });

    it('should return error for unknown tools without MCP', async () => {
      const result = await executeTool('unknown_tool', {}, baseSettings);
      
      expect(result).toContain('Error');
    });
  });

  describe('getGeminiTools', () => {
    it('should return static tool declarations', async () => {
      const tools = await getGeminiTools(baseSettings);
      
      expect(tools).toHaveLength(1);
      expect(tools[0].functionDeclarations.length).toBeGreaterThanOrEqual(2);
    });

    it('should include MCP tools when servers configured', async () => {
      const settingsWithMcp = {
        ...baseSettings,
        mcpServers: ['https://mcp.example.com']
      };

      const tools = await getGeminiTools(settingsWithMcp);
      
      // Should have static tools + MCP tools
      const declarationBlock = tools[0].functionDeclarations;
      const mcpTool = declarationBlock.find(t => t.name === 'mcp_tool');
      expect(mcpTool).toBeDefined();
    });
  });
});
