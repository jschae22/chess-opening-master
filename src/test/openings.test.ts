import { describe, it, expect } from 'vitest';
import { OPENINGS } from '../constants/openings';

describe('Opening Constants', () => {
  it('should have a list of openings', () => {
    expect(OPENINGS.length).toBeGreaterThan(0);
  });

  it('should have valid moves for each opening', () => {
    OPENINGS.forEach(opening => {
      expect(opening.moves.length).toBeGreaterThan(0);
      expect(typeof opening.name).toBe('string');
      expect(['white', 'black']).toContain(opening.side);
    });
  });

  it('should contain the Ruy Lopez', () => {
    const ruyLopez = OPENINGS.find(o => o.name === 'Ruy Lopez');
    expect(ruyLopez).toBeDefined();
    expect(ruyLopez?.moves).toContain('Bb5');
  });
});
