import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchToolsFromMcp, callMcpTool } from './mcpClient';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('mcpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchToolsFromMcp', () => {
    it('should fetch tools from an MCP server', async () => {
      const mockTools = [
        { name: 'test_tool', description: 'A test tool', inputSchema: { type: 'object' } }
      ];
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ result: { tools: mockTools } })
      });

      const tools = await fetchToolsFromMcp('https://mcp.example.com');
      
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_tool');
    });

    it('should return empty array on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const tools = await fetchToolsFromMcp('https://mcp.example.com');
      
      expect(tools).toEqual([]);
    });

    it('should handle missing tools in response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ result: {} })
      });

      const tools = await fetchToolsFromMcp('https://mcp.example.com');
      
      expect(tools).toEqual([]);
    });
  });

  describe('callMcpTool', () => {
    it('should call an MCP tool and return content', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          result: { content: [{ text: 'Tool result' }] }
        })
      });

      const result = await callMcpTool('https://mcp.example.com', 'test_tool', { arg: 'value' });
      
      expect(result).toBe('Tool result');
    });

    it('should handle tool errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          error: { message: 'Tool execution failed' }
        })
      });

      const result = await callMcpTool('https://mcp.example.com', 'failing_tool', {});
      
      expect(result).toContain('MCP Tool Error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await callMcpTool('https://mcp.example.com', 'test_tool', {});
      
      expect(result).toContain('MCP Tool Error');
    });
  });
});
