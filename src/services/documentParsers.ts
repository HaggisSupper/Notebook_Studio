
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker?worker';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { createWorker, Worker } from 'tesseract.js';
import JSZip from 'jszip';

// Setup PDF.js worker using Vite worker import for offline support
try {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerPort) {
      pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();
  }
} catch (e) {
  console.warn("Failed to set local PDF.js worker, falling back to CDN:", e);
  try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  } catch (cdnError) {
      console.error("Failed to set PDF.js worker via CDN:", cdnError);
  }
}

// Shared Tesseract Worker Instance
let ocrWorker: Worker | null = null;

const getOCRWorker = async (): Promise<Worker> => {
  if (!ocrWorker) {
    ocrWorker = await createWorker('eng');
  }
  return ocrWorker;
};

/**
 * Extracts text from a PDF file.
 * If the PDF is scanned (no text), it falls back to OCR.
 */
export const parsePDF = async (arrayBuffer: ArrayBuffer, onProgress?: (msg: string) => void): Promise<string> => {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  let hasExtractedText = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`Parsing PDF page ${i}/${pdf.numPages}...`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    
    // Improved logic: If pageText is sparse (< 50 chars), it might be an image-heavy page requiring OCR.
    // However, OCR is slow. We only force OCR if literally NO text is found on a page,
    // or if the entire document yields very little text.

    if (pageText.trim().length > 20) {
      fullText += pageText + '\n\n';
      hasExtractedText = true;
    } else {
      // Fallback to OCR for this page if it's likely an image
      onProgress?.(`OCR needed for page ${i}...`);
      try {
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            const imageUrl = canvas.toDataURL('image/png');
            const ocrText = await runOCR(imageUrl);

            if (ocrText.trim()) {
                fullText += `[OCR Page ${i}]: ${ocrText}\n\n`;
                hasExtractedText = true;
            }
        }
      } catch (ocrErr) {
          console.warn(`OCR failed for page ${i}`, ocrErr);
      }
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
  try {
    const worker = await getOCRWorker();
    const { data: { text } } = await worker.recognize(imageSource);
    return text;
  } catch (e) {
      console.error("OCR Error:", e);
      return "";
  }
};

/**
 * Extracts text from a .pptx file using JSZip to parse slide XMLs.
 * Uses DOMParser for robust XML handling.
 */
export const extractTextFromPPTX = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const zip = await JSZip.loadAsync(arrayBuffer);
  let extractedText = "";
  const slideFiles = Object.keys(zip.files).filter(fileName => 
    fileName.startsWith("ppt/slides/slide") && fileName.endsWith(".xml")
  );

  // Sort slides numerically
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '') || '0');
    const numB = parseInt(b.replace(/\D/g, '') || '0');
    return numA - numB;
  });

  const parser = new DOMParser();

  for (const fileName of slideFiles) {
    const slideXmlStr = await zip.files[fileName].async("string");
    const xmlDoc = parser.parseFromString(slideXmlStr, "text/xml");

    // Extract text from <a:t> elements (standard PowerPoint text runs)
    const textNodes = xmlDoc.getElementsByTagName("a:t");
    let slideText = "";

    for (let i = 0; i < textNodes.length; i++) {
        if (textNodes[i].textContent) {
            slideText += textNodes[i].textContent + " ";
        }
    }

    if (slideText.trim()) {
       extractedText += `[SLIDE ${fileName.replace(/\D/g, '')}]: ${slideText.trim()}\n\n`;
    }
  }
  return extractedText || "No text content found in slides.";
};
