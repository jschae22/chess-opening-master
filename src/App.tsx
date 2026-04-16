/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, PieceDropHandlerArgs } from 'react-chessboard';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  RotateCcw,
  RefreshCw,
  Trophy,
  History,
  Info,
  BrainCircuit,
  ChevronLeft,
  Send
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Opening } from './constants/openings';
import { chatWithCoach } from './services/chatApi';
import { fetchOpenings } from './services/openingsApi';

type ChatMessage = { role: 'user' | 'coach'; content: string };

/** Replays `moves[0..index)` from the starting position and returns the resulting Chess instance. */
function buildGameAtIndex(moves: string[], index: number): Chess {
  const g = new Chess();
  for (let i = 0; i < index; i++) g.move(moves[i]);
  return g;
}

export default function App() {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;
  const [chessPosition, setChessPosition] = useState(game.fen());
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [loading, setLoading] = useState(false);
  // Full SAN move list for the current line (includes "future" moves when navigating back).
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  // How many moves from moveHistory are currently shown on the board (0 = starting position).
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(true);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [openings, setOpenings] = useState<Opening[]>([]);
  const [openingsError, setOpeningsError] = useState(false);

  useEffect(() => {
    fetchOpenings()
      .then(setOpenings)
      .catch(() => setOpeningsError(true));
  }, []);

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(400);

  // Handle responsive board size
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const width = entries[0].contentRect.width;
        setBoardWidth(Math.min(width, 600));
      }
    });

    if (boardContainerRef.current) {
      observer.observe(boardContainerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle piece drop
  function onPieceDrop({
    sourceSquare,
    targetSquare
  }: PieceDropHandlerArgs) {
    if (!targetSquare) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      // Branching: discard any "future" moves beyond the current index before appending the new move.
      const newHistory = [...moveHistory.slice(0, historyIndex), move.san];
      setMoveHistory(newHistory);
      setHistoryIndex(historyIndex + 1);
      setChessPosition(game.fen());
      return true;
    } catch {
      return false;
    }
  }

  const sendChatMessage = async () => {
    const message = chatInput.trim();
    if (!message || loading) return;

    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const response = await chatWithCoach(
        selectedOpening?.name || '',
        game.history(),
        game.fen(),
        message
      );
      setChatHistory(prev => [...prev, { role: 'coach', content: response || '' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendChatMessage();
  };

  const resetGame = () => {
    const newGame = new Chess();
    gameRef.current = newGame;
    setChessPosition(newGame.fen());
    setSelectedOpening(null);
    setMoveHistory([]);
    setHistoryIndex(0);
    setChatHistory([]);
  };

  const loadOpening = (opening: Opening) => {
    const moves = [...opening.moves];
    const newGame = buildGameAtIndex(moves, moves.length);
    gameRef.current = newGame;
    setChessPosition(newGame.fen());
    setSelectedOpening(opening);
    setMoveHistory(moves);
    setHistoryIndex(moves.length);
    setBoardOrientation(opening.side);
  };

  const goBack = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const newGame = buildGameAtIndex(moveHistory, newIndex);
    gameRef.current = newGame;
    setHistoryIndex(newIndex);
    setChessPosition(newGame.fen());
  };

  const goForward = () => {
    if (historyIndex >= moveHistory.length) return;
    const newIndex = historyIndex + 1;
    const newGame = buildGameAtIndex(moveHistory, newIndex);
    gameRef.current = newGame;
    setHistoryIndex(newIndex);
    setChessPosition(newGame.fen());
  };

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    id: "basicBoard",
    boardOrientation,
    darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
    lightSquareStyle: { backgroundColor: 'var(--board-light)' }
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] font-sans selection:bg-[var(--ink)] selection:text-[var(--surface)]">
      {/* Header */}
      <header className="border-b border-[var(--ink)] p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--ink)] rounded-lg">
            <Trophy className="text-[var(--surface)] w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif italic font-bold tracking-tight">Chess Opening Master</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--surface)] transition-all text-sm font-medium"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-88px)]">
        {/* Left Sidebar: Openings */}
        <aside className="lg:col-span-3 border-r border-[var(--ink)] bg-white/30 overflow-y-auto max-h-[calc(100vh-88px)]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6 opacity-50">
              <BookOpen size={18} />
              <span className="text-xs font-mono uppercase tracking-widest">Library</span>
            </div>

            {openingsError && (
              <div className="mb-6 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                Could not load openings. Please check your connection or try refreshing.
              </div>
            )}

            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest mb-4 opacity-50">White Openings</h3>
                <div className="space-y-2">
                  {openings.filter(o => o.side === 'white').map(opening => (
                    <button
                      key={opening.name}
                      onClick={() => loadOpening(opening)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                        selectedOpening?.name === opening.name
                        ? 'bg-[var(--ink)] text-[var(--surface)] border-[var(--ink)]'
                        : 'border-transparent hover:border-[var(--ink)]/20 hover:bg-white'
                      }`}
                    >
                      <span className="font-medium">{opening.name}</span>
                      <ChevronRight size={16} className={`transition-transform ${selectedOpening?.name === opening.name ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest mb-4 opacity-50">Black Openings</h3>
                <div className="space-y-2">
                  {openings.filter(o => o.side === 'black').map(opening => (
                    <button
                      key={opening.name}
                      onClick={() => loadOpening(opening)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                        selectedOpening?.name === opening.name
                        ? 'bg-[var(--ink)] text-[var(--surface)] border-[var(--ink)]'
                        : 'border-transparent hover:border-[var(--ink)]/20 hover:bg-white'
                      }`}
                    >
                      <span className="font-medium">{opening.name}</span>
                      <ChevronRight size={16} className={`transition-transform ${selectedOpening?.name === opening.name ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Board */}
        <section className="lg:col-span-5 p-8 flex flex-col items-center justify-start bg-white/10" ref={boardContainerRef}>
          <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-[var(--ink)]">
            <Chessboard key={boardOrientation} options={chessboardOptions} />
          </div>

          <div className="mt-8 w-full max-w-[600px] flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={goBack}
                disabled={historyIndex <= 0}
                className="p-3 rounded-full border border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--surface)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Go Back"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goForward}
                disabled={historyIndex >= moveHistory.length}
                className="p-3 rounded-full border border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--surface)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Go Forward"
              >
                <ChevronRight size={20} />
              </button>
              <button
                className="p-3 rounded-full border border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--surface)] transition-all"
                title="Flip Board"
                onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
              >
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono uppercase tracking-tighter opacity-30">View: {boardOrientation}</span>
              <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-white border border-[var(--ink)]' : 'bg-[var(--ink)]'}`} />
              <span className="text-sm font-mono uppercase tracking-widest font-bold">
                {game.turn() === 'w' ? "White's Turn" : "Black's Turn"}
              </span>
            </div>
          </div>
        </section>

        {/* Right Panel: AI Coach & History */}
        <aside className="lg:col-span-4 border-l border-[var(--ink)] flex flex-col bg-white/30 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--ink)]">
            <button
              onClick={() => setShowHistory(false)}
              className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest transition-all ${!showHistory ? 'bg-[var(--ink)] text-[var(--surface)]' : 'hover:bg-white'}`}
            >
              AI Coach
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest transition-all ${showHistory ? 'bg-[var(--ink)] text-[var(--surface)]' : 'hover:bg-white'}`}
            >
              Move History
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showHistory ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                <div className="flex items-center gap-2 mb-4 opacity-50">
                  <History size={16} />
                  <span className="text-xs font-mono uppercase tracking-widest">Moves</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {moveHistory.map((move, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2 rounded-lg border border-[var(--ink)]/10 transition-all ${
                        i < historyIndex ? 'bg-white/50' : 'bg-white/10 opacity-40'
                      } ${i === historyIndex - 1 ? 'ring-1 ring-[var(--ink)]/50' : ''}`}
                    >
                      <span className="text-[10px] font-mono opacity-30 w-4">{Math.floor(i/2) + 1}{i%2 === 0 ? '.' : '...'}</span>
                      <span className="font-mono font-bold text-sm">{move}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="coach"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Scrollable chat area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedOpening && (
                    <div className="p-4 rounded-2xl bg-[var(--ink)] text-[var(--surface)]">
                      <h2 className="text-xl font-serif italic mb-2">{selectedOpening.name}</h2>
                      <p className="text-sm opacity-80 leading-relaxed">{selectedOpening.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 opacity-50">
                    <BrainCircuit size={16} />
                    <span className="text-xs font-mono uppercase tracking-widest">Coach</span>
                  </div>

                  {chatHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                      <Info size={48} strokeWidth={1} className="mb-4" />
                      <p className="text-sm">Ask the coach anything about your position or opening.</p>
                    </div>
                  )}

                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[var(--ink)] text-[var(--surface)] rounded-br-sm'
                            : 'bg-white border border-[var(--ink)]/10 rounded-bl-sm prose prose-sm prose-stone max-w-none'
                        }`}
                      >
                        {msg.role === 'coach' ? (
                          <Markdown>{msg.content}</Markdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-[var(--ink)]/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                        <span className="w-2 h-2 bg-[var(--ink)]/30 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-[var(--ink)]/30 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-[var(--ink)]/30 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Chat input */}
                <div className="border-t border-[var(--ink)]/20 p-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask the coach..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 rounded-full border border-[var(--ink)]/20 bg-white text-sm outline-none focus:border-[var(--ink)] transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={loading || !chatInput.trim()}
                    className="p-2.5 rounded-full bg-[var(--ink)] text-[var(--surface)] hover:opacity-80 transition-opacity disabled:opacity-30"
                    title="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </main>
    </div>
  );
}
