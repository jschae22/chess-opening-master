import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatWithCoach } from '../services/chatApi';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('chatApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the reply from the backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ reply: 'Great move! e4 controls the center.' }),
    });

    const result = await chatWithCoach('Ruy Lopez', ['e4', 'e5'], 'fen', 'What is the idea behind e4?');
    expect(result).toBe('Great move! e4 controls the center.');
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('returns a rate limit message on 429', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });

    const result = await chatWithCoach('Ruy Lopez', [], 'fen', 'Help');
    expect(result).toContain('hourly request limit');
  });

  it('returns a fallback message on other errors', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 502 });

    const result = await chatWithCoach('Ruy Lopez', [], 'fen', 'Help');
    expect(result).toContain('unavailable');
  });

  it('returns a connection error message when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await chatWithCoach('Ruy Lopez', [], 'fen', 'Help');
    expect(result).toContain('server');
  });
});
