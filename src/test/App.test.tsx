import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import React from 'react';

// Track Chessboard component instantiations
let chessboardInstances: any[] = [];
let capturedChessboardProps: any = null;

// Mock the services to avoid actual API calls
vi.mock('../services/gemini', () => ({
  explainOpeningMove: vi.fn().mockResolvedValue('Mocked explanation'),
  getOpeningSuggestions: vi.fn().mockResolvedValue([{ move: 'e4', explanation: 'Good move' }]),
}));

vi.mock('../services/openingsApi', () => ({
  fetchOpenings: vi.fn().mockResolvedValue([]),
}));

// Helper to get square position based on board orientation
const getSquarePosition = (square: string, orientation: 'white' | 'black') => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
  const rank = parseInt(square[1]) - 1; // 0-7

  if (orientation === 'white') {
    return {
      gridRow: 7 - rank,
      gridColumn: file,
      'data-square': square,
    };
  } else {
    return {
      gridRow: rank,
      gridColumn: 7 - file,
      'data-square': square,
    };
  }
};

// Mock react-chessboard to track instantiations
vi.mock('react-chessboard', () => ({
  Chessboard: (props: any) => {
    const options = props.options ?? {};
    capturedChessboardProps = options;

    // Track each instantiation with a unique ID
    const instanceId = Date.now() + Math.random();
    chessboardInstances.push({
      id: instanceId,
      orientation: options.boardOrientation,
      timestamp: new Date()
    });

    const startingPieces = {
      a1: 'R', b1: 'N', c1: 'B', d1: 'Q', e1: 'K', f1: 'B', g1: 'N', h1: 'R',
      a2: 'P', b2: 'P', c2: 'P', d2: 'P', e2: 'P', f2: 'P', g2: 'P', h2: 'P',
      a7: 'p', b7: 'p', c7: 'p', d7: 'p', e7: 'p', f7: 'p', g7: 'p', h7: 'p',
      a8: 'r', b8: 'n', c8: 'b', d8: 'q', e8: 'k', f8: 'b', g8: 'n', h8: 'r',
    };

    const orientation = options.boardOrientation || 'white';
    
    return React.createElement('div', {
      'data-testid': 'mock-chessboard',
      'data-instance-id': instanceId,
      'data-board-orientation': orientation,
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        position: 'relative',
      },
      children: Object.entries(startingPieces).map(([square, piece]) => {
        const pos = getSquarePosition(square, orientation);
        return React.createElement('div', {
          key: square,
          'data-testid': `piece-${square}`,
          'data-square': square,
          style: {
            gridRow: pos.gridRow + 1,
            gridColumn: pos.gridColumn + 1,
            position: 'absolute',
          },
          children: piece,
        });
      }),
    });
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    // Reset tracking state before each test
    chessboardInstances = [];
    capturedChessboardProps = null;
  });
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

  it('can reset the game', () => {
    render(<App />);
    const resetButton = screen.getByText(/Reset/i);
    fireEvent.click(resetButton);
    // Should still show initial state
    expect(screen.getByText(/View: white/i)).toBeInTheDocument();
  });

  // ============ FLIP BUTTON TESTS ============

  describe('Flip Button', () => {
    it('exists and is clickable', () => {
      render(<App />);
      const flipButton = screen.getByTitle(/Flip Board/i);
      expect(flipButton).toBeInTheDocument();
      expect(flipButton).toBeEnabled();
      expect(flipButton.tagName).toBe('BUTTON');
    });

    it('passes boardOrientation=white prop to Chessboard initially', () => {
      chessboardInstances = [];
      render(<App />);
      
      // Wait for component to render
      expect(screen.getByTestId('mock-chessboard')).toBeInTheDocument();
      
      // Verify the Chessboard received white orientation
      expect(capturedChessboardProps).not.toBeNull();
      expect(capturedChessboardProps.boardOrientation).toBe('white');
      
      // Should have exactly 1 instance
      expect(chessboardInstances.length).toBe(1);
    });

    it('creates a new Chessboard instance (unmount/remount) when flip button is clicked', async () => {
      chessboardInstances = [];
      render(<App />);

      // Wait for initial render to stabilize; capture the baseline count + last id
      await waitFor(() => expect(chessboardInstances.length).toBeGreaterThanOrEqual(1));
      const countAfterRender = chessboardInstances.length;
      const idBeforeFirstFlip = chessboardInstances[countAfterRender - 1].id;

      const flipButton = screen.getByTitle(/Flip Board/i);
      fireEvent.click(flipButton);

      // After flip, at least one new render should have occurred with black orientation
      await waitFor(() => {
        expect(chessboardInstances.length).toBeGreaterThan(countAfterRender);
        expect(capturedChessboardProps.boardOrientation).toBe('black');
      });
      const idAfterFirstFlip = chessboardInstances[chessboardInstances.length - 1].id;
      expect(idAfterFirstFlip).not.toBe(idBeforeFirstFlip);

      const countAfterFirstFlip = chessboardInstances.length;

      // Flip again - should create another new render with white orientation
      fireEvent.click(flipButton);

      await waitFor(() => {
        expect(chessboardInstances.length).toBeGreaterThan(countAfterFirstFlip);
        expect(capturedChessboardProps.boardOrientation).toBe('white');
      });
      const idAfterSecondFlip = chessboardInstances[chessboardInstances.length - 1].id;
      expect(idAfterSecondFlip).not.toBe(idAfterFirstFlip);
    });

    it('passes boardOrientation=black prop to Chessboard after flip is clicked', async () => {
      capturedChessboardProps = null;
      render(<App />);
      
      // Verify initial white orientation
      expect(capturedChessboardProps.boardOrientation).toBe('white');
      
      const flipButton = screen.getByTitle(/Flip Board/i);
      fireEvent.click(flipButton);
      
      // Wait for state update and check the prop changed
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('black');
      }, { timeout: 2000 });
    });

    it('passes boardOrientation=white prop again after flipping twice', async () => {
      capturedChessboardProps = null;
      render(<App />);
      
      const flipButton = screen.getByTitle(/Flip Board/i);
      
      // First flip: white -> black
      fireEvent.click(flipButton);
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('black');
      });
      
      // Second flip: black -> white
      fireEvent.click(flipButton);
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('white');
      });
    });

    it('updates Chessboard boardOrientation prop with each flip toggle', async () => {
      capturedChessboardProps = null;
      render(<App />);
      
      const flipButton = screen.getByTitle(/Flip Board/i);
      
      // Flip 1: white -> black
      fireEvent.click(flipButton);
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('black');
      });
      
      // Flip 2: black -> white
      fireEvent.click(flipButton);
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('white');
      });
      
      // Flip 3: white -> black
      fireEvent.click(flipButton);
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('black');
      });
      
      // Flip 4: black -> white
      fireEvent.click(flipButton);
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('white');
      });
    });

    it('chessboard receives position prop (FEN) from game state', () => {
      capturedChessboardProps = null;
      render(<App />);
      
      // Verify the Chessboard received initial position
      expect(capturedChessboardProps).not.toBeNull();
      expect(capturedChessboardProps.position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('positions rank 1 pieces at bottom when board orientation is white', () => {
      capturedChessboardProps = null;
      render(<App />);
      
      expect(screen.getByTestId('mock-chessboard')).toHaveAttribute('data-board-orientation', 'white');
      
      // In white orientation, rank 1 pieces should be at the bottom (gridRow 7)
      const e1Piece = screen.getByTestId('piece-e1');
      expect(e1Piece).toHaveStyle({ gridRow: '8' }); // gridRow 8 is row index 7 (8th row)
    });

    it('positions rank 1 pieces at top when board orientation is black', async () => {
      capturedChessboardProps = null;
      render(<App />);
      
      const flipButton = screen.getByTitle(/Flip Board/i);
      fireEvent.click(flipButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-chessboard')).toHaveAttribute('data-board-orientation', 'black');
      });
      
      // In black orientation, rank 1 pieces should be at the top (gridRow 1)
      const e1Piece = screen.getByTestId('piece-e1');
      expect(e1Piece).toHaveStyle({ gridRow: '1' }); // gridRow 1 is row index 0 (1st row)
    });

    it('positions rank 8 pieces at top when board orientation is white', () => {
      capturedChessboardProps = null;
      render(<App />);
      
      expect(screen.getByTestId('mock-chessboard')).toHaveAttribute('data-board-orientation', 'white');
      
      // In white orientation, rank 8 pieces should be at the top (gridRow 1)
      const e8Piece = screen.getByTestId('piece-e8');
      expect(e8Piece).toHaveStyle({ gridRow: '1' }); // gridRow 1 is row index 0 (1st row)
    });

    it('positions rank 8 pieces at bottom when board orientation is black', async () => {
      capturedChessboardProps = null;
      render(<App />);
      
      const flipButton = screen.getByTitle(/Flip Board/i);
      fireEvent.click(flipButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-chessboard')).toHaveAttribute('data-board-orientation', 'black');
      });
      
      // In black orientation, rank 8 pieces should be at the bottom (gridRow 8)
      const e8Piece = screen.getByTestId('piece-e8');
      expect(e8Piece).toHaveStyle({ gridRow: '8' }); // gridRow 8 is row index 7 (8th row)
    });

    it('flips pieces from white to black perspective when flip button clicked', async () => {
      chessboardInstances = [];
      render(<App />);
      
      const initialInstanceCount = chessboardInstances.length;
      expect(initialInstanceCount).toBe(1);
      const initialInstanceId = chessboardInstances[0].id;
      
      // Initial state: white perspective
      let e1Piece = screen.getByTestId('piece-e1');
      let e8Piece = screen.getByTestId('piece-e8');
      
      expect(e1Piece).toHaveStyle({ gridRow: '8' }); // e1 at bottom in white view
      expect(e8Piece).toHaveStyle({ gridRow: '1' }); // e8 at top in white view
      
      const flipButton = screen.getByTitle(/Flip Board/i);
      fireEvent.click(flipButton);
      
      await waitFor(() => {
        // A NEW Chessboard instance should have been created
        expect(chessboardInstances.length).toBe(2);
        const newInstanceId = chessboardInstances[1].id;
        expect(newInstanceId).not.toBe(initialInstanceId);
      });
      
      // After flip: black perspective
      e1Piece = screen.getByTestId('piece-e1');
      e8Piece = screen.getByTestId('piece-e8');
      
      expect(e1Piece).toHaveStyle({ gridRow: '1' }); // e1 at top in black view
      expect(e8Piece).toHaveStyle({ gridRow: '8' }); // e8 at bottom in black view
    });

    it('should only pass boardOrientation prop (not orientation) to Chessboard', () => {
      capturedChessboardProps = null;
      render(<App />);
      
      // The Chessboard should receive boardOrientation prop
      expect(capturedChessboardProps.boardOrientation).toBe('white');
      
      // The conflicting 'orientation' prop should NOT be passed
      // If it is, it would conflict with boardOrientation in the real react-chessboard
      expect(capturedChessboardProps.orientation).toBeUndefined();
    });

    it('flips between white and black with only boardOrientation prop on each flip', async () => {
      capturedChessboardProps = null;
      render(<App />);
      
      // Initial: only boardOrientation, no orientation prop
      expect(capturedChessboardProps.boardOrientation).toBe('white');
      expect(capturedChessboardProps.orientation).toBeUndefined();
      
      const flipButton = screen.getByTitle(/Flip Board/i);
      
      // First flip
      fireEvent.click(flipButton);
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('black');
      });
      expect(capturedChessboardProps.orientation).toBeUndefined();
      
      // Second flip
      fireEvent.click(flipButton);
      await waitFor(() => {
        expect(capturedChessboardProps.boardOrientation).toBe('white');
      });
      expect(capturedChessboardProps.orientation).toBeUndefined();
    });
  });

  // ============ PIECE MOVEMENT TESTS ============

  describe('Piece Movement', () => {
    it('passes onPieceDrop callback to Chessboard', () => {
      capturedChessboardProps = null;
      render(<App />);
      
      expect(capturedChessboardProps).not.toBeNull();
      expect(capturedChessboardProps.onPieceDrop).toBeDefined();
      expect(typeof capturedChessboardProps.onPieceDrop).toBe('function');
    });

    it('move history is initially empty', () => {
      render(<App />);
      
      // Move history section should exist but be empty
      expect(screen.getByText(/Moves/i)).toBeInTheDocument();
      const moveHistorySection = screen.getByText(/Moves/i).closest('div');
      
      // There should be no move entries in the history
      const moves = moveHistorySection?.querySelectorAll('[class*="grid"]');
      expect(moves?.length).toBeLessThanOrEqual(1); // Just the "Moves" label
    });

    it('persists a valid pawn move (e2 to e4) to move history after onPieceDrop', async () => {
      capturedChessboardProps = null;
      render(<App />);

      // Verify initial state
      expect(screen.getByText(/White's Turn/)).toBeInTheDocument();
      expect(capturedChessboardProps.position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      // Simulate dropping a piece (e2 to e4)
      const onDrop = capturedChessboardProps.onPieceDrop;
      let moveWasAccepted: boolean;
      await act(async () => {
        moveWasAccepted = onDrop({ sourceSquare: 'e2', targetSquare: 'e4' });
      });

      // Move should be accepted
      expect(moveWasAccepted!).toBe(true);

      // After move, position should change (FEN should be different)
      expect(capturedChessboardProps.position).not.toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      // Move history should show the move
      expect(screen.getByText(/e4/)).toBeInTheDocument();
    });

    it('shows black to move after white makes a move', async () => {
      capturedChessboardProps = null;
      render(<App />);

      expect(screen.getByText(/White's Turn/)).toBeInTheDocument();

      // Make a move
      const onDrop = capturedChessboardProps.onPieceDrop;
      await act(async () => {
        onDrop({ sourceSquare: 'e2', targetSquare: 'e4' });
      });

      // After white's move, should show black's turn
      expect(screen.queryByText(/White's Turn/)).not.toBeInTheDocument();
      expect(screen.getByText(/Black's Turn/)).toBeInTheDocument();
    });

    it('rejects invalid moves and does not update game state', () => {
      capturedChessboardProps = null;
      render(<App />);
      
      const initialPosition = capturedChessboardProps.position;
      
      // Try an invalid move (e2 to e6 - too far for a pawn)
      const onDrop = capturedChessboardProps.onPieceDrop;
      const moveWasAccepted = onDrop({ sourceSquare: 'e2', targetSquare: 'e6' });
      
      // Invalid move should be rejected
      expect(moveWasAccepted).toBe(false);
      
      // Position should not change
      expect(capturedChessboardProps.position).toBe(initialPosition);
      
      // Should still be white's turn
      expect(screen.getByText(/White's Turn/)).toBeInTheDocument();
      
      // Move should not appear in history
      expect(screen.queryByText(/e6/)).not.toBeInTheDocument();
    });

    it('allows multiple consecutive moves and persists all to history', async () => {
      capturedChessboardProps = null;
      render(<App />);

      const onDrop = capturedChessboardProps.onPieceDrop;

      // Move 1: white e2-e4
      await act(async () => { onDrop({ sourceSquare: 'e2', targetSquare: 'e4' }); });
      expect(screen.getByText(/e4/)).toBeInTheDocument();
      expect(screen.getByText(/Black's Turn/)).toBeInTheDocument();

      // Move 2: black e7-e5
      await act(async () => { onDrop({ sourceSquare: 'e7', targetSquare: 'e5' }); });
      expect(screen.getByText(/e5/)).toBeInTheDocument();
      expect(screen.getByText(/White's Turn/)).toBeInTheDocument();

      // Move 3: white Nf3
      await act(async () => { onDrop({ sourceSquare: 'g1', targetSquare: 'f3' }); });
      expect(screen.getByText(/f3|Nf3/)).toBeInTheDocument();
      expect(screen.getByText(/Black's Turn/)).toBeInTheDocument();
    });

    it('produces correct FEN position after multiple moves', async () => {
      capturedChessboardProps = null;
      render(<App />);

      const onDrop = capturedChessboardProps.onPieceDrop;

      // e2-e4
      await act(async () => { onDrop({ sourceSquare: 'e2', targetSquare: 'e4' }); });
      const afterE4 = capturedChessboardProps.position;
      expect(afterE4).toContain('PPPP1PPP'); // 7 pawns remain on rank 2 (e-pawn moved to e4)
      expect(afterE4).toContain('4P3'); // White pawn now on e4

      // e7-e5
      await act(async () => { onDrop({ sourceSquare: 'e7', targetSquare: 'e5' }); });
      const afterE5 = capturedChessboardProps.position;
      expect(afterE5).not.toBe(afterE4); // Position should have changed
    });

    it('starts with white to move', () => {
      render(<App />);
      expect(screen.getByText(/White's Turn/)).toBeInTheDocument();
    });

    it('has 32 pieces at start', () => {
      capturedChessboardProps = null;
      render(<App />);
      
      expect(capturedChessboardProps.position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });
});
