// Mock implementation of voy-search for testing
export class Voy {
  private embeddings: any[] = [];

  constructor(config?: { embeddings?: any[] }) {
    this.embeddings = config?.embeddings || [];
  }

  add({ embeddings }: { embeddings: any[] }) {
    this.embeddings.push(...embeddings);
  }

  search(queryVector: number[], limit: number = 3) {
    // Return mock search results
    return {
      neighbors: this.embeddings.slice(0, limit).map((e, i) => ({
        id: e.id || `result_${i}`,
        title: e.title || 'Mock Result',
        url: e.url || '/mock',
      })),
    };
  }

  clear() {
    this.embeddings = [];
  }
}
