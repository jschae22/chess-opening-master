import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Don't mock Chessboard component - we want to test the real implementation
// vi.mock('react-chessboard', () => ({
//   Chessboard: () => null,
// }));

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
