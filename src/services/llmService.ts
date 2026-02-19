import { GoogleGenAI, Type } from "@google/genai";
import { Source, LLMSettings } from "../types";
import { TOOL_DEFINITIONS, executeTool, getGeminiTools } from "./toolService";
import { fetchToolsFromMcp } from "./mcpClient";
import { vectorStore } from "./rag/vectorStore";
import { STUDIO_PROMPTS, CHAT_INSTRUCTION, ENRICHMENT_PROMPT, DEEP_RESEARCH_SYSTEM_PROMPT } from "./prompts";

// Configurable Local Enrichment Settings
const LOCAL_ENRICHMENT_URL = import.meta.env.VITE_LOCAL_ENRICHMENT_URL || 'http://localhost:1234/v1/chat/completions';
const LOCAL_ENRICHMENT_MODEL = import.meta.env.VITE_LOCAL_ENRICHMENT_MODEL || 'deepseek-r1-distill-qwen-7b';

const callLocalModel = async (prompt: string, context: string): Promise<string> => {
  try {
    const response = await fetch(LOCAL_ENRICHMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LOCAL_ENRICHMENT_MODEL,
        messages: [
          { role: 'system', content: ENRICHMENT_PROMPT },
          { role: 'user', content: `CONTEXT:\n${context}\n\nUSER_REQUEST: ${prompt}` }
        ]
      })
    });

    if (!response.ok) {
       throw new Error(`Local enrichment failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.warn("Local enrichment failed, falling back to original prompt:", err);
    return prompt;
  }
};

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
  
  // --- RAG / Context Retrieval Logic ---
  let textContext = "";

  if (type === 'chat' && chatQuery) {
    // RAG Mode: Retrieve relevant chunks
    console.log(`[RAG] Searching for context relevant to: "${chatQuery}"`);
    try {
       const results = await vectorStore.search(chatQuery, 5); // Top 5 chunks
       if (results.length > 0) {
          textContext = results.map((r, i) => `RELEVANT_EXCERPT_${i+1} (Score: ${r.score.toFixed(2)}):\n${r.content}`).join('\n\n---\n\n');
          console.log(`[RAG] Found ${results.length} relevant chunks.`);
       } else {
          console.log(`[RAG] No relevant chunks found in index. Falling back to simple concatenation (Context Stuffing).`);
          // Fallback to full text if nothing found (or index empty)
          textContext = sources
            .filter(s => ['text', 'url', 'ppt'].includes(s.type))
            .map(s => `SOURCE (${s.type.toUpperCase()}): ${s.title}\nCONTENT: ${s.content}`)
            .join('\n\n---\n\n');
       }
    } catch (e) {
       console.warn("[RAG] Vector Search failed:", e);
       textContext = sources
         .filter(s => ['text', 'url', 'ppt'].includes(s.type))
         .map(s => `SOURCE (${s.type.toUpperCase()}): ${s.title}\nCONTENT: ${s.content}`)
         .join('\n\n---\n\n');
    }
  } else {
    // Generative Mode: Use full context (Context Window permitting)
    textContext = sources
      .filter(s => ['text', 'url', 'ppt'].includes(s.type))
      .map(s => `SOURCE (${s.type.toUpperCase()}): ${s.title}\nCONTENT: ${s.content}`)
      .join('\n\n---\n\n');
  }
  
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

  const promptText = STUDIO_PROMPTS[type]
    ? (typeof STUDIO_PROMPTS[type] === 'function'
        ? (STUDIO_PROMPTS[type] as any)(focusPrefix, complexityPrefix, stylePrefix, !!sqlContext)
        : (STUDIO_PROMPTS[type] as any)(chatQuery))
    : "Summarize provided sources.";

  const chatInstr = CHAT_INSTRUCTION(type === 'chat');

  parts.push({ text: `TASK: ${promptText}${chatInstr}` });

  // --- Hybrid Orchestration: Local Enrichment ---
  let finalPrompt = promptText;
  if (settings.localEnrichment) {
    console.log("[Orchestrator] Running Local Enrichment via LMS...");
    const contextStr = parts.map(p => p.text || "[Multimodal Data]").join('\n\n');
    finalPrompt = await callLocalModel(promptText, contextStr);
    // Replace the last part (the prompt) with the enriched one
    parts[parts.length - 1] = { text: `ENRICHED_TASK: ${finalPrompt}${chatInstr}` };
  }

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
    if (!settings.apiKey) {
      throw new Error("Missing Google API Key. Please configure it in Settings.");
    }
    
    const apiKey = settings.apiKey;
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    
    try {
      const response = await ai.models.generateContent({
        model: settings.model || 'gemini-2.0-flash-exp', // Prefer Flash 2.0
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
      
      const text = typeof response.text === 'function' ? response.text() : response.text; // Safety check if method/property
      
      if (type === 'chat') return text;
      
      try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
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
              { type: 'text', text: promptText + chatInstr + (type !== 'chat' ? " Respond ONLY with a JSON object matching the requested schema." : "") },
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
      const jsonContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonContent);
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
  
  const messages: any[] = [
    { role: 'system', content: DEEP_RESEARCH_SYSTEM_PROMPT },
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
      if (!settings.apiKey) {
        throw new Error("Google API key is not configured for deep research");
      }
      
      const apiKey = settings.apiKey;
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      // Use Flash 2.0 for Agents
      const modelName = settings.model.includes('gemini') ? settings.model : 'gemini-2.0-flash-exp';
      
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

      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [{ text: transcript }] },
          config: {
            tools: await getGeminiTools(settings),
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
           responseMessage = { role: 'assistant', content: null, tool_calls: toolCalls };
        } else {
           responseMessage = { role: 'assistant', content: part?.text || "No response" };
        }
      } catch (geminiError: any) {
        console.error('Gemini error in research loop:', geminiError);
        throw new Error(`Deep research failed: ${geminiError.message || 'Gemini API error'}`);
      }

    } else {
      const baseUrl = settings.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : settings.baseUrl;
      const apiKey = settings.provider === 'openrouter' ? settings.apiKey : (settings.apiKey || 'none');
      
      if (!baseUrl) {
        throw new Error(`Base URL is required for ${settings.provider} provider`);
      }

      const combinedTools = [...tools];
      if (settings.mcpServers) {
        for (const url of settings.mcpServers) {
          try {
             const mcpTools = await fetchToolsFromMcp(url);
             mcpTools.forEach(tool => {
               combinedTools.push({
                 type: 'function',
                 function: {
                   name: tool.name,
                   description: tool.description,
                   parameters: tool.inputSchema
                 }
               });
             });
          } catch (mcpErr) {
             console.warn(`Failed to fetch tools from MCP ${url}`, mcpErr);
          }
        }
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

    messages.push(responseMessage);

    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch(e) {
          console.warn("Failed to parse tool args", toolCall.function.arguments);
          functionArgs = {};
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
    } else {
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
