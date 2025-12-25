
export interface Source {
  id: string;
  title: string;
  content?: string;
  data?: string; // base64 encoded data for multimodal
  mimeType?: string;
  type: 'text' | 'image' | 'audio' | 'data' | 'code' | 'url' | 'ppt';
}

export interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
}

export interface InfographicData {
  title: string;
  summary: string;
  stats: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  chartData: { name: string; value: number }[];
  keyPoints: string[];
}

export interface ReportData {
  title: string;
  executiveSummary: string;
  sections: { heading: string; body: string }[];
  conclusion: string;
}

export interface FlashCardData {
  cards: { question: string; answer: string }[];
}

export interface SlideDeckData {
  presentationTitle: string;
  slides: { title: string; bullets: string[] }[];
}

export interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
}

export type ChartType = 'area' | 'line' | 'bar' | 'scatter' | 'pie' | 'radar';

export interface DashboardChart {
  title: string;
  chartType: ChartType;
  data: Record<string, any>[];
  xAxisKey: string;
  dataKeys: string[]; // Keys representing the data series
}

export interface DashboardData {
  title: string;
  metrics: { label: string; value: string; detail: string }[];
  charts: DashboardChart[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string; // For tool responses
}

export interface Page {
  id: string;
  name: string;
  generatedContent: {
    report?: ReportData;
    infographic?: InfographicData;
    mindmap?: MindmapNode;
    flashcards?: FlashCardData;
    slides?: SlideDeckData;
    table?: TableData;
    dashboard?: DashboardData;
  };
  chatHistory: ChatMessage[];
  complexityLevel?: string;
  styleDefinition?: string;
}

export interface Notebook {
  id: string;
  name: string;
  sources: Source[];
  pages: Page[];
}

export type StudioView = 'report' | 'infographic' | 'mindmap' | 'flashcards' | 'slides' | 'table' | 'dashboard' | 'chat' | 'canvas';

export type LLMProvider = 'google' | 'openrouter' | 'local';

export interface SearchConfig {
  provider: 'tavily' | 'simulated';
  apiKey?: string;
}

export interface LLMSettings {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  searchConfig: SearchConfig;
}

export interface SQLConfig {
  server?: string;
  database?: string;
  active: boolean;
  schemaContext: string; // We store the schema/tables description here
  transformLog?: Array<{
    timestamp: string;
    operation: string;
    description: string;
    inputFields?: string[];
    outputFields?: string[];
    calculation?: string;
  }>;
}

export interface StudioState {
  notebooks: Notebook[];
  activeNotebookId: string;
  activePageId: string;
  activeView: StudioView;
  isLoading: boolean;
  error?: string;
  settings: LLMSettings;
  isDarkMode: boolean;
  sqlConfig: SQLConfig;
}
