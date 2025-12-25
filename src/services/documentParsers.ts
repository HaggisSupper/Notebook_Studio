
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';
import JSZip from 'jszip';

// Setup PDF.js worker (lazy initialization)
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (e) {
  console.warn("Failed to set PDF.js worker:", e);
}

/**
 * Extracts text from a PDF file.
 * If the PDF is scanned (no text), it falls back to OCR.
 */
export const parsePDF = async (arrayBuffer: ArrayBuffer, onProgress?: (msg: string) => void): Promise<string> => {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`Parsing PDF page ${i}/${pdf.numPages}...`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    
    if (pageText.trim()) {
      fullText += pageText + '\n\n';
    } else {
      // Fallback to OCR for this page if it's likely an image
      onProgress?.(`OCR needed for page ${i}...`);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport }).promise;
      const imageUrl = canvas.toDataURL('image/png');
      const ocrText = await runOCR(imageUrl);
      fullText += ocrText + '\n\n';
    }
  }

  return fullText.trim() || "No text could be extracted from this PDF.";
};

/**
 * Extracts text from a .docx file using mammoth.
 */
export const parseDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

/**
 * Extracts text from an Excel file (.xlsx, .xls, .csv).
 */
export const parseExcel = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let fullText = '';
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    fullText += `--- Sheet: ${sheetName} ---\n`;
    fullText += XLSX.utils.sheet_to_csv(worksheet) + '\n\n';
  });
  
  return fullText.trim();
};

/**
 * Runs OCR on an image URL or base64 data.
 */
export const runOCR = async (imageSource: string): Promise<string> => {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imageSource);
  await worker.terminate();
  return text;
};

/**
 * Extracts text from a .pptx file using JSZip to parse slide XMLs.
 */
export const extractTextFromPPTX = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const zip = await JSZip.loadAsync(arrayBuffer);
  let extractedText = "";
  const slideFiles = Object.keys(zip.files).filter(fileName => 
    fileName.startsWith("ppt/slides/slide") && fileName.endsWith(".xml")
  );
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''));
    const numB = parseInt(b.replace(/\D/g, ''));
    return numA - numB;
  });
  for (const fileName of slideFiles) {
    const slideXml = await zip.files[fileName].async("string");
    const slideTextMatch = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
    if (slideTextMatch) {
       const slideText = slideTextMatch.map((t: string) => t.replace(/<[^>]+>/g, '')).join(' ');
       extractedText += `[SLIDE ${fileName.replace(/\D/g, '')}]: ${slideText}\n\n`;
    }
  }
  return extractedText || "No text content found in slides.";
};
