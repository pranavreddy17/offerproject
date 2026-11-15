# OfferLens — 2:30 Minute Video Demo Script

**Speaker:** Candidate / Developer  
**Target Video Duration:** 2 minutes 30 seconds

---

### [0:00 - 0:25] The Problem & The User
> *(Screen: Show OfferLens landing page with clean hero title)*
> 
> "Hi everyone, I'm presenting **OfferLens**, a tool built for final-year engineering students across India facing campus placements.
> 
> Every recruitment season, thousands of students receive offer letters with tight deadlines. Most compare offers purely by the headline CTC. But buried inside the dense legal text are traps: 2-year service bonds, 90-day notice periods, signing bonus clawbacks, and training fees.
> 
> Students rarely have access to a lawyer. OfferLens is their instant, privacy-first offer letter advisor."

---

### [0:25 - 0:50] Privacy-First Architecture & Loading a Sample
> *(Screen: Hover over the green privacy badge: "Processed in your browser. Nothing is uploaded.")*
> 
> "The first core design decision is **privacy**. Offer letters contain sensitive personal and compensation data. OfferLens processes everything **100% client-side in the browser**. No backend, no database, no third-party APIs. Your document never leaves your machine.
> 
> Let's see it in action. I can paste raw text or upload a PDF. To start quickly, I'll click **'Risky Offer (TechCorp)'** from our sample letters."

---

### [0:50 - 1:25] Rule Engine & Risk Findings
> *(Screen: Click 'Risky Offer'. App instantaneously transitions to Results View)*
> 
> "In less than 5 milliseconds, our deterministic rule engine analyzed the contract.
> 
> Right at the top, we see a **High Risk** warning banner summarizing 6 detected issues.
> 
> Notice how each clause card gives the student complete clarity:
> 1. A color-coded **severity badge**.
> 2. The **exact quoted sentence** from their offer so they can verify the context.
> 3. A **plain-English explanation** of the risk.
> 4. And crucially, an **'Ask HR'** pre-written question with a one-click copy button, giving students the exact polite phrasing to seek clarification.
> 
> Here it caught a ₹2,00,000 service bond for 2 years, an asymmetric 90-day notice period, a bonus clawback, and a ₹3,00,000 training-fee recovery clause."

---

### [1:25 - 1:55] CTC Reality Check
> *(Screen: Scroll down to the '💰 CTC Reality Check' section)*
> 
> "Next is the **CTC Reality Check**. Many companies advertise an ₹8 LPA CTC, but what does that actually mean?
> 
> OfferLens parses the compensation breakdown: ₹5.6L fixed, ₹1.4L variable, and a ₹1L joining bonus.
> 
> The interactive distribution bar reveals that only 70% of this offer is guaranteed. It estimates a realistic monthly in-hand of ~₹35,000 after standard deductions, rather than the ₹66,000 students might naively calculate from 8 LPA.
> 
> Most importantly, look at the **'Worst-Case Exit Cost'**: ₹6,00,000. If this student leaves within 18 months, between the bond, bonus repayment, and training fee, they could owe almost an entire year's salary back to the company."

---

### [1:55 - 2:15] Comparing Offers Side-by-Side
> *(Screen: Click '+ Add to Compare' as 'TechCorp', then click 'Analyze another', select 'Clean Offer (GreenTech)', and add to compare)*
> 
> "Students often hold multiple offers and need to decide between them.
> 
> I'll add this to our **Compare View** as 'TechCorp', then analyze our second sample, 'GreenTech', which has fair 30-day notice and zero bonds.
> 
> Now let's open the **Compare tab**. OfferLens puts both offers side-by-side in a clean matrix. It automatically highlights the best in row in green and the worst in red: comparing Fixed %, Bond Duration, Notice Period, and total Exit Liability at a glance."

---

### [2:15 - 2:30] Code Quality, Testing & Wrap-Up
> *(Screen: Show terminal with 127/127 tests passing and 98.7% engine coverage)*
> 
> "Behind the scenes, OfferLens is built with Vite, React, TypeScript, and Tailwind CSS. The pure TypeScript engine is covered by **127 automated tests with 98.7% code coverage**, running on Vitest.
> 
> It's fast, zero-cost to run, fully accessible, and genuinely protects students at the start of their careers.
> 
> Thank you!"
