import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock Chessboard component since it uses canvas/complex DOM
vi.mock('react-chessboard', () => ({
  Chessboard: () => null,
}));

// Mock Gemini API
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: 'Mocked explanation',
      }),
    },
  })),
}));
