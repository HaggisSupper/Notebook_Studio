import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parsePDF, parseDocx, parseExcel, runOCR, extractTextFromPPTX } from './documentParsers';

// Mock the external libraries
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn((pageNum) => Promise.resolve({
        getTextContent: vi.fn(() => Promise.resolve({
          items: [{ str: `Page ${pageNum} text content` }]
        })),
        getViewport: vi.fn(() => ({ height: 100, width: 100 })),
        render: vi.fn(() => ({ promise: Promise.resolve() }))
      }))
    })
  })),
  version: '3.0.0'
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(() => Promise.resolve({ value: 'Extracted Word document text' }))
  }
}));

vi.mock('xlsx', () => ({
  read: vi.fn(() => ({
    SheetNames: ['Sheet1', 'Sheet2'],
    Sheets: {
      Sheet1: { A1: { v: 'Header1' }, B1: { v: 'Header2' } },
      Sheet2: { A1: { v: 'Data' } }
    }
  })),
  utils: {
    sheet_to_csv: vi.fn((sheet) => 'Header1,Header2\nValue1,Value2')
  }
}));

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => Promise.resolve({
    recognize: vi.fn(() => Promise.resolve({ data: { text: 'OCR extracted text' } })),
    terminate: vi.fn(() => Promise.resolve())
  }))
}));

vi.mock('jszip', () => ({
  default: {
    loadAsync: vi.fn(() => Promise.resolve({
      files: {
        'ppt/slides/slide1.xml': {
          async: vi.fn(() => '<a:t>Slide 1 text</a:t>')
        },
        'ppt/slides/slide2.xml': {
          async: vi.fn(() => '<a:t>Slide 2 text</a:t>')
        }
      }
    }))
  }
}));

describe('documentParsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parsePDF', () => {
    it('should extract text from a text-based PDF', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const result = await parsePDF(mockBuffer);
      
      expect(result).toContain('Page 1');
      expect(result).toContain('Page 2');
    });

    it('should call onProgress callback during parsing', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const onProgress = vi.fn();
      
      await parsePDF(mockBuffer, onProgress);
      
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('parseDocx', () => {
    it('should extract text from a Word document', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const result = await parseDocx(mockBuffer);
      
      expect(result).toBe('Extracted Word document text');
    });
  });

  describe('parseExcel', () => {
    it('should extract data from all sheets as CSV', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const result = await parseExcel(mockBuffer);
      
      expect(result).toContain('Sheet1');
      expect(result).toContain('Sheet2');
      expect(result).toContain('Header1,Header2');
    });
  });

  describe('runOCR', () => {
    it('should extract text from an image using Tesseract', async () => {
      const mockImageUrl = 'data:image/png;base64,test';
      const result = await runOCR(mockImageUrl);
      
      expect(result).toBe('OCR extracted text');
    });
  });

  describe('extractTextFromPPTX', () => {
    it('should extract text from PowerPoint slides', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const result = await extractTextFromPPTX(mockBuffer);
      
      expect(result).toContain('Slide 1');
      expect(result).toContain('Slide 2');
    });
  });
});
