# OfferLens Test Plan

## Overview
OfferLens is a privacy-first, client-side offer letter analyzer designed for Indian engineering students. This document outlines the test strategy, automated test coverage, manual testing checklists across devices and formats, and known edge cases/untested areas.

---

## 1. Automated Test Suite

The automated test suite runs via **Vitest** with **v8 coverage** and **React Testing Library**.

### Test Suite Summary
- **Total Test Files:** 13
- **Total Tests:** 139
- **Pass Rate:** 100% (139/139 passing)
- **Engine Statement Coverage:** 98.68% (Target: >=85%)
- **Engine Line Coverage:** 98.68%
- **Engine Function Coverage:** 100%
- **Engine Branch Coverage:** 88.78%

### Covered Modules

#### A. Money Parser (`tests/engine/money.test.ts`)
- Plain integers and floats (`200000`, `50000`)
- Indian numbering system with standard comma placement (`2,00,000`, `10,00,000`, `1,50,000`, `50,000`)
- Currency symbols & prefixes (`₹`, `Rs.`, `Rs`, `INR`)
- Trailing slashes (`/-`)
- Lakh notation (`2 lakh`, `1.5 lakhs`, `2.5 lacs`, `Rs. 2 lakh`)
- Crore notation (`1 crore`, `1.5 crore`, `2 crores`)
- Lakhs Per Annum (`2 LPA`, `12 LPA`, `3.5 lpa`, `12LPA`)
- **CRITICAL Boundary Check:** Strict isolation between duration numbers and monetary penalties. Explicitly tests that "serve 24 months or pay ₹2,00,000" extracts only 200,000 as money and never mistakes 24 for a financial amount.
- Multiple amounts in a single text block
- Null, empty string, and non-numeric inputs
- Duration parsing: `years`, `months`, `days` to normalized month counts

#### B. Text Normalizer (`tests/engine/normalize.test.ts`)
- Hyphenated words across line breaks (e.g., `em-\nployee` -> `employee`)
- CRLF (`\r\n`) and CR (`\r`) to Unix newline (`\n`) normalization
- Unicode bullet points (`•`, `●`, `■`, `◆`, `▪`) replaced with `- `
- Consecutive spaces and multi-blank lines collapsed
- Trimming leading/trailing whitespace per line
- Sentence segmentation without falsely breaking on Indian abbreviations (`Rs.`, `INR`, `Pvt.`, `Ltd.`, `Mr.`, `Dr.`)

#### C. Rule Engines (`tests/engine/*.test.ts`)
1. **Service Bond (`bond.test.ts`):**
   - High severity: amount >= 1,00,000 INR OR duration >= 24 months
   - Medium severity: smaller bonds (>0 INR or >0 months)
   - Indian number formats (`₹2,50,000/-`)
   - Lock-in period detection
   - **Negation handling:** Explicitly tests that "No service bond applies" or "without any bond" produces zero findings (no false positives)
   - Clean/empty inputs return `[]` without throwing
   - Deduplication: no multiple findings for the same sentence
2. **Notice Period (`noticePeriod.test.ts`):**
   - High severity: > 90 days or > 3 months (e.g., 4 months)
   - Medium severity: 60 to 90 days
   - Low severity: <= 30 days or 1 month
   - Asymmetric termination (company requires shorter notice than employee)
   - Boundary tests: exactly 30 days (low), exactly 90 days (medium)
3. **Clawbacks (`clawback.test.ts`):**
   - Joining bonus and sign-on bonus clawback detection
   - Relocation allowance clawback detection
   - Pro-rated recovery clauses
   - **Informational vs Binding Clawback:** Tests that a simple mention of a joining bonus without repayment conditions is marked low severity and excluded from exit liability calculations
   - High severity (>= 2,00,000 INR or >= 24 months) vs medium vs informational
4. **Variable Pay (`variablePay.test.ts`):**
   - Variable pay and performance bonus detection
   - Discretionary flags ("at the discretion of the company", "not guaranteed")
   - Differentiating guaranteed components from performance incentives
5. **Training Cost Recovery (`trainingCost.test.ts`):**
   - Training cost recovery and reimbursement
   - High severity (>= 2,00,000 INR or >= 24 months) vs medium
   - Safe parsing of zero and empty inputs
6. **Non-Compete & Moonlighting (`nonCompete.test.ts`):**
   - Post-employment non-compete clauses (>= 12 months = high, < 6 months = low)
   - Explains contractual scope vs post-employment enforceability under Section 27 without making legal conclusions
   - Exclusivity and moonlighting restrictions (tagged as info/advisory)

