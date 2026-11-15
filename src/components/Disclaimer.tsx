export function Disclaimer() {
  return (
    <footer
      className="bg-gray-100 border-t border-gray-200 py-4 px-4 text-center no-print"
      role="contentinfo"
    >
      <p className="text-xs text-gray-500 max-w-2xl mx-auto">
        <strong>⚠️ Not legal advice.</strong> OfferLens uses pattern matching to
        flag common clauses in offer letters. It is not a substitute for
        professional legal counsel. Always read your full offer letter carefully
        and consult a lawyer for binding legal matters. Your document is
        processed entirely in your browser — nothing is uploaded or stored.
      </p>
    </footer>
  );
}
