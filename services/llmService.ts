
import { GoogleGenAI, Type } from "@google/genai";
import { Source, LLMSettings } from "../types";
import { TOOL_DEFINITIONS, executeTool, getGeminiTools } from "./toolService";

export const generateStudioContent = async (
  sources: Source[],
  type: 'report' | 'infographic' | 'mindmap' | 'flashcards' | 'slides' | 'table' | 'dashboard' | 'chat',
  settings: LLMSettings,
  chatQuery?: string,
  focus?: string,
  sqlContext?: string,
  complexityLevel?: string,
  styleDefinition?: string
): Promise<any> => {
  if (!sources || sources.length === 0) {
    throw new Error("No sources provided for content generation");
  }
  
  const parts: any[] = [];
  
  // Add text and URL context
  const textContext = sources
    .filter(s => ['text', 'url', 'ppt'].includes(s.type))
    .map(s => `SOURCE (${s.type.toUpperCase()}): ${s.title}\nCONTENT: ${s.content}`)
    .join('\n\n---\n\n');
  
  if (textContext) {
    parts.push({ text: `TEXT_AND_URL_CONTEXT:\n${textContext}` });
  }

  // Add structured data context (JSON, CSV, etc.)
  const dataContext = sources
    .filter(s => s.type === 'data')
    .map(s => `DATA_DATASET_SOURCE: ${s.title} (${s.mimeType})\nCONTENT:\n${s.content}`)
    .join('\n\n---\n\n');

  if (dataContext) {
    parts.push({ text: `STRUCTURED_DATA_CONTEXT:\n${dataContext}\n\nNOTE: This context contains raw structured data (CSV/JSON). When answering questions, you MUST query this data, perform calculations, filter rows, or extract specific values as requested by the user.` });
  }

  // Add SQL Schema/Bridge Context
  if (sqlContext) {
     parts.push({ text: `CONNECTED_SQL_DATABASE_SCHEMA_CONTEXT:\n${sqlContext}\n\nNOTE: The user has connected a mock SQL database. Use this schema information to answer queries. If the user asks for data, generate valid SQL queries or simulate the result based on the schema and common sense.` });
  }

  // Add code context
  const codeContext = sources
    .filter(s => s.type === 'code')
    .map(s => `CODE_FILE: ${s.title}\nCONTENT:\n${s.content}`)
    .join('\n\n---\n\n');

  if (codeContext) {
    parts.push({ text: `CODE_CONTEXT:\n${codeContext}` });
  }

  // Add multimodal context
  sources.forEach(s => {
    if ((s.type === 'image' || s.type === 'audio') && s.data && s.mimeType) {
      // Validate data URL format and MIME type
      const dataUrlMatch = s.data.match(/^data:([^;,]+);base64,(.+)$/);
      if (dataUrlMatch) {
        const [, mimeType, base64Data] = dataUrlMatch;
        
        // Validate MIME type for images
        if (s.type === 'image' && !['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'].includes(mimeType.toLowerCase())) {
          console.warn(`Invalid image MIME type: ${mimeType}. Skipping.`);
          return;
        }
        
        // Validate MIME type for audio
        if (s.type === 'audio' && !mimeType.startsWith('audio/')) {
          console.warn(`Invalid audio MIME type: ${mimeType}. Skipping.`);
          return;
        }
        
        // Basic validation of base64 format
        if (!/^[A-Za-z0-9+/]+=*$/.test(base64Data)) {
          console.warn(`Invalid base64 encoding. Skipping.`);
          return;
        }
        
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      } else {
        console.warn('Invalid data URL format. Skipping multimedia source.');
      }
    }
  });

  const focusPrefix = focus ? `FOCUS ON: ${focus}\n` : '';
  const complexityPrefix = complexityLevel ? `COMPLEXITY LEVEL: ${complexityLevel}\n` : '';
  const stylePrefix = styleDefinition ? `STYLE GUIDELINES: ${styleDefinition}\n` : '';

  const prompts = {
    report: `${focusPrefix}${complexityPrefix}${stylePrefix}Create a detailed professional report. If data sources (CSV/JSON) are present, include a 'Data Analysis' section with specific insights derived from the numbers.`,
    infographic: `${focusPrefix}${complexityPrefix}${stylePrefix}Summarize the sources into key metrics and visualizable data. Prioritize extracting numbers from provided Data/CSV/JSON sources.`,
    mindmap: `${focusPrefix}${complexityPrefix}${stylePrefix}Organize core concepts into a hierarchical structure.`,
    flashcards: `${focusPrefix}${complexityPrefix}${stylePrefix}Generate 8 study cards (question/answer).`,
    slides: `${focusPrefix}${complexityPrefix}${stylePrefix}Generate a 6-slide presentation deck layout.`,
    table: `${focusPrefix}${complexityPrefix}${stylePrefix}Extract key structured data into a markdown-compatible table format represented in JSON. If raw CSV data is present, format it cleanly. 
    ${sqlContext ? 'IMPORTANT: For SQL contexts, generate a flat table output that represents the result of a conversation-driven query. Include JOIN operations if multiple tables are relevant, and document any aggregations or calculations performed.' : ''}`,
    dashboard: `${focusPrefix}${complexityPrefix}${stylePrefix}Generate a data-centric dashboard layout. 
    - Identify key trends and distributions in the data.
    - Create 3-4 distinct charts (mix of 'area', 'line', 'bar', 'pie', 'scatter').
    - For time-series, use 'area' or 'line'. For categorical comparisons, use 'bar' or 'pie'. For correlations, use 'scatter'.
    - Ensure 'data' arrays are populated with REAL numeric values from the context.
    - 'metrics' should highlight top-level KPIs.`,
    chat: chatQuery || "Summarize all provided sources (text, data, image, audio). If structured data is present, provide a brief statistical summary."
  };

  // Chat-specific instructions to handle data querying
  const chatInstruction = type === 'chat' 
    ? `\n\nSYSTEM INSTRUCTION: You are a multimodal data analyst and SQL expert. 
       - If the user asks about the structured data (CSV/JSON), perform implied JOINs if multiple datasets share keys. Calculate aggregations (Sum, Avg, Count) as requested.
       - If the user references the SQL Database, write a T-SQL compatible query based on the SCHEMA_CONTEXT provided to answer the question, or explain how the data would be retrieved.
       - Do not simply say "the data is there", actually perform the "mental" analysis on the provided text representation of the data.
       - When performing data transformations, explain: 1) What fields were used, 2) What operations were performed, 3) What new fields were calculated.`
    : "";

  parts.push({ text: `TASK: ${prompts[type]}${chatInstruction}` });

  const schemas = {
    report: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        executiveSummary: { type: Type.STRING },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } },
            required: ["heading", "body"]
          }
        },
        conclusion: { type: Type.STRING }
      },
      required: ["title", "executiveSummary", "sections", "conclusion"]
    },
    infographic: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        stats: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { label: { type: Type.STRING }, value: { type: Type.STRING }, trend: { type: Type.STRING, enum: ['up', 'down', 'neutral'] } }
          }
        },
        chartData: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } }
        },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["title", "summary", "stats", "chartData", "keyPoints"]
    },
    mindmap: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        label: { type: Type.STRING },
        children: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING } } }
        }
      },
      required: ["id", "label"]
    },
    flashcards: {
      type: Type.OBJECT,
      properties: {
        cards: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ["question", "answer"] }
        }
      },
      required: ["cards"]
    },
    slides: {
      type: Type.OBJECT,
      properties: {
        presentationTitle: { type: Type.STRING },
        slides: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, bullets: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "bullets"] }
        }
      },
      required: ["presentationTitle", "slides"]
    },
    table: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        headers: { type: Type.ARRAY, items: { type: Type.STRING } },
        rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
      },
      required: ["title", "headers", "rows"]
    },
    dashboard: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        metrics: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING }, detail: { type: Type.STRING } } }
        },
        charts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              chartType: { type: Type.STRING, enum: ['area', 'line', 'bar', 'scatter', 'pie', 'radar'] },
              xAxisKey: { type: Type.STRING, description: "Key for X axis (e.g. date, category)" },
              dataKeys: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keys for data series" },
              data: { 
                type: Type.ARRAY, 
                items: { type: Type.OBJECT, description: "Array of data points with keys corresponding to xAxisKey and dataKeys" }
              }
            },
            required: ["title", "chartType", "xAxisKey", "dataKeys", "data"]
          }
        }
      },
      required: ["title", "metrics", "charts"]
    }
  };

  if (settings.provider === 'google') {
    if (!process.env.API_KEY) {
      throw new Error("Google API key is not configured. Please set the API_KEY environment variable.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: settings.model || 'gemini-3-pro-preview',
        contents: { parts },
        config: {
          responseMimeType: type === 'chat' ? 'text/plain' : "application/json",
          responseSchema: type === 'chat' ? undefined : (schemas[type] as any),
          temperature: 0.7,
        },
      });
      
      if (!response || !response.text) {
        throw new Error("Empty response from Gemini API");
      }
      
      if (type === 'chat') return response.text;
      
      try {
        return JSON.parse(response.text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', response.text);
        throw new Error("Invalid JSON response from API");
      }
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError);
      throw new Error(`Gemini API error: ${apiError.message || 'Unknown error'}`);
    }
  }

  const baseUrl = settings.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : settings.baseUrl;
  const apiKey = settings.provider === 'openrouter' ? settings.apiKey : (settings.apiKey || 'none');
  
  if (!baseUrl) {
    throw new Error(`Base URL is required for ${settings.provider} provider`);
  }
  
  if (settings.provider === 'openrouter' && !apiKey) {
    throw new Error("OpenRouter API key is required");
  }
  
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'NotebookLM Studio'
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: `You are a professional multimodal analyst.` },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompts[type] + chatInstruction + (type !== 'chat' ? " Respond ONLY with a JSON object matching the requested schema." : "") },
              ...sources.map(s => {
                if (['text', 'data', 'code', 'url'].includes(s.type)) return { type: 'text', text: `SOURCE (${s.type.toUpperCase()}): ${s.title}\n${s.content}` };
                if (s.type === 'image' && s.data) return { type: 'image_url', image_url: { url: s.data } };
                return null;
              }).filter(Boolean)
            ]
          }
        ],
        response_format: type === 'chat' ? undefined : { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'LLM API Error');
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from API');
    }
    
    const content = data.choices[0].message.content;
    
    if (!content) {
      throw new Error('Empty content in API response');
    }
    
    if (type === 'chat') return content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', content);
      throw new Error("Invalid JSON response from API");
    }
  } catch (fetchError: any) {
    console.error('LLM Service error:', fetchError);
    if (fetchError.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to LLM service. Check your connection and API endpoint.');
    }
    throw fetchError;
  }
};

