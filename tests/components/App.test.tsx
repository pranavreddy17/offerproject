import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';

// Mock pdf.js to avoid worker issues in tests
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

describe('App component', () => {
  it('renders the app header', () => {
    render(<App />);
    expect(screen.getByText('🔍 OfferLens')).toBeInTheDocument();
  });

  it('renders the upload panel by default', () => {
    render(<App />);
    expect(
      screen.getByText('Understand your offer letter'),
    ).toBeInTheDocument();
  });

  it('shows sample letter buttons', () => {
    render(<App />);
    expect(
      screen.getByText('Risky Offer (TechCorp)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Clean Offer (GreenTech)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Moderate Offer (DataFlow)'),
    ).toBeInTheDocument();
  });

  it('shows privacy note', () => {
    render(<App />);
    expect(
      screen.getByText(/processed in your browser/i),
    ).toBeInTheDocument();
  });

  it('shows disclaimer footer', () => {
    render(<App />);
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument();
  });

  it('shows error for empty input', () => {
    render(<App />);
    const analyzeBtn = screen.getByText('🔍 Analyze Offer Letter');
    fireEvent.click(analyzeBtn);
    expect(
      screen.getByText(/paste some text or upload/i),
    ).toBeInTheDocument();
  });

  it('navigates to results when sample is clicked and allows adding to compare', () => {
    render(<App />);
    const sampleBtn = screen.getByText('Risky Offer (TechCorp)');
    fireEvent.click(sampleBtn);
    expect(screen.getByRole('heading', { name: /Flagged Clauses/i })).toBeInTheDocument();

    // Add this offer to compare
    const addBtn = screen.getByRole('button', { name: /\+ Add to Compare/i });
    fireEvent.click(addBtn);

    // Switch to compare tab and verify it rendered in the table
    const compareNav = screen.getByRole('button', { name: /^Compare/i });
    fireEvent.click(compareNav);
    expect(screen.getByText(/Compare Offers \(1\/3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Offer 1/i)).toBeInTheDocument();
  });

  it('navigates to compare view empty state when no offers added', () => {
    render(<App />);
    const compareBtn = screen.getByText(/Compare/);
    fireEvent.click(compareBtn);
    expect(
      screen.getByText(/Compare Offers Side by Side/i),
    ).toBeInTheDocument();
  });

  it('clears all data when Clear All button is clicked', () => {
    render(<App />);
    const sampleBtn = screen.getByText('Clean Offer (GreenTech)');
    fireEvent.click(sampleBtn);
    expect(screen.getByRole('button', { name: /Clear All/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));
    // Returns to upload screen
    expect(screen.getByText('Understand your offer letter')).toBeInTheDocument();
  });
});
