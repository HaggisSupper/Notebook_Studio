import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as documentParsers from './documentParsers';

// Mock Worker for PDF.js and Tesseract
global.Worker = class {
  constructor() {}
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
} as any;

// Mock the external libraries
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '', workerPort: null },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn((pageNum) => Promise.resolve({
        getTextContent: vi.fn(() => Promise.resolve({
          items: [{ str: `Page ${pageNum} text content which is definitely longer than twenty characters now to avoid OCR fallback.` }]
        })),
        getViewport: vi.fn(() => ({ height: 100, width: 100 })),
        render: vi.fn(() => ({ promise: Promise.resolve() }))
      }))
    })
  })),
  version: '3.0.0'
}));

// Mock the worker import
vi.mock('pdfjs-dist/build/pdf.worker?worker', () => ({
  default: class MockWorker {}
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
  })),
  Worker: class {}
}));

vi.mock('jszip', () => ({
  default: {
    loadAsync: vi.fn(() => Promise.resolve({
      files: {
        'ppt/slides/slide1.xml': {
          async: vi.fn(() => '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide 1 text</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>')
        },
        'ppt/slides/slide2.xml': {
          async: vi.fn(() => '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide 2 text</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>')
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
      const result = await documentParsers.parsePDF(mockBuffer);
      
      expect(result).toContain('Page 1');
      expect(result).toContain('Page 2');
    });

    it('should call onProgress callback during parsing', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const onProgress = vi.fn();
      
      await documentParsers.parsePDF(mockBuffer, onProgress);
      
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('parseDocx', () => {
    it('should extract text from a Word document', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const result = await documentParsers.parseDocx(mockBuffer);
      
      expect(result).toBe('Extracted Word document text');
    });
  });

  describe('parseExcel', () => {
    it('should extract data from all sheets as CSV', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const result = await documentParsers.parseExcel(mockBuffer);
      
      expect(result).toContain('Sheet1');
      expect(result).toContain('Sheet2');
      expect(result).toContain('Header1,Header2');
    });
  });

  describe('runOCR', () => {
    it('should extract text from an image using Tesseract', async () => {
      const mockImageUrl = 'data:image/png;base64,test';
      const result = await documentParsers.runOCR(mockImageUrl);
      
      expect(result).toBe('OCR extracted text');
    });
  });

  describe('extractTextFromPPTX', () => {
    it('should extract text from PowerPoint slides', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const result = await documentParsers.extractTextFromPPTX(mockBuffer);
      
      expect(result).toContain('Slide 1');
      expect(result).toContain('Slide 2');
    });
  });
});
