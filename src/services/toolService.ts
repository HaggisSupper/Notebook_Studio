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

// --- Tool Implementation ---

const executeSearch = async (query: string, apiKey?: string): Promise<string> => {
  if (!apiKey) {
    // Simulated Fallback
    console.warn("No Search API Key provided. Using simulated results.");
    return JSON.stringify({
      results: [
        { title: `Simulated Result for ${query}`, url: "https://example.com/simulated", content: `This is a simulated search result for the query: ${query}. In a real environment with a Tavily API key, this would contain real web data.` },
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
    const data = await response.json();
    return JSON.stringify(data);
  } catch (error: any) {
    return JSON.stringify({ error: "Search failed", details: error.message });
  }
};

const executeFetchPage = async (url: string): Promise<string> => {
  // Client-side fetch often fails due to CORS. 
  // We recommend using a proxy or a service like Tavily 'extract' if available.
  // For this demo, we simulate a fetch or try a direct fetch.
  try {
    const response = await fetch(url);
    const text = await response.text();
    // basic HTML strip
    return text.replace(/<[^>]*>?/gm, '').substring(0, 2000) + "... (truncated)";
  } catch (e) {
    return `Failed to fetch page content directly due to browser CORS restrictions. Please rely on the search snippets provided in the 'search_web' tool output.`;
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

  // Fallback to MCP tools
  if (settings.mcpServers && settings.mcpServers.length > 0) {
    for (const url of settings.mcpServers) {
      // Check if this tool belongs to this server (simple check by listing again or we could cache)
      const tools = await fetchToolsFromMcp(url);
      if (tools.find(t => t.name === name)) {
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
      const mcpTools = await fetchToolsFromMcp(url);
      mcpTools.forEach(tool => {
        declarations.push({
          name: tool.name,
          description: tool.description,
          parameters: mapSchema(tool.inputSchema)
        });
      });
    }
  }

  return [
    {
      functionDeclarations: declarations
    }
  ];
};
