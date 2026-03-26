/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { chatWithCoach } from './services/gemini';
import { fetchOpenings } from './services/openingsApi';

const Board = Chessboard as any;

type ChatMessage = { role: 'user' | 'coach'; content: string };

export default function App() {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;
  const [chessPosition, setChessPosition] = useState(game.fen());
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [loading, setLoading] = useState(false);
  const [moveIndex, setMoveIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(true);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [openings, setOpenings] = useState<Opening[]>([]);

  useEffect(() => {
    fetchOpenings()
      .then(setOpenings)
      .catch(err => console.error('Failed to load openings:', err));
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

    // handle piece drop
  function onPieceDrop({
    sourceSquare,
    targetSquare
  }: PieceDropHandlerArgs) {
    // type narrow targetSquare potentially being null (e.g. if dropped off board)
    if (!targetSquare) {
      return false;
    }

    // try to make the move according to chess.js logic
    try {
      game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to a queen for example simplicity
      });

      // update the position state upon successful move to trigger a re-render of the chessboard
      setChessPosition(game.fen());

      // return true as the move was successful
      return true;
    } catch {
      // return false as the move was not successful
      return false;
    }
  }

  const sendChatMessage = async () => {
    const message = chatInput.trim();
    if (!message || loading) return;

    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    const response = await chatWithCoach(
      selectedOpening?.name || '',
      game.history(),
      game.fen(),
      message
    );

    setChatHistory(prev => [...prev, { role: 'coach', content: response || '' }]);
    setLoading(false);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  };

  const resetGame = () => {
    game.reset();
    setChessPosition(new Chess().fen());
    setSelectedOpening(null);
    setMoveIndex(0);
    setChatHistory([]);
  };

  const loadOpening = (opening: Opening) => {
    const newGame = new Chess();
    opening.moves.forEach(move => newGame.move(move));
    setChessPosition(newGame.fen());
    setSelectedOpening(opening);
    setMoveIndex(opening.moves.length);
    setBoardOrientation(opening.side);
  };

  const undoMove = () => {
    game.undo();
    setChessPosition(game.fen());
  };

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    id: "basicBoard",
    boardOrientation,
    darkSquareStyle: { backgroundColor: '#141414' },
    lightSquareStyle: { backgroundColor: '#E4E3E0' }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#141414] rounded-lg">
            <Trophy className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif italic font-bold tracking-tight">Chess Opening Master</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all text-sm font-medium"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-88px)]">
        {/* Left Sidebar: Openings */}
        <aside className="lg:col-span-3 border-r border-[#141414] bg-white/30 overflow-y-auto max-h-[calc(100vh-88px)]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6 opacity-50">
              <BookOpen size={18} />
              <span className="text-xs font-mono uppercase tracking-widest">Library</span>
            </div>

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
                        ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]'
                        : 'border-transparent hover:border-[#141414]/20 hover:bg-white'
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
                        ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]'
                        : 'border-transparent hover:border-[#141414]/20 hover:bg-white'
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
          <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-[#141414]">
            {
              <Chessboard key={boardOrientation} options={chessboardOptions} />
            }
          </div>

          <div className="mt-8 w-full max-w-[600px] flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={undoMove}
                className="p-3 rounded-full border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                title="Undo Move"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="p-3 rounded-full border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                title="Flip Board"
                onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
              >
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono uppercase tracking-tighter opacity-30">View: {boardOrientation}</span>
              <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-white border border-[#141414]' : 'bg-[#141414]'}`} />
              <span className="text-sm font-mono uppercase tracking-widest font-bold">
                {game.turn() === 'w' ? "White's Turn" : "Black's Turn"}
              </span>
            </div>
          </div>
        </section>

        {/* Right Panel: AI Coach & History */}
        <aside className="lg:col-span-4 border-l border-[#141414] flex flex-col bg-white/30 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#141414]">
            <button
              onClick={() => setShowHistory(false)}
              className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest transition-all ${!showHistory ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-white'}`}
            >
              AI Coach
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest transition-all ${showHistory ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-white'}`}
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
                  {game.history().map((move, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-[#141414]/10 bg-white/50">
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
                    <div className="p-4 rounded-2xl bg-[#141414] text-[#E4E3E0]">
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
                            ? 'bg-[#141414] text-[#E4E3E0] rounded-br-sm'
                            : 'bg-white border border-[#141414]/10 rounded-bl-sm prose prose-sm prose-stone max-w-none'
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
                      <div className="bg-white border border-[#141414]/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                        <span className="w-2 h-2 bg-[#141414]/30 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-[#141414]/30 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-[#141414]/30 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Chat input */}
                <div className="border-t border-[#141414]/20 p-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask the coach..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 rounded-full border border-[#141414]/20 bg-white text-sm outline-none focus:border-[#141414] transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={loading || !chatInput.trim()}
                    className="p-2.5 rounded-full bg-[#141414] text-[#E4E3E0] hover:opacity-80 transition-opacity disabled:opacity-30"
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
