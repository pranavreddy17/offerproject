/**
 * PDF to text extraction using pdf.js.
 *
 * Runs entirely in the browser — no server needed.
 * Handles multi-page PDFs and concatenates all text content.
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure the pdf.js worker. Vite bundles this correctly when we
// point to the worker entry file from the pdfjs-dist package.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

/** Maximum file size we'll attempt to process (5 MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Errors that can occur during PDF processing */
export class PdfError extends Error {
  constructor(
    message: string,
    public readonly code: 'TOO_LARGE' | 'PASSWORD' | 'NO_TEXT' | 'PARSE_ERROR',
  ) {
    super(message);
    this.name = 'PdfError';
  }
}

/**
 * Extract text from a PDF file (as ArrayBuffer).
 * Throws PdfError with specific codes for known failure modes.
 */
export async function extractTextFromPdf(
  buffer: ArrayBuffer,
  fileSize: number,
): Promise<string> {
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    throw new PdfError(
      `File is too large (${(fileSize / 1024 / 1024).toFixed(1)} MB). Maximum supported size is 5 MB.`,
      'TOO_LARGE',
    );
  }

  try {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item) => 'str' in item)
        .map((item) => {
          const textItem = item as { str: string; hasEOL?: boolean };
          return textItem.str + (textItem.hasEOL ? '\n' : ' ');
        })
        .join('');
      pages.push(pageText);
    }

    const fullText = pages.join('\n\n');

    // Check if any meaningful text was extracted
    const cleanText = fullText.replace(/\s/g, '');
    if (cleanText.length < 10) {
      throw new PdfError(
        'No readable text found in the PDF. It might be a scanned document (image-based). OfferLens cannot process scanned PDFs — please paste the text manually instead.',
        'NO_TEXT',
      );
    }

    return fullText;
  } catch (error) {
    if (error instanceof PdfError) throw error;

    // pdf.js throws errors for password-protected PDFs
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('password')) {
      throw new PdfError(
        'This PDF is password-protected. Please remove the password or paste the text manually.',
        'PASSWORD',
      );
    }

    throw new PdfError(
      `Could not read the PDF file. It may be corrupted or in an unsupported format. Error: ${message}`,
      'PARSE_ERROR',
    );
  }
}

/**
 * Read a .txt file as plain text.
 */
export async function extractTextFromTxt(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new PdfError(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum supported size is 5 MB.`,
      'TOO_LARGE',
    );
  }
  return file.text();
}
