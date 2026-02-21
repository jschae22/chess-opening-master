import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import React from 'react';

// Mock the services to avoid actual API calls
vi.mock('../services/gemini', () => ({
  explainOpeningMove: vi.fn().mockResolvedValue('Mocked explanation'),
  getOpeningSuggestions: vi.fn().mockResolvedValue([{ move: 'e4', explanation: 'Good move' }]),
}));

describe('App Component', () => {
  it('renders the application title', () => {
    render(<App />);
    expect(screen.getByText(/Chess Opening Master/i)).toBeInTheDocument();
  });

  it('renders the opening library', () => {
    render(<App />);
    expect(screen.getByText(/Library/i)).toBeInTheDocument();
    expect(screen.getByText(/White Openings/i)).toBeInTheDocument();
    expect(screen.getByText(/Black Openings/i)).toBeInTheDocument();
  });

  it('can flip the board', () => {
    render(<App />);
    const flipButton = screen.getByTitle(/Flip Board/i);
    
    // Initial view
    expect(screen.getByText(/View: white/i)).toBeInTheDocument();
    
    // Click flip
    fireEvent.click(flipButton);
    expect(screen.getByText(/View: black/i)).toBeInTheDocument();
  });

  it('can reset the game', () => {
    render(<App />);
    const resetButton = screen.getByText(/Reset/i);
    fireEvent.click(resetButton);
    // Should still show initial state
    expect(screen.getByText(/View: white/i)).toBeInTheDocument();
  });
});
