import { useState, useRef, useCallback } from 'react';
import type { AnalysisResult } from '../engine/types';
import { analyze } from '../engine/analyze';
import { extractTextFromPdf, extractTextFromTxt, PdfError } from '../lib/pdf';
import { ErrorState } from './ErrorState';

// Import sample fixtures as raw text
import riskyOffer from '../fixtures/risky-offer.txt?raw';
import cleanOffer from '../fixtures/clean-offer.txt?raw';
import moderateOffer from '../fixtures/moderate-offer.txt?raw';

const SAMPLES = [
  {
    name: 'Risky Offer (TechCorp)',
    text: riskyOffer,
    description: 'Bond, clawbacks, non-compete, long notice',
  },
  {
    name: 'Clean Offer (GreenTech)',
    text: cleanOffer,
    description: 'Fair terms, no red flags',
  },
  {
    name: 'Moderate Offer (DataFlow)',
    text: moderateOffer,
    description: 'Some conditions, mixed risk',
  },
];

interface UploadPanelProps {
  onAnalyze: (result: AnalysisResult) => void;
}

export function UploadPanel({ onAnalyze }: UploadPanelProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please paste some text or upload a file first.');
      return;
    }
    setError(null);
    const result = analyze(trimmed);
    onAnalyze(result);
  }, [text, onAnalyze]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setIsProcessing(true);

      try {
        let extractedText: string;

        if (file.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await file.arrayBuffer();
          extractedText = await extractTextFromPdf(buffer, file.size);
        } else if (
          file.name.toLowerCase().endsWith('.txt') ||
          file.type === 'text/plain'
        ) {
          extractedText = await extractTextFromTxt(file);
        } else {
          setError(
            'Unsupported file format. Please upload a .pdf or .txt file.',
          );
          setIsProcessing(false);
          return;
        }

        setText(extractedText);
      } catch (err) {
        if (err instanceof PdfError) {
          setError(err.message);
        } else {
          setError(
            'Failed to read the file. Please try pasting the text instead.',
          );
        }
      } finally {
        setIsProcessing(false);
        // Reset file input so the same file can be re-uploaded
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [],
  );

  const handleSample = useCallback(
    (sampleText: string) => {
      setText(sampleText);
      setError(null);
      const result = analyze(sampleText);
      onAnalyze(result);
    },
    [onAnalyze],
  );

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="text-center py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Understand your offer letter
          <br />
          <span className="text-indigo-600">before you sign it</span>
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          OfferLens analyzes your offer letter for risky clauses — service bonds,
          clawbacks, long notice periods, and more. 100% private: your document
          never leaves your browser.
        </p>
      </div>

      {/* Privacy note */}
      <div
        className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2"
        role="status"
      >
        <span className="text-green-600 text-lg">🔒</span>
        <p className="text-sm text-green-700">
          <strong>Privacy-first:</strong> Everything is processed in your
          browser. Nothing is uploaded to any server.
        </p>
      </div>

      {/* Input area */}
      <div>
        <label
          htmlFor="offer-text"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Paste your offer letter text
        </label>
        <textarea
          id="offer-text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder="Paste the full text of your offer letter here..."
          className="w-full h-48 border border-gray-300 rounded-lg p-4 text-sm resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          aria-describedby="upload-help"
        />
      </div>

      {/* File upload */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <label
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm"
          htmlFor="file-upload"
        >
          📄 Upload PDF or TXT file
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            onChange={handleFileUpload}
            className="sr-only"
            aria-label="Upload offer letter file"
          />
        </label>
        <p id="upload-help" className="text-xs text-gray-400">
          Max 5 MB. PDF text must be selectable (no scanned images).
        </p>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-indigo-600">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
          Extracting text from file...
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorState
          title="Input Error"
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={isProcessing}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
      >
        🔍 Analyze Offer Letter
      </button>

      {/* Sample letters */}
      <div className="border-t border-gray-200 pt-5">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Or try a sample letter:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLES.map((sample) => (
            <button
              key={sample.name}
              onClick={() => handleSample(sample.text)}
              className="text-left border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <span className="block text-sm font-medium text-gray-900">
                {sample.name}
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                {sample.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
