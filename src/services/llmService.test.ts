import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Source, LLMSettings } from '../types';

// Mock vectorStore to avoid voy-search resolution issue
vi.mock('./rag/vectorStore', () => ({
  vectorStore: {
    search: vi.fn().mockResolvedValue([]),
    add: vi.fn(),
  }
}));

// Mock toolService
vi.mock('./toolService', async () => {
  const actual = await vi.importActual<any>('./toolService');
  return {
    ...actual,
    getGeminiTools: vi.fn().mockResolvedValue([{ functionDeclarations: [] }]),
    executeTool: vi.fn().mockResolvedValue("Tool execution result"),
  };
});

// Use vi.hoisted to make the mock function available to the factory
const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn() };
});

// Hoisted mock for GoogleGenAI
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Type: {
    OBJECT: 'object',
    STRING: 'string',
    ARRAY: 'array',
    NUMBER: 'number',
    INTEGER: 'integer',
    BOOLEAN: 'boolean',
  },
}));

// Import services AFTER mocks
import { generateStudioContent, performDeepResearch } from './llmService';
import * as toolService from './toolService';

describe('llmService', () => {
  let mockSettings: LLMSettings;
  let mockSources: Source[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSettings = {
      provider: 'google',
      model: 'gemini-3-pro-preview',
      searchConfig: {
        provider: 'simulated',
      },
      apiKey: 'test-key',
    };

    mockSources = [
      {
        id: '1',
        title: 'Test Document',
        content: 'This is test content',
        type: 'text',
      },
    ];

    // Mock process.env
    process.env.API_KEY = 'mock-key-for-test';
  });

  describe('generateStudioContent', () => {
    it('should generate report content', async () => {
      const mockResponse = {
        text: JSON.stringify({
          title: 'Test Report',
          executiveSummary: 'Summary',
          sections: [],
          conclusion: 'Conclusion',
        }),
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateStudioContent(
        mockSources,
        'report',
        mockSettings
      );

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('executiveSummary');
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        generateStudioContent(mockSources, 'report', mockSettings)
      ).rejects.toThrow();
    });

    it('should include multimodal data in request', async () => {
      const imageSource: Source = {
        id: '2',
        title: 'Test Image',
        type: 'image',
        data: 'data:image/png;base64,abc123',
        mimeType: 'image/png',
      };

      const sourcesWithImage = [...mockSources, imageSource];
      
      const mockResponse = {
         text: JSON.stringify({
           title: 'Test Report',
           executiveSummary: 'Summary',
           sections: [],
           conclusion: 'Conclusion',
         }),
       };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await generateStudioContent(sourcesWithImage, 'report', mockSettings);

      // Verify multimodal data was included
      expect(mockGenerateContent).toHaveBeenCalled();
      const callArgs = mockGenerateContent.mock.calls[0][0];
      // Check if parts include inlineData
      const hasImage = callArgs.contents.parts.some((p: any) => p.inlineData);
      expect(hasImage).toBe(true);
    });
  });

  describe('performDeepResearch', () => {
    it('should call getGeminiTools with settings for Google provider', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{ content: { parts: [{ text: "Research complete" }] } }]
      });

      await performDeepResearch('test query', mockSettings);

      expect(toolService.getGeminiTools).toHaveBeenCalledWith(mockSettings);
    });
  });
});
