import { LLMSettings } from "../types";
import { Type, Schema, FunctionDeclaration } from "@google/genai";
import { fetchToolsFromMcp, callMcpTool, McpTool } from "./mcpClient";

// --- Tool Definitions (OpenAI Format) ---
export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for current information, news, or specific data points.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to execute.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_page_content",
      description: "Retrieve the text content of a specific URL found in search results.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to visit.",
          },
        },
        required: ["url"],
      },
    },
  }
];

// --- Simple Cache for MCP Tools ---
const mcpToolCache: Record<string, McpTool[]> = {};

// --- Tool Implementation ---

const executeSearch = async (query: string, apiKey?: string): Promise<string> => {
  if (!apiKey) {
    // Simulated Fallback
    console.warn("No Search API Key provided. Using simulated results.");
    return JSON.stringify({
      results: [
        { title: `[SIMULATED] Search Result for ${query}`, url: "https://example.com/simulated", content: `(NOTE: This is a simulated search result because no Tavily API key was provided. Please configure a search provider in settings.) Simulated content for query: ${query}.` },
        { title: "Deep Research Methodologies", url: "https://research.org/methods", content: "Deep research involves iterative search steps, synthesis of multiple sources, and cross-verification of facts." }
      ]
    });
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5
      }),
    });

    if (!response.ok) {
        throw new Error(`Search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.stringify(data);
  } catch (error: any) {
    return JSON.stringify({ error: "Search failed", details: error.message });
  }
};

const executeFetchPage = async (url: string): Promise<string> => {
  // Client-side fetch often fails due to CORS. 
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }
    const text = await response.text();
    // basic HTML strip
    return text.replace(/<[^>]*>?/gm, '').substring(0, 3000) + "... (truncated)";
  } catch (e: any) {
    const isCors = e.message && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'));
    if (isCors) {
        return `Error: Unable to fetch page content directly due to browser CORS restrictions (Cross-Origin Resource Sharing).
        The server at ${url} does not allow this application to read its content.
        Please rely on the snippets provided in the search results or use a CORS-enabled proxy if configured.`;
    }
    return `Error fetching page: ${e.message}`;
  }
};

// --- Execution Router ---

export const executeTool = async (name: string, args: any, settings: LLMSettings): Promise<string> => {
  console.log(`[ToolService] Executing ${name}`, args);
  
  if (name === 'search_web') {
    return await executeSearch(args.query, settings.searchConfig.apiKey);
  }
  
  if (name === 'fetch_page_content') {
    return await executeFetchPage(args.url);
  }

  // Fallback to MCP tools with Caching
  if (settings.mcpServers && settings.mcpServers.length > 0) {
    for (const url of settings.mcpServers) {
      // Check cache first
      let tools = mcpToolCache[url];
      if (!tools) {
          try {
              tools = await fetchToolsFromMcp(url);
              mcpToolCache[url] = tools;
          } catch (err) {
              console.warn(`Failed to fetch tools from MCP ${url}`, err);
              continue;
          }
      }

      if (tools && tools.find(t => t.name === name)) {
        return await callMcpTool(url, name, args);
      }
    }
  }

  return "Error: Tool not found.";
};

// --- Helper for Google GenAI Tool Format ---

// Helper to map string types to Google GenAI Type enum
const mapType = (typeStr: string): Type => {
  if (!typeStr) return Type.STRING;
  switch (typeStr.toLowerCase()) {
    case 'string': return Type.STRING;
    case 'number': return Type.NUMBER;
    case 'integer': return Type.INTEGER;
    case 'boolean': return Type.BOOLEAN;
    case 'array': return Type.ARRAY;
    case 'object': return Type.OBJECT;
    default: return Type.STRING;
  }
};

// Recursive function to map OpenAI JSON schema to Gemini Schema
const mapSchema = (schema: any): Schema => {
  const mapped: Schema = {
    type: mapType(schema.type),
    description: schema.description,
  };
  
  if (schema.properties) {
    mapped.properties = {};
    for (const key in schema.properties) {
      mapped.properties[key] = mapSchema(schema.properties[key]);
    }
  }
  
  if (schema.required) {
    mapped.required = schema.required;
  }
  
  // Handle Array items
  if (schema.type === 'array' && schema.items) {
      mapped.items = mapSchema(schema.items);
  }

  return mapped;
};

// Converts OpenAI format to Gemini FunctionDeclarations
export const getGeminiTools = async (settings: LLMSettings): Promise<{ functionDeclarations: FunctionDeclaration[] }[]> => {
  const declarations: FunctionDeclaration[] = TOOL_DEFINITIONS.map(def => ({
    name: def.function.name,
    description: def.function.description,
    parameters: mapSchema(def.function.parameters)
  }));

  // Add MCP Tools
  if (settings.mcpServers) {
    for (const url of settings.mcpServers) {
      try {
          // Use cache if available, but for discovery we might want to refresh?
          // Let's use cache for consistency with executeTool
          let mcpTools = mcpToolCache[url];
          if (!mcpTools) {
             mcpTools = await fetchToolsFromMcp(url);
             mcpToolCache[url] = mcpTools;
          }

          mcpTools.forEach(tool => {
            declarations.push({
              name: tool.name,
              description: tool.description,
              parameters: mapSchema(tool.inputSchema)
            });
          });
      } catch (err) {
          console.warn(`Failed to load MCP tools from ${url} during discovery`, err);
      }
    }
  }

  return [
    {
      functionDeclarations: declarations
    }
  ];
};
