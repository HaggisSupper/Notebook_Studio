
/**
 * MCP Client for SSE/HTTP JSON-RPC communication.
 * This client handles tool listing and execution from remote MCP servers.
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export const fetchToolsFromMcp = async (url: string): Promise<McpTool[]> => {
  try {
    // Note: Usually MCP over SSE involves an initial GET to establish the connection, 
    // but many servers also support a simple HTTP/JSON-RPC POST for tool listing.
    // For this implementation, we assume the server provides a standard JSON-RPC endpoint at /tools/list
    const response = await fetch(`${url}/tools/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 1
      })
    });
    const data = await response.json();
    return data.result?.tools || [];
  } catch (err) {
    console.warn(`Failed to fetch tools from MCP server at ${url}:`, err);
    return [];
  }
};

export const callMcpTool = async (url: string, toolName: string, args: any): Promise<string> => {
  try {
    const response = await fetch(`${url}/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        },
        id: Date.now()
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const content = data.result?.content || [];
    return content.map((c: any) => c.text).join('\n');
  } catch (err: any) {
    return `MCP Tool Error (${toolName}): ${err.message}`;
  }
};