export const performDeepResearch = async (
  query: string,
  settings: LLMSettings
): Promise<{ title: string; content: string }> => {
  if (!query || !query.trim()) {
    throw new Error("Research query cannot be empty");
  }
  
  const MAX_LOOPS = 5;
  const tools = TOOL_DEFINITIONS;
  
  // We maintain a "Canonical History" in OpenAI format because it's the most granular.
  // We adapt this history for Gemini in the loop.
  const messages: any[] = [
    { role: 'system', content: `You are a Deep Research Agent. Your goal is to research the user's query comprehensively using the available tools.
    
    Tools Available:
    - search_web(query): Search the internet.
    - fetch_page_content(url): Read a specific page.

    Protocol:
    1. Break down the query.
    2. Search for information.
    3. Read key pages if necessary.
    4. Synthesize findings into a detailed report with sections and citations.
    5. Be thorough. Do not give up after one search.` },
    { role: 'user', content: `Research Topic: "${query}"` }
  ];

  let currentLoop = 0;

  while (currentLoop < MAX_LOOPS) {
    currentLoop++;
    console.log(`[Agent] Loop ${currentLoop}/${MAX_LOOPS} - Provider: ${settings.provider}`);

    let responseMessage: any = null;
    let toolCalls: any[] = [];

    // --- 1. Provider Adapter ---

    if (settings.provider === 'google') {
      if (!process.env.API_KEY) {
        throw new Error("Google API key is not configured for deep research");
      }
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const modelName = settings.model.includes('gemini') ? settings.model : 'gemini-3-pro-preview';
        
        // Gemini Adapter: Convert standard message history into a clear transcript for context
        // This is often more robust for 'Agentic' loops than trying to perfectly map JSON objects to Content history
        // which can be fragile with mismatched IDs or null contents.
        let transcript = "";
        messages.forEach(m => {
          if (m.role === 'system') transcript += `System Instruction: ${m.content}\n\n`;
          else if (m.role === 'user') transcript += `User: ${m.content}\n\n`;
          else if (m.role === 'assistant') {
            if (m.tool_calls) {
               m.tool_calls.forEach((tc: any) => {
                  transcript += `Assistant (Thinking): I will call ${tc.function.name} with ${tc.function.arguments}\n`;
               });
            } else if (m.content) {
               transcript += `Assistant: ${m.content}\n\n`;
            }
          }
          else if (m.role === 'tool') {
             transcript += `Tool Output (${m.name}): ${m.content}\n\n`;
          }
        });
        
        transcript += `\n\nAssistant (You):`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [{ text: transcript }] },
          config: {
            tools: getGeminiTools(),
            temperature: 0.2 // Lower temp for precise tool use
          }
        });
        
        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.[0];
        
        if (part?.functionCall) {
           toolCalls = [{
              id: 'call_' + Math.random().toString(36).substr(2, 9),
              function: {
                 name: part.functionCall.name,
                 arguments: JSON.stringify(part.functionCall.args)
              }
           }];
           // We construct a synthetic message to keep the canonical history consistent
           responseMessage = { role: 'assistant', content: null, tool_calls: toolCalls };
        } else {
           responseMessage = { role: 'assistant', content: part?.text || "No response" };
        }
      } catch (geminiError: any) {
        console.error('Gemini error in research loop:', geminiError);
        throw new Error(`Deep research failed: ${geminiError.message || 'Gemini API error'}`);
      }

    } else {
      // OpenRouter / Local Adapter (Standard)
      const baseUrl = settings.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : settings.baseUrl;
      const apiKey = settings.provider === 'openrouter' ? settings.apiKey : (settings.apiKey || 'none');
      
      if (!baseUrl) {
        throw new Error(`Base URL is required for ${settings.provider} provider`);
      }
      
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'NotebookLM Studio'
          },
          body: JSON.stringify({
            model: settings.model,
            messages: messages,
            tools: tools,
            tool_choice: "auto"
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        if(data.error) throw new Error(data.error.message || 'API error');
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response structure from API');
        }
        
        responseMessage = data.choices[0].message;
        toolCalls = responseMessage.tool_calls || [];
      } catch (fetchError: any) {
        console.error('Research API error:', fetchError);
        throw new Error(`Deep research failed: ${fetchError.message || 'API connection error'}`);
      }
    }

    // --- 2. Update History ---
    messages.push(responseMessage);

    // --- 3. Tool Execution & Loop Control ---
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch(e) {
          console.warn("Failed to parse tool args", toolCall.function.arguments);
          functionArgs = {}; // Use empty object as fallback
        }
        
        let result: string;
        try {
          result = await executeTool(functionName, functionArgs, settings);
        } catch (toolError: any) {
          console.error(`Tool execution error for ${functionName}:`, toolError);
          result = `Error executing tool: ${toolError.message || 'Unknown error'}`;
        }
        
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: result
        });
      }
      // Loop continues naturally to let LLM analyze tool output
    } else {
      // No tools called -> Final Answer
      const finalContent = responseMessage.content || "Research completed.";
      return {
        title: `Research: ${query}`,
        content: finalContent
      };
    }
  }

  return {
    title: `Research (Timeout): ${query}`,
    content: messages.filter(m => m.role === 'assistant' && m.content).pop()?.content || "Research loop ended without final conclusion."
  };
};
