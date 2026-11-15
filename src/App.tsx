import { useState } from 'react';
import { UploadPanel } from './components/UploadPanel';
import { ResultsView } from './components/ResultsView';
import { CompareView } from './components/CompareView';
import { Disclaimer } from './components/Disclaimer';
import type { AnalysisResult } from './engine/types';

/** A saved analyzed offer for comparison */
export interface SavedOffer {
  name: string;
  result: AnalysisResult;
}

type View = 'upload' | 'results' | 'compare';

export default function App() {
  const [view, setView] = useState<View>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [offers, setOffers] = useState<SavedOffer[]>([]);

  const handleAnalysis = (analysisResult: AnalysisResult) => {
    setResult(analysisResult);
    setView('results');
  };

  const handleAddToCompare = (name: string, offer: AnalysisResult) => {
    if (offers.length >= 3) return;
    setOffers((prev) => {
      // If an offer with the exact same company name already exists, update it with the latest analysis
      const existingIdx = prev.findIndex(
        (o) => o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { name, result: offer };
        return updated;
      }
      return [...prev, { name, result: offer }];
    });
  };

  const handleRemoveFromCompare = (index: number) => {
    setOffers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setOffers([]);
    setResult(null);
    setView('upload');
    sessionStorage.clear();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 no-print">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setView('upload')}
            className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            aria-label="Go to home"
          >
            🔍 OfferLens
          </button>
          <nav className="flex gap-3" aria-label="Main navigation">
            {result && (
              <button
                onClick={() => setView('results')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === 'results'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Results
              </button>
            )}
            <button
              onClick={() => setView('compare')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'compare'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Compare{offers.length > 0 ? ` (${offers.length})` : ''}
            </button>
            {(result || offers.length > 0) && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-sm rounded-md text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Clear all data"
              >
                Clear All
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {view === 'upload' && <UploadPanel onAnalyze={handleAnalysis} />}
        {view === 'results' && result && (
          <ResultsView
            result={result}
            onAddToCompare={handleAddToCompare}
            compareCount={offers.length}
          />
        )}
        {view === 'compare' && (
          <CompareView
            offers={offers}
            onRemove={handleRemoveFromCompare}
            onAnalyzeAnother={() => setView('upload')}
          />
        )}
      </main>

      <Disclaimer />
    </div>
  );
}
