
import { pipeline } from '@xenova/transformers';
import { Voy } from 'voy-search';

// Singleton to hold the embedding pipeline and index
class VectorStore {
  private static instance: VectorStore;
  private embedder: any = null;
  private index: any = null;
  // Resource storage: { id: string, content: string, metadata: any, embeddings: number[] }
  private resources: Array<{ id: string; content: string; metadata: any }> = [];
  private isReady = false;

  private constructor() {}

  public static getInstance(): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  public async init() {
    if (this.isReady) return;
    
    console.log('[VectorStore] Initializing Embedding Model (Xenova/all-MiniLM-L6-v2)...');
    try {
      // Load the embedding pipeline
      // We use a small, efficient model for browser use
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      
      // Initialize Voy index
      this.index = new Voy({
        embeddings: [] // Start empty
      });

      this.isReady = true;
      console.log('[VectorStore] Ready.');
    } catch (err) {
      console.error('[VectorStore] Initialization Failed:', err);
      throw err;
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) await this.init();
    
    // Generate embedding
    // pooling='mean' and normalize=true are standard for semantic search
    const output = await this.embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  public async addDocument(id: string, text: string, metadata: any = {}) {
    if (!this.isReady) await this.init();

    // 1. Chunking (Simple overlap strategy)
    const chunks = this.chunkText(text, 500, 50);
    
    console.log(`[VectorStore] Processing ${chunks.length} chunks for doc: ${id}`);

    // 2. Embed chunks in parallel (with limit if needed, but for now Promise.all is fine for browser chunks)
    const embeddingPromises = chunks.map(async (chunk, i) => {
      const vector = await this.getEmbedding(chunk);
      
      const resourceId = `${id}_chunk_${i}`;
      
      // Store content reference
      this.resources.push({
        id: resourceId,
        content: chunk,
        metadata: { ...metadata, chunkIndex: i }
      });

      return {
        id: resourceId,
        title: metadata.title || 'Untitled',
        url: `/doc/${id}`,
        embeddings: vector
      };
    });

    const newEmbeddings = await Promise.all(embeddingPromises);

    // 3. Add to Index
    if (this.index) {
        this.index.add({ embeddings: newEmbeddings });
    }
    console.log(`[VectorStore] Added ${newEmbeddings.length} vectors.`);
  }

  public async search(query: string, limit: number = 3): Promise<Array<{ content: string; score: number; metadata: any }>> {
    if (!this.isReady) await this.init();
    if (!this.index) return [];

    const queryVector = await this.getEmbedding(query);
    
    // Voy search returns { neighbors: [ { id, title, url } ] }
    const results = this.index.search(queryVector, limit);

    return results.neighbors.map((r: any) => {
      // Find the actual content from our look-up
      const original = this.resources.find(res => res.id === r.id);
      return {
        content: original ? original.content : "[Content Not Found]",
        score: 0, // Voy usually returns distances, but the JS wrapper might hide it in 'neighbors' depending on version
        metadata: original ? original.metadata : {}
      };
    });
  }

  public clear() {
    this.index = new Voy({ embeddings: [] });
    this.resources = [];
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
      if (i > words.length) break;
      const end = Math.min(i + chunkSize, words.length);
      const chunk = words.slice(i, end).join(' ');
      if (chunk.trim().length > 0) {
          chunks.push(chunk);
      }
    }
    
    return chunks;
  }
}

export const vectorStore = VectorStore.getInstance();
