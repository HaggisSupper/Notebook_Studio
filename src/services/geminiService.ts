
import { GoogleGenAI, Type } from "@google/genai";
import { Source, ReportData, InfographicData, MindmapNode } from "../types";

export const generateStudioContent = async (
  sources: Source[],
  type: 'report' | 'infographic' | 'mindmap',
  apiKey: string
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey });
  const context = sources.map(s => `SOURCE: ${s.title}\nCONTENT: ${s.content}`).join('\n\n---\n\n');

  const prompts = {
    report: "Create a detailed professional report based on the provided context.",
    infographic: "Summarize the context into key metrics, visualizable data, and bullet points for an infographic.",
    mindmap: "Organize the core concepts of the context into a hierarchical mindmap structure."
  };

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
            properties: {
              heading: { type: Type.STRING },
              body: { type: Type.STRING }
            },
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
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.STRING },
              trend: { type: Type.STRING }
            }
          }
        },
        chartData: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.NUMBER }
            }
          }
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
          items: {
            // Recursive structure - Gemini usually handles shallow nesting well
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING } } } }
            }
          }
        }
      },
      required: ["id", "label"]
    }
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `CONTEXT:\n${context}\n\nTASK: ${prompts[type]}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schemas[type] as any,
      temperature: 0.7,
    },
  });

  return JSON.parse(response.text || '{}');
};
