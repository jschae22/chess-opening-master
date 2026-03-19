# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 3000
npm run build      # Production build
npm run lint       # TypeScript type checking (tsc --noEmit)
npm run test       # Run all tests with Vitest
npm run clean      # Remove dist/
```

Run a single test file:
```bash
npx vitest run src/test/game.test.ts
```

## Environment Setup

Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` with a Google Gemini API key. The app won't function without it.

## Project Vision
Read claude_env\project.md to understand the high level mission for the project and initial design vision.

## Architecture

This is a single-page React app for learning chess openings with AI coaching.

**Key data flow:**
1. User selects an opening from `src/constants/openings.ts` (9 openings defined as SAN move arrays)
2. `App.tsx` replays moves on the board using `chess.js` for validation and state
3. On each move, `src/services/gemini.ts` calls Gemini Flash to explain the move and suggest continuations
4. AI responses render in the right-side analysis panel via `react-markdown`

**Core state in `App.tsx`:**
- `chess` instance from `chess.js` — single source of truth for game state
- `chessPosition` (FEN string) — passed to `react-chessboard` for rendering
- `selectedOpening` — tracks which opening is being studied
- `moveIndex` — position within the opening's move sequence

**AI service (`src/services/gemini.ts`):**
- `explainOpeningMove(opening, move, fen)` → markdown string explanation
- `getOpeningSuggestions(fen)` → JSON array of `{move, explanation}` objects (top 3)
- Uses `gemini-2.0-flash` model

**Testing approach:**
- `src/test/setup.ts` mocks `ResizeObserver` and the entire `@google/genai` module
- Component tests use `@testing-library/react` with jsdom
- The Gemini mock returns static strings by default; override per-test as needed
