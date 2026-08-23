import '@testing-library/jest-dom';

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
