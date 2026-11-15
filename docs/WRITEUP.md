# OfferLens Product Write-Up

### 1. Problem and User
Final-year Indian engineering students often receive campus placement offer letters with strict 48-to-72-hour acceptance deadlines. Without access to legal counsel, students focus solely on headline CTC numbers. In doing so, they miss buried clauses: two-year service bonds, 90-day notice periods, sign-on bonus clawbacks, training-fee recovery, and discretionary variable pay. OfferLens provides a privacy-first, automated reality check that translates dense legal terms into plain English before students sign.

### 2. Key Product Decisions
- **100% Client-Side Privacy:** Job offers contain sensitive personal details (names, compensation, college identifiers). Running entirely in the browser with zero backend or external API calls eliminates data breach risks and instills user trust.
- **Deterministic Rule Engine over LLMs:** An LLM introduces token latency, non-deterministic hallucinations, cost, and third-party data transmission. A deterministic regex and pattern engine executes in under 5ms, guarantees reproducible audits, works offline, and costs nothing to operate.
- **Actionable "Ask HR" Prompts:** Flagging a problem is only half the battle. Students hesitate to negotiate because they fear losing their offers. Providing polite, pre-written questions empowers them to seek clarification constructively.

### 3. What Was Cut and What's Next
- **Cut:** Optical Character Recognition (OCR) for scanned PDFs and an exact Indian income tax calculator. Both would have added heavy bundle bloat and false precision.
- **What's Next:** Adding clause benchmarks (comparing clauses against industry standards for Indian IT services vs. product startups), exportable negotiation email templates, and support for regional internship agreements.

### 4. What Broke and How I Handled It
- **Duration Confusion in Money Parsing:** Sentences like "serve for 24 months or pay ₹2,00,000" initially risked extracting 24 as a financial penalty. I enforced regex negative lookaheads preventing bare numbers followed by duration units from being parsed as currency.
- **Abbreviation Sentence Splitting:** In Indian offer letters, `Rs. 50,000` caused sentences to split directly after `Rs.`, detaching penalties from their clauses. I resolved this using a negative lookbehind for currency and corporate abbreviations (`Rs.`, `INR`, `Pvt.`, `Ltd.`).
- **PDF.js Web Worker in Vite:** Vite's ESM bundler broke default worker script loading. I solved this by leveraging Vite's `new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url)` syntax, which emits an isolated worker chunk during production builds.

---
**Word Count:** 386 words (Limit: 400 words)
