import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

describe('Chess Logic (chess.js)', () => {
  it('should initialize a new game', () => {
    const game = new Chess();
    expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(game.turn()).toBe('w');
  });

  it('should handle a valid move', () => {
    const game = new Chess();
    const move = game.move('e4');
    expect(move).toBeDefined();
    expect(game.turn()).toBe('b');
    expect(game.history()).toContain('e4');
  });

  it('should reject an invalid move', () => {
    const game = new Chess();
    expect(() => game.move('e5')).toThrow(); // e5 is not valid for white on move 1
  });

  it('should detect checkmate', () => {
    const game = new Chess();
    // Scholar's Mate
    game.move('e4');
    game.move('e5');
    game.move('Qh5');
    game.move('Nc6');
    game.move('Bc4');
    game.move('Nf6');
    game.move('Qxf7#');
    expect(game.isCheckmate()).toBe(true);
  });
});
