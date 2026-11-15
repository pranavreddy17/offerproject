# 🔍 OfferLens — Privacy-First Offer Letter Analyzer

> A deterministic, privacy-first web application that empowers final-year engineering students to analyze campus placement offer letters, flag predatory clauses, estimate real in-hand pay, and compare competing offers side by side before signing.

[![Build & Test](https://img.shields.io/badge/Tests-127%2F127%20Passing-success)](https://github.com)
[![Coverage](https://img.shields.io/badge/Engine%20Coverage-98.76%25-brightgreen)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Client--Side-blueviolet)](https://github.com)

---

## 🌐 Live Demo & Repository
- **Live Application:** [https://offerlens.vercel.app](https://offerproject.vercel.app/) *(or your deployed Vercel deployment URL)*
- **GitHub Repository:** [https://github.com/your-username/offerlens](https://github.com/pranavreddy17/offerproject)

---

## 📸 Screenshots

| 1. Instant Document Analysis & Sample Loading | 2. Flagged Predatory Clauses & "Ask HR" Prompts |
|:---:|:---:|
| *(Upload panel supporting PDF, TXT, or one-click sample letters with 100% client-side privacy note)* | *(Color-coded severity cards with quoted sentences and pre-written HR questions)* |

| 3. CTC Reality Check & Exit Liability | 4. Side-by-Side Multi-Offer Comparison |
|:---:|:---:|
| *(Visual fixed vs variable distribution bar and worst-case exit liability estimation)* | *(Compare up to 3 offers side by side with automated best/worst highlighting)* |

---

## 🎯 The Problem & The Target User

### The User
Final-year engineering and technology undergraduates in India participating in campus placement drives (on-campus and off-campus).

### The Problem
- **Strict Deadlines:** Companies typically give students 24 to 72 hours to accept an offer letter.
- **Asymmetric Legal Knowledge:** Freshers rarely have access to legal counsel or corporate experience.
- **Deceptive Headline CTCs:** CTC (Cost to Company) numbers bundle performance-linked variable pay, conditional one-time joining bonuses, and training deductions together.
- **Buried Predatory Clauses:** Fine print frequently hides 2-to-3-year service bonds, 90-day asymmetric notice periods, bonus clawbacks, training fee reimbursements, and broad post-employment non-compete covenants.

### The Solution: OfferLens
OfferLens provides an instant, privacy-preserving legal and financial scan that parses offer contracts in milliseconds, translates legal jargon into plain English, outlines realistic monthly take-home pay, and gives students the exact polite wording needed to ask HR for clarification.

---

## ✨ Features

- 🔒 **100% Privacy-First (Zero Backend):** All PDF parsing, text extraction, and clause evaluation occurs purely inside the user's browser. No data, text, or metadata is ever transmitted over the network or saved to any server.
- ⚡ **Deterministic Rule Engine (No LLM):** Powered by an auditable, deterministic regex and natural language rules engine. Zero hallucinations, instant (<5ms) analysis, no API tokens, and runs completely offline.
- 🚩 **6 High-Impact Indian Employment Clauses Analyzed:**
  1. **Service Bonds & Liquidated Damages:** Detects lock-in periods and early exit penalties.
  2. **Notice Periods & Asymmetric Terms:** Flags excessive (>90 days) notice and imbalanced termination terms.
  3. **Joining Bonus Clawbacks:** Highlights repayment windows and pro-rated recovery conditions.
  4. **Variable Pay Transparency:** Identifies discretionary and unguaranteed compensation components.
  5. **Training Cost Recovery:** Uncovers clauses forcing employees to pay back onboarding/training fees upon departure.
  6. **Non-Compete & Moonlighting:** Evaluates post-employment restrictions and secondary work limits.
- 💬 **Actionable "Ask HR" Prompts:** Each flagged finding provides a pre-drafted, constructive inquiry with a one-click clipboard copy button.
- 💰 **CTC Reality Check:**
  - Dynamic visual breakdown of Fixed vs. Variable vs. Conditional compensation.
  - Realistic monthly in-hand calculation using a clearly labelled ~25% statutory deduction heuristic.
  - **Worst-Case Exit Cost:** Sums total financial liability (bond penalty + clawbacks + training recovery) if leaving early.
- ⚖️ **Side-by-Side Offer Comparison:** Save up to 3 offers in session memory to compare CTC, fixed percentage, notice period, bond terms, and exit liabilities in an intuitive matrix with green/red best/worst indicators.
- 🖨️ **Export & Print Ready:** One-click markdown summary copy and clean printer/PDF export stylesheet.
- ♿ **Accessible & Mobile-Responsive:** Built with semantic HTML, ARIA landmarks, WCAG-compliant color contrasts, and full keyboard navigation.

---

## 🛠️ Tech Stack & Open-Source Attributions

OfferLens is intentionally crafted without heavy frameworks or unnecessary abstractions:

- **Frontend Framework:** [React 19](https://react.dev/) — Declarative user interface components.
- **Language:** [TypeScript 5.7](https://www.typescriptlang.org/) — Strict static typing with zero `any` usage.
- **Build Tool:** [Vite 6](https://vitejs.dev/) — Lightning-fast ES module bundler and development server.
- **Styling:** [Tailwind CSS 3.4](https://tailwindcss.com/) — Utility-first, responsive design system.
- **PDF Text Extraction:** [PDF.js (pdfjs-dist 4.9)](https://mozilla.github.io/pdf.js/) — Mozilla's open-source browser-based PDF parser, configured with dedicated Vite worker chunking.
- **Unit & Integration Testing:** [Vitest 3](https://vitest.dev/) & [React Testing Library](https://testing-library.com/) — High-speed test runner with native v8 coverage tracking.
- **Formatting & Linting:** [Prettier](https://prettier.io/) & [ESLint](https://eslint.org/).
- **Deployment Platform:** [Vercel](https://vercel.com/) — Global edge static hosting.

---

## 🏛️ Architecture Overview

The codebase is strictly segregated between pure business logic and presentation:

```
offer_letter_analyzer/
├── src/
│   ├── engine/                  # PURE TypeScript (Zero DOM/React dependencies)
│   │   ├── types.ts             # Canonical data structures & finding schemas
│   │   ├── money.ts             # Indian currency & duration parser
│   │   ├── normalize.ts         # Text sanitization & abbreviation-aware sentence splitting
│   │   ├── ctc.ts               # CTC component extractor & take-home math
│   │   ├── analyze.ts           # Master analysis orchestrator
│   │   └── rules/               # Modular rule implementations
│   │       ├── bond.ts
│   │       ├── noticePeriod.ts
│   │       ├── clawback.ts
│   │       ├── variablePay.ts
│   │       ├── trainingCost.ts
│   │       └── nonCompete.ts
│   ├── components/              # React UI Layer
│   │   ├── UploadPanel.tsx      # Text input, file drop, sample picker
│   │   ├── ResultsView.tsx      # Finding presentation, summary counters, export
│   │   ├── ClauseCard.tsx       # Individual finding card with "Ask HR" copy
│   │   ├── CtcBreakdown.tsx     # Visual salary distribution bar & metrics
│   │   ├── CompareView.tsx      # Side-by-side comparison matrix
│   │   ├── SeverityBadge.tsx    # Color-coded severity indicators
│   │   ├── Disclaimer.tsx       # Non-legal advice disclaimer footer
│   │   └── ErrorState.tsx       # Accessible error card with retry triggers
│   ├── lib/
│   │   └── pdf.ts               # In-browser PDF extraction using pdfjs-dist
│   ├── fixtures/                # 6 Real-world sample offer letters
│   │   ├── clean-offer.txt
│   │   ├── risky-offer.txt
│   │   ├── borderline-offer.txt
│   │   ├── messy-formatted-offer.txt
│   │   ├── no-clauses-offer.txt
│   │   └── empty-ish-offer.txt
│   ├── App.tsx                  # Top-level state and routing
│   └── main.tsx                 # DOM entry point
├── tests/                       # Automated test suite
│   ├── engine/                  # Pure engine unit and integration tests (11 files)
│   └── components/              # React component interaction tests (1 file)
└── docs/                        # Project documentation
    ├── TEST_PLAN.md             # Testing strategy, checklist, and coverage report
    ├── CODE_WALKTHROUGH.md      # Deep dive, data flow, and 15 interview Q&As
    ├── WRITEUP.md               # Product write-up (max 400 words)
    └── DEMO_SCRIPT.md           # 2:30 minute walkthrough presentation script
```

---

## ⚙️ Local Development & Setup

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### 1. Clone & Install
```bash
git clone https://github.com/your-username/offerlens.git
cd offerlens
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Run Test Coverage (v8)
```bash
npm run test:coverage
```

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🧩 How the Rule Engine Works & How to Add a Rule

### Engine Flow
1. **Normalization (`normalize.ts`):** Cleans line breaks, removes carriage returns, handles hyphenated line wraps (e.g. `em-\nployee`), converts bullet variations, and splits sentences using a negative lookbehind that prevents breaking on Indian abbreviations (`Rs.`, `INR`, `Pvt.`, `Ltd.`).
2. **Rule Execution:** Each rule function in `src/engine/rules/` accepts normalized text and returns an array of `Finding` objects.
3. **CTC Extraction (`ctc.ts`):** Extracts salary amounts, calculates percentage distributions, computes in-hand estimations, and calculates the worst-case exit liability.
4. **Aggregation & Sorting (`analyze.ts`):** Aggregates findings, deduplicates by sentence, sorts high-to-low by severity, calculates overall contract risk (`low`, `medium`, `high`), and notes unflagged categories in `clausesNotFound`.

### Adding a New Rule (e.g., Intellectual Property / Patent Assignment)
1. **Define the clause type:** Add `'ipAssignment'` to `ClauseType` in `src/engine/types.ts`.
2. **Create the detector:** Create `src/engine/rules/ipAssignment.ts`:
   ```typescript
   import type { Finding } from '../types';
   import { splitSentences } from '../normalize';

   export function detectIpAssignment(text: string): Finding[] {
     const sentences = splitSentences(text);
     const findings: Finding[] = [];
     for (const sentence of sentences) {
       if (/intellectual\s+property|patent|assign.*inventions/i.test(sentence)) {
         findings.push({
           id: `ip-${findings.length + 1}`,
           type: 'ipAssignment',
           severity: 'medium',
           title: 'Broad IP Assignment Clause',
           matchedText: sentence,
           explanation: 'This clause may assign all personal inventions or side projects created during employment to the company.',
           questionForHR: 'Does the IP assignment clause apply to personal projects created outside of work hours without company equipment?'
         });
       }
     }
     return findings;
   }
   ```
3. **Register the rule:** Add `{ type: 'ipAssignment', detect: detectIpAssignment }` to the `RULES` array in `src/engine/analyze.ts`.
4. **Write unit tests:** Create `tests/engine/ipAssignment.test.ts`.

---

## ⚠️ Known Limitations

1. **No OCR for Scanned Documents:** OfferLens only parses selectable text streams inside PDFs. Scanned image-only PDFs will trigger a friendly error prompting users to copy/paste text.
2. **English Only:** Current patterns and vocabulary specifically target Indian English offer letters and contracts.
3. **Regex Pattern Boundaries:** Highly non-standard or heavily obfuscated legal wording might evade detection. The "Not legal advice" disclaimer and "Clauses we did NOT find" section communicate this transparently.
4. **Simplified In-Hand Salary Calculation:** The monthly take-home estimate assumes a standard ~25% statutory deduction (PF, income tax, professional tax). It does not substitute for an individual tax planner.
5. **Not Legal Advice:** OfferLens is an automated educational tool and reality check, not a certified legal practitioner.

---

## 🚀 What I'd Build Next

- **Industry Benchmarking:** Compare clauses against empirical benchmarks (e.g., how this offer's notice period or fixed ratio compares with Tier-1 IT services vs. Series-B product startups).
- **One-Click Negotiation Email Generator:** Generate polite, professional email drafts addressing specific high-risk clauses directly from the UI.
- **Internship & PPO Mode:** Specialized heuristic set for 2-to-6 month internship agreements and stipend structures.
- **Export to PDF Report:** Generate branded, professional summary PDF reports that students can share with mentors or family.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
