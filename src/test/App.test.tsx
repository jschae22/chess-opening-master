import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import React from 'react';
import { Chess } from 'chess.js';
import { fetchOpenings } from '../services/openingsApi';
import type { Opening } from '../constants/openings';

/** Compute the FEN produced by replaying a sequence of SAN moves from the starting position. */
function fenAfter(...moves: string[]): string {
  const g = new Chess();
  for (const m of moves) g.move(m);
  return g.fen();
}

// Track Chessboard component instantiations
let chessboardInstances: any[] = [];
let capturedChessboardProps: any = null;

// Mock the services to avoid actual API calls
vi.mock('../services/chatApi', () => ({
  chatWithCoach: vi.fn().mockResolvedValue('Mocked coach response'),
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
    vi.mocked(fetchOpenings).mockResolvedValue([]);
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

  // ============ ERROR / LOADING UX TESTS ============

  describe('Error and Loading UX', () => {
    it('shows an error message in the sidebar when openings fail to load', async () => {
      vi.mocked(fetchOpenings).mockRejectedValueOnce(new Error('Network error'));
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText(/Could not load openings/i)).toBeInTheDocument();
      });
    });

    it('does not show an error message when openings load successfully', async () => {
      render(<App />);
      await act(async () => {});
      expect(screen.queryByText(/Could not load openings/i)).not.toBeInTheDocument();
    });
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

  // ============ BOARD COLOUR TESTS ============

  describe('Board Colours', () => {
    it('passes CSS variable references for dark and light square colours to Chessboard', () => {
      capturedChessboardProps = null;
      render(<App />);
      expect(capturedChessboardProps.darkSquareStyle).toEqual({ backgroundColor: 'var(--board-dark)' });
      expect(capturedChessboardProps.lightSquareStyle).toEqual({ backgroundColor: 'var(--board-light)' });
    });
  });

  // ============ OPENING SELECTION TESTS ============

  describe('Opening Selection', () => {
    const WHITE_OPENING: Opening = {
      name: 'Test White Opening',
      description: 'A three-move white opening.',
      side: 'white',
      moves: ['e4', 'e5', 'Nf3'],
    };
    const BLACK_OPENING: Opening = {
      name: 'Test Black Opening',
      description: 'A two-move black opening.',
      side: 'black',
      moves: ['e4', 'c5'],
    };
    const STARTING_FEN = fenAfter();

    beforeEach(() => {
      vi.mocked(fetchOpenings).mockResolvedValue([WHITE_OPENING, BLACK_OPENING]);
    });

    async function clickOpening(name: string) {
      capturedChessboardProps = null;
      render(<App />);
      await waitFor(() => expect(screen.getByText(name)).toBeInTheDocument());
      await act(async () => { fireEvent.click(screen.getByText(name)); });
    }

    it('back button is disabled before any opening is loaded', async () => {
      render(<App />);
      await act(async () => {});
      expect(screen.getByTitle(/Go Back/i)).toBeDisabled();
    });

    it('forward button is disabled before any opening is loaded', async () => {
      render(<App />);
      await act(async () => {});
      expect(screen.getByTitle(/Go Forward/i)).toBeDisabled();
    });

    it('updates the board to the opening final position after selecting an opening', async () => {
      await clickOpening('Test White Opening');
      expect(capturedChessboardProps.position).toBe(fenAfter('e4', 'e5', 'Nf3'));
    });

    it('board position differs from the starting position after selecting an opening', async () => {
      await clickOpening('Test White Opening');
      expect(capturedChessboardProps.position).not.toBe(STARTING_FEN);
    });

    it('sets board orientation to white for a white-side opening', async () => {
      await clickOpening('Test White Opening');
      expect(capturedChessboardProps.boardOrientation).toBe('white');
    });

    it('sets board orientation to black for a black-side opening', async () => {
      await clickOpening('Test Black Opening');
      expect(capturedChessboardProps.boardOrientation).toBe('black');
    });

    it('populates the move history panel with each opening move', async () => {
      await clickOpening('Test White Opening');
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('e5')).toBeInTheDocument();
      expect(screen.getByText('Nf3')).toBeInTheDocument();
    });

    it('shows the correct side to move after loading an opening', async () => {
      // e4 e5 Nf3 ends with black to move
      await clickOpening('Test White Opening');
      expect(screen.getByText(/Black's Turn/)).toBeInTheDocument();
    });

    it('gameRef reflects the opening position so dropped pieces are validated correctly', async () => {
      // After loading e4/e5/Nf3 it is black's turn — a white pawn move must be rejected
      await clickOpening('Test White Opening');
      const onDrop = capturedChessboardProps.onPieceDrop;
      let accepted: boolean;
      await act(async () => { accepted = onDrop({ sourceSquare: 'd2', targetSquare: 'd4' }); });
      expect(accepted!).toBe(false); // white can't move when it's black's turn
    });
  });

  // ============ BACK / FORWARD NAVIGATION TESTS ============

  describe('Back/Forward Navigation', () => {
    const OPENING: Opening = {
      name: 'Nav Opening',
      description: 'Navigation test opening.',
      side: 'white',
      moves: ['e4', 'e5', 'Nf3'],
    };
    const STARTING_FEN    = fenAfter();
    const FEN_AFTER_1     = fenAfter('e4');
    const FEN_AFTER_2     = fenAfter('e4', 'e5');
    const FEN_AFTER_3     = fenAfter('e4', 'e5', 'Nf3');

    beforeEach(() => {
      vi.mocked(fetchOpenings).mockResolvedValue([OPENING]);
    });

    async function renderAndLoad() {
      capturedChessboardProps = null;
      render(<App />);
      await waitFor(() => expect(screen.getByText('Nav Opening')).toBeInTheDocument());
      await act(async () => { fireEvent.click(screen.getByText('Nav Opening')); });
    }

    it('back button is enabled after loading an opening', async () => {
      await renderAndLoad();
      expect(screen.getByTitle(/Go Back/i)).not.toBeDisabled();
    });

    it('forward button is disabled when at the latest move', async () => {
      await renderAndLoad();
      expect(screen.getByTitle(/Go Forward/i)).toBeDisabled();
    });

    it('going back one step shows the position after move 2', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      expect(capturedChessboardProps.position).toBe(FEN_AFTER_2);
    });

    it('going back two steps shows the position after move 1', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      expect(capturedChessboardProps.position).toBe(FEN_AFTER_1);
    });

    it('going back three steps shows the starting position', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      expect(capturedChessboardProps.position).toBe(STARTING_FEN);
    });

    it('back button becomes disabled at the starting position', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      expect(screen.getByTitle(/Go Back/i)).toBeDisabled();
    });

    it('forward button becomes enabled after going back', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      expect(screen.getByTitle(/Go Forward/i)).not.toBeDisabled();
    });

    it('going forward after one back step returns to the opening final position', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Forward/i)); });
      expect(capturedChessboardProps.position).toBe(FEN_AFTER_3);
    });

    it('forward button becomes disabled again after returning to the latest move', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Forward/i)); });
      expect(screen.getByTitle(/Go Forward/i)).toBeDisabled();
    });

    it('can navigate all the way back and then all the way forward', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      expect(capturedChessboardProps.position).toBe(STARTING_FEN);

      await act(async () => { fireEvent.click(screen.getByTitle(/Go Forward/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Forward/i)); });
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Forward/i)); });
      expect(capturedChessboardProps.position).toBe(FEN_AFTER_3);
    });

    it('all opening moves remain visible in the history panel when navigated back', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('e5')).toBeInTheDocument();
      expect(screen.getByText('Nf3')).toBeInTheDocument();
    });

    it('turn indicator reflects the position at the current history index', async () => {
      await renderAndLoad(); // after Nf3 — black to move
      expect(screen.getByText(/Black's Turn/)).toBeInTheDocument();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); }); // after e5 — white to move
      expect(screen.getByText(/White's Turn/)).toBeInTheDocument();
    });
  });

  // ============ BRANCHING TESTS ============

  describe('Branching', () => {
    const OPENING: Opening = {
      name: 'Branch Opening',
      description: 'Branching test opening.',
      side: 'white',
      moves: ['e4', 'e5', 'Nf3'],
    };

    beforeEach(() => {
      vi.mocked(fetchOpenings).mockResolvedValue([OPENING]);
    });

    async function renderLoadAndGoBack() {
      capturedChessboardProps = null;
      render(<App />);
      await waitFor(() => expect(screen.getByText('Branch Opening')).toBeInTheDocument());
      await act(async () => { fireEvent.click(screen.getByText('Branch Opening')); });
      // step back one so Nf3 is in the "future"
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
    }

    it('forward button is enabled before branching (future move exists)', async () => {
      await renderLoadAndGoBack();
      expect(screen.getByTitle(/Go Forward/i)).not.toBeDisabled();
    });

    it('forward button is disabled after playing a new move from a historical position', async () => {
      await renderLoadAndGoBack();
      const onDrop = capturedChessboardProps.onPieceDrop;
      // Play d4 instead of Nf3 (it is white's turn after e4/e5)
      await act(async () => { onDrop({ sourceSquare: 'd2', targetSquare: 'd4' }); });
      expect(screen.getByTitle(/Go Forward/i)).toBeDisabled();
    });

    it('the new branch move appears in the history after branching', async () => {
      await renderLoadAndGoBack();
      const onDrop = capturedChessboardProps.onPieceDrop;
      await act(async () => { onDrop({ sourceSquare: 'd2', targetSquare: 'd4' }); });
      expect(screen.getByText('d4')).toBeInTheDocument();
    });

    it('the old future move is removed from the history after branching', async () => {
      await renderLoadAndGoBack();
      // Nf3 should be visible as a "future" move before branching
      expect(screen.getByText('Nf3')).toBeInTheDocument();
      const onDrop = capturedChessboardProps.onPieceDrop;
      await act(async () => { onDrop({ sourceSquare: 'd2', targetSquare: 'd4' }); });
      // Nf3 should be gone after branching replaces it
      expect(screen.queryByText('Nf3')).not.toBeInTheDocument();
    });

    it('the board reflects the new branch position after branching', async () => {
      await renderLoadAndGoBack();
      const onDrop = capturedChessboardProps.onPieceDrop;
      await act(async () => { onDrop({ sourceSquare: 'd2', targetSquare: 'd4' }); });
      expect(capturedChessboardProps.position).toBe(fenAfter('e4', 'e5', 'd4'));
    });
  });

  // ============ RESET WITH HISTORY TESTS ============

  describe('Reset with History', () => {
    const OPENING: Opening = {
      name: 'Reset Opening',
      description: 'Reset test opening.',
      side: 'white',
      moves: ['e4', 'e5'],
    };
    const STARTING_FEN = fenAfter();

    beforeEach(() => {
      vi.mocked(fetchOpenings).mockResolvedValue([OPENING]);
    });

    async function renderAndLoad() {
      capturedChessboardProps = null;
      render(<App />);
      await waitFor(() => expect(screen.getByText('Reset Opening')).toBeInTheDocument());
      await act(async () => { fireEvent.click(screen.getByText('Reset Opening')); });
    }

    it('back button is disabled after resetting a game with history', async () => {
      await renderAndLoad();
      expect(screen.getByTitle(/Go Back/i)).not.toBeDisabled();
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reset' })); });
      expect(screen.getByTitle(/Go Back/i)).toBeDisabled();
    });

    it('forward button is disabled after resetting a game with history', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByTitle(/Go Back/i)); });
      expect(screen.getByTitle(/Go Forward/i)).not.toBeDisabled();
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reset' })); });
      expect(screen.getByTitle(/Go Forward/i)).toBeDisabled();
    });

    it('board returns to the starting position after reset', async () => {
      await renderAndLoad();
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reset' })); });
      expect(capturedChessboardProps.position).toBe(STARTING_FEN);
    });

    it('move history is empty after reset', async () => {
      await renderAndLoad();
      expect(screen.getByText('e4')).toBeInTheDocument();
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reset' })); });
      expect(screen.queryByText('e4')).not.toBeInTheDocument();
      expect(screen.queryByText('e5')).not.toBeInTheDocument();
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