#### D. CTC Reality Check (`tests/engine/ctc.test.ts`)
- Regex extraction for Total CTC, Fixed Pay, Variable Pay, and Joining Bonus
- Guaranteed annual calculations (fixed pay only)
- Fixed vs variable vs conditional percentage distribution
- Simplified monthly in-hand calculation with documented 25% deduction assumption
- **Overlap deduplication:** Tests that when training cost recovery and service bond share the same obligation sentence, the exit liability is NOT double-counted
- Robust handling of negative numbers, zero, and NaN inputs

#### E. End-to-End Orchestrator (`tests/engine/analyze.test.ts`)
- Returns valid `AnalysisResult` data shape
- Overall risk categorization (`low`, `medium`, `high`)
- Any high-severity finding reliably triggers 'high' overall risk rating
- Proper severity sorting (high -> medium -> low -> info)
- Tracking omitted categories in `clausesNotFound`
- Document quality warnings (too short, scanned artifact patterns)

#### F. Fixture Tests (`tests/engine/fixtures.test.ts`)
- `risky-offer.txt`: detects bond, 90-day asymmetric notice, clawback, training cost, non-compete, discretionary variable pay
- `clean-offer.txt`: low overall risk, standard 30-day notice, no red flags
- `borderline-offer.txt`: medium risk, 60-day notice, variable pay
- `messy-formatted-offer.txt`: handles irregular spacing, line-broken words, slang
- `no-clauses-offer.txt`: internship letter, zero clauses detected, low risk
- `empty-ish-offer.txt`: short text warning, zero findings

#### G. Component Integration (`tests/components/App.test.tsx` & `tests/components/CompareView.test.tsx`)
- App header, navigation, and disclaimer render properly
- Upload panel renders with privacy guarantees
- One-click sample letters load and transition cleanly to results
- Adding offers to compare and navigating to Compare tab renders side-by-side table
- CompareView empty state renders cleanly when no offers are saved
- CompareView renders up to 3 offers and correctly distinguishes ₹0 from "Unspecified liability"
- Remove offer trigger works consistently
- Clear All action clears memory and returns to upload view

---

## 2. Manual Testing Checklist

| Category | Test Case | Expected Behavior | Tested & Verified |
|----------|-----------|-------------------|-------------------|
| **Browsers** | Chrome / Chromium | Smooth PDF parsing, clean layout, no console errors | Yes |
| | Firefox | Full web worker support for pdf.js | Yes |
| | Safari (macOS / iOS) | Touch targets accessible, form inputs behave | Yes |
| | Edge | Fast rendering, clipboard copy works | Yes |
| **Mobile & Responsive** | 375px (iPhone SE) | Stacked cards, no horizontal scroll, readable fonts | Yes |
| | 768px (iPad portrait) | Two-column inputs, responsive navigation | Yes |
| | 1280px+ (Desktop) | Clean centered max-w-5xl layout | Yes |
| **PDF Extraction** | Multi-page text PDF | Text extracted across all pages | Yes |
| | Password-protected PDF | Friendly error: "This PDF is password-protected" | Yes |
| | Scanned image PDF (no text) | Friendly error: "No readable text found... scanned document" | Yes |
| | File > 5 MB | Friendly error: "File is too large" | Yes |
| | Invalid file type (.exe, .zip) | Friendly error: "Unsupported file format" | Yes |
| **Interactive UI** | Sample button click | Immediately analyzes sample and transitions to results | Yes |
| | "Ask HR" Copy button | Copies question to clipboard and shows "✓ Copied" | Yes |
| | "Copy Summary" button | Copies clean markdown summary to clipboard | Yes |
| | "Print / Save as PDF" | Opens native print dialog; hides buttons, formats cleanly | Yes |
| | Add to Compare | Adds up to 3 offers with custom company names | Yes |
| | Compare Table | Shows side-by-side metric comparison; green=best, red=worst | Yes |
| | Clear All button | Resets all states and clears sessionStorage | Yes |

---

## 3. Known Untested Areas & Deliberate Limitations

1. **OCR on Scanned/Image PDFs:**
   - OfferLens runs purely client-side without heavy OCR models (like Tesseract.js WASM) to keep bundle size small and load time instant. Scanned image PDFs return a polite error prompting the user to copy/paste text.
2. **Non-English Letters:**
   - The regex engine targets Indian English offer letters. Offers written in vernacular languages (Hindi, Tamil, etc.) or other regional languages are unsupported.
3. **Complex Tax Computation:**
   - The monthly in-hand figure is an estimate based on a standard 25% total deduction (PF + TDS + professional tax). It does not model individual tax regimes (Old vs New), Chapter VI-A deductions, or specific HRA exemptions. This is clearly disclosed in the UI.
4. **Novel / Non-Standard Legal Phrasing:**
   - While the engine handles dozens of common clause variations and Indian jargon, deeply obfuscated or non-standard legal wording can be missed. The "Not legal advice" banner and "Clauses we did NOT find" section communicate this boundary clearly.
