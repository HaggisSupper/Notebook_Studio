
import { GoogleGenAI, Type } from "@google/genai";
import { Source, LLMSettings } from "../types";
import { TOOL_DEFINITIONS, executeTool, getGeminiTools } from "./toolService";

export const generateStudioContent = async (
  sources: Source[],
  type: 'report' | 'infographic' | 'mindmap' | 'flashcards' | 'slides' | 'table' | 'dashboard' | 'chat',
  settings: LLMSettings,
  chatQuery?: string,
  focus?: string,
  sqlContext?: string
): Promise<any> => {
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
      parts.push({
        inlineData: {
          data: s.data.split(',')[1] || s.data, // Remove data: prefix if present
          mimeType: s.mimeType
        }
      });
    }
  });

  const focusPrefix = focus ? `FOCUS ON: ${focus}\n` : '';

  const prompts = {
    report: `${focusPrefix}Create a detailed professional report. If data sources (CSV/JSON) are present, include a 'Data Analysis' section with specific insights derived from the numbers.`,
    infographic: `${focusPrefix}Summarize the sources into key metrics and visualizable data. Prioritize extracting numbers from provided Data/CSV/JSON sources.`,
    mindmap: `${focusPrefix}Organize core concepts into a hierarchical structure.`,
    flashcards: `${focusPrefix}Generate 8 study cards (question/answer).`,
    slides: `${focusPrefix}Generate a 6-slide presentation deck layout.`,
    table: `${focusPrefix}Extract key structured data into a markdown-compatible table format represented in JSON. If raw CSV data is present, format it cleanly.`,
    dashboard: `${focusPrefix}Generate a data-centric dashboard layout. 
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
       - Do not simply say "the data is there", actually perform the "mental" analysis on the provided text representation of the data.`
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: settings.model || 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: type === 'chat' ? 'text/plain' : "application/json",
        responseSchema: type === 'chat' ? undefined : (schemas[type] as any),
        temperature: 0.7,
      },
    });
    if (type === 'chat') return response.text;
    return JSON.parse(response.text || '{}');
  }

  const baseUrl = settings.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : settings.baseUrl;
  const apiKey = settings.provider === 'openrouter' ? settings.apiKey : (settings.apiKey || 'none');
  
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
              if (s.type === 'image') return { type: 'image_url', image_url: { url: s.data } };
              return null;
            }).filter(Boolean)
          ]
        }
      ],
      response_format: type === 'chat' ? undefined : { type: 'json_object' }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'LLM API Error');
  const content = data.choices[0].message.content;
  if (type === 'chat') return content;
  return JSON.parse(content);
};

export const performDeepResearch = async (
  query: string,
  settings: LLMSettings
): Promise<{ title: string; content: string }> => {
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

    } else {
      // OpenRouter / Local Adapter (Standard)
      const baseUrl = settings.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : settings.baseUrl;
      const apiKey = settings.provider === 'openrouter' ? settings.apiKey : (settings.apiKey || 'none');
      
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
      
      const data = await response.json();
      if(data.error) throw new Error(data.error.message);
      
      responseMessage = data.choices[0].message;
      toolCalls = responseMessage.tool_calls || [];
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
        }
        
        const result = await executeTool(functionName, functionArgs, settings);
        
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
      return {
        title: `Research: ${query}`,
        content: responseMessage.content || "Research completed."
      };
    }
  }

  return {
    title: `Research (Timeout): ${query}`,
    content: messages.filter(m => m.role === 'assistant' && m.content).pop()?.content || "Research loop ended without final conclusion."
  };
};
