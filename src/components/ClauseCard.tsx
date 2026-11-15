import { useState } from 'react';
import type { Finding } from '../engine/types';
import { SeverityBadge } from './SeverityBadge';

interface ClauseCardProps {
  finding: Finding;
}

export function ClauseCard({ finding }: ClauseCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyQuestion = () => {
    navigator.clipboard.writeText(finding.questionForHR).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
      role="article"
      aria-label={`${finding.title} - ${finding.severity} severity`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900">{finding.title}</h3>
        <SeverityBadge severity={finding.severity} />
      </div>

      {/* Matched text from the offer letter */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-3 rounded-r">
        <p className="text-sm text-gray-700 italic">
          &ldquo;{finding.matchedText}&rdquo;
        </p>
      </div>

      {/* Plain-English explanation */}
      <p className="text-sm text-gray-600 mb-3">{finding.explanation}</p>

      {/* Extracted data */}
      {finding.extracted &&
        (finding.extracted.amount || finding.extracted.durationMonths) && (
          <div className="flex gap-3 mb-3 text-xs">
            {finding.extracted.amount && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                Amount: ₹{finding.extracted.amount.toLocaleString('en-IN')}
              </span>
            )}
            {finding.extracted.durationMonths && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                Duration: {finding.extracted.durationMonths} months
              </span>
            )}
          </div>
        )}

      {/* Ask HR question */}
      <div className="bg-indigo-50 rounded-md p-3 flex items-start gap-2">
        <span className="text-indigo-600 font-medium text-sm whitespace-nowrap">
          Ask HR:
        </span>
        <p className="text-sm text-indigo-800 flex-1">
          {finding.questionForHR}
        </p>
        <button
          onClick={handleCopyQuestion}
          className="text-indigo-600 hover:text-indigo-800 text-xs whitespace-nowrap border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-100 transition-colors"
          aria-label="Copy question to clipboard"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
