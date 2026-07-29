# Chess Arena

A fully playable chess game built from scratch with vanilla JavaScript, HTML, and CSS — no libraries, no frameworks, no build tools. Just a browser and a passion for understanding how things work under the hood.

**Live repo:** https://github.com/parfaitBashombe/js-chess

---

## Why I Built This

I built Chess Arena because I wanted to truly understand how a complex, stateful game is engineered from the ground up — not by plugging in a chess library, but by writing every single rule myself.

Chess is a perfect learning vehicle. It forces you to think about data structures (how do you represent a board?), algorithms (how do you generate every legal move without causing bugs in edge cases like en passant or pins?), AI search (how does a computer decide which move is "good"?), and UI design (how do you make all of this feel intuitive and polished?). Every part of the problem is non-trivial.

I also wanted to challenge myself to ship something real. It started as a single messy file, went through several rounds of bugfixes, a full redesign, an AI opponent, and a series of refactors — all tracked as proper feature branches and pull requests. The git history is a record of how the project grew.

---

## Features

### Game Modes

- **2 Players (local)** — two people play on the same screen, passing control back and forth. No accounts, no servers.
- **Vs Bot** — play against a chess AI with a real search engine. Four difficulty levels let you pick a challenge that matches your skill.

### Difficulty Levels

Available in Vs Bot mode:

| Level | Time limit | Opening book | Pawn structure & king safety | Random moves |
|---|---|---|---|---|
| **Beginner** | 150 ms | No | Off | 40% of moves |
| **Casual** | 400 ms | No | Off | Never |
| **Intermediate** | 900 ms | No | On | Never |
| **Hard** | 1 500 ms | Yes | On | Never |

Beginner intentionally makes random moves 40% of the time and skips structural evaluation so it feels approachable. Hard enables the full engine — opening book, pawn structure, king safety, and the longest search budget.

### Color and Side Selection

Before each game you pick your mode and choose your side: play as White, play as Black, or let the game flip a coin (Random). When you play as Black, the entire board flips so your pieces are always at the bottom.

### Full Chess Rule Set

Every standard rule is implemented correctly:

- All piece movement (pawn, knight, bishop, rook, queen, king)
- Pawn double-push on the first move
- En passant capture
- Pawn promotion (auto-promotes to queen)
- Kingside and queenside castling (with all proper conditions: king and rook must not have moved, no pieces between them, king cannot pass through check)
- Check detection and king highlighting
- Checkmate detection
- Stalemate detection (draw)

### Move Input

- **Click to move** — click a piece to see its legal squares highlighted, then click a destination
- **Drag and drop** — drag any piece to a legal square; non-legal drops are ignored

### Move History Navigation

Every position in the game is stored. The side panel includes previous/next buttons and a Live button so you can step through the entire game history without leaving the page. Clicking any entry in the move list jumps directly to that position. Navigating history is read-only — the live game is unaffected.

### Side Panel

A persistent sidebar tracks the game in real time:

- Live move history in plain English (e.g. "White Pawn e2 → e4", "White castles kingside")
- Captured pieces list for each color with a running material point total
- Current status message (whose turn, check warnings, bot thinking indicator)
- Resign button (disabled until at least one move has been made)
- New game button

### End-Game UX

When the game ends, the board stays alive for 3 seconds so both players can see the final position. Then an end screen slides in with:

- The result (checkmate, stalemate, or resignation)
- The losing king dimmed with a visual indicator
- Options to play again with the same settings or start a new game from the setup screen
- A "View board" button to dismiss the overlay and study the final position

### Visual Design

- Dark theme with a deep charcoal background and subtle green radial gradient
- Traditional green-and-cream chess board squares
- SVG chess pieces (crisp at any screen size)
- Highlighted squares for: selected piece, legal moves, captures, last move, king in check
- Animated "Game start" flash when a new game begins
- Smooth transitions and CSS animations throughout
- Space Grotesk typeface for a clean, modern feel
- Board scales responsively to fit the viewport

---

## How the Chess Engine Works

The chess logic lives entirely in the browser, split across focused modules under `js/board/`.

### Board Representation

The board is an 8×8 JavaScript array. Each cell is either `null` (empty) or an object like `{ type: "knight", color: "white", hasMoved: false }`. The `hasMoved` flag is used exclusively for castling eligibility.

### Move Generation

`js/board/move-generate.js` generates pseudo-legal moves for a piece — every square it could physically reach ignoring whether the move leaves the king in check. Each piece type has its own directional logic. Special moves (castling, en passant) are handled as separate cases and tagged with a `special` field on the move object.

### Legal Move Filtering

`js/board/legal-moves.js` takes the pseudo-legal moves and filters out any that leave the king in check. It does this by cloning the board, applying the candidate move, and checking whether the king of the moving color is under attack. This approach is simple and correct — it handles pins and discovered checks automatically because the king-in-check test scans the entire board.

### Check Detection

`js/board/check.js` implements `isKingInCheck` by finding the king's position and then asking: is any opponent piece attacking this square? It also exposes `isSquareUnderAttack`, which is used by the castling logic to verify that the king does not pass through an attacked square.

### Move Application

`js/board/apply-move.js` mutates the board in place for a given move. It handles the standard case (move piece, clear source), plus the special cases: en passant (remove the captured pawn from a different square), castling (move both king and rook), and sets `hasMoved: true` after any king or rook move.

---

## How the Bot Works

The bot runs in a **Web Worker** so it never blocks the UI. The main thread posts the board position and difficulty level; the worker searches and posts back the best move. A job ID system discards stale responses if the game changes while the bot is still thinking.

### Opening Book (Hard only)

Before searching, the bot checks `js/bot/opening-book.js` against a library of named openings (Italian, Two Knights, Ruy López, Sicilian, French, Caro-Kann, King's Indian, English, and more). If the current position matches a known line, it plays the book move instantly without any search.

### Iterative Deepening with Time Control

`js/bot/index.js` runs the search with iterative deepening: it searches depth 1, then depth 2, then depth 3, and so on, up to a maximum of 30. Each difficulty level gets a time budget (150 ms to 1 500 ms). When the budget expires mid-iteration, the bot returns the best move found in the last *completed* iteration. This guarantees the bot always has a move ready on time and uses every millisecond available to search as deep as possible.

### Minimax with Alpha-Beta Pruning

`js/bot/search.js` implements the core recursive search. At each node it generates legal moves, applies them, and recurses. The bot maximises its own score and minimises the opponent's. Alpha-beta pruning cuts branches that cannot possibly affect the final result, which dramatically reduces the search tree.

Terminal conditions:
- No legal moves and king in check: checkmate (scored with a depth bonus so the bot prefers faster mates)
- No legal moves without check: stalemate (score is 0)
- Depth reaches 0: enter quiescence search

### Quiescence Search

Instead of evaluating statically at depth 0, the bot extends the search through all available captures and checks (up to 8 additional plies). This avoids the "horizon effect" — the problem where the bot misses an obvious recapture just beyond its search depth.

### Null-Move Pruning

At non-endgame, non-check nodes the bot tries passing its turn (making a "null move") and searching to a reduced depth. If even giving the opponent a free move results in a score that exceeds beta, the position is so good that it can be safely pruned without a full search.

### Transposition Table

`js/bot/transposition.js` caches board positions using Zobrist hashing. When the search reaches a position it has already evaluated at sufficient depth, it reuses the cached result instead of re-searching. The table stores the best move found at each position, which is used by move ordering in subsequent iterations.

### Move Ordering

`js/bot/order-moves.js` sorts candidate moves before the minimax loop. Exploring good moves first makes alpha-beta pruning far more effective. The ordering priority is:

1. **Transposition table best move** — the move that scored best in a previous iteration
2. **Captures** — weighted by victim value minus attacker value (MVV-LVA; prefer taking a queen with a pawn over taking a pawn with a queen)
3. **Pawn promotions** — high bonus
4. **Killer moves** — quiet moves that caused a beta cutoff at the same depth in a sibling branch
5. **History heuristic** — quiet moves that have caused cutoffs elsewhere in the tree accumulate score proportional to `depth²`
6. **Castling** — small bonus
7. **Check-giving moves** — bonus for putting the opponent in check

### Static Evaluation

`js/bot/evaluate.js` scores a board position from the bot's perspective. It combines:

- **Material score** — each piece has a point value (pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20 000)
- **Positional bonus** — piece-square tables in `js/bot/tables.js` reward pieces for being on strategically good squares (knights near the centre, pawns pushed forward, king tucked away)
- **Mobility** — the difference in pseudo-legal move count between bot and opponent, scaled by 4 points per move
- **Check pressure** — bonus for putting the opponent in check, penalty for being in check
- **Pawn structure** *(Intermediate and Hard)* — penalises doubled pawns (−20 per extra pawn on a file) and isolated pawns (−15); rewards passed pawns with a bonus that scales with how far advanced they are
- **King safety** *(Intermediate and Hard, middlegame only)* — rewards a pawn shield in front of the king (+12 per shield pawn) and penalises enemy attacks on the 5×5 zone around the king (weighted by proximity)
- **Endgame mop-up** — when the bot has a material advantage of 200+ points in the endgame, it rewards driving the enemy king toward a corner and closing in with its own king to assist in delivering checkmate

Pawn structure and king safety are disabled on Beginner and Casual to make those levels weaker without making them obviously random.

---

## Project Structure

```
js-chess/
├── index.html                  # Single HTML shell, all DOM structure
├── styles.css                  # All styling — layout, theme, animations
├── icons/
│   ├── crown.svg               # Gold crown for end screen
│   └── crown-green.svg         # Green crown shown on winning king
├── pieces/                     # SVG piece images (wK, bQ, etc.)
└── js/
    ├── main.js                 # Event listeners, app boot
    ├── game.js                 # Game controller — state transitions, input handling
    ├── state.js                # Single shared state object
    ├── persist.js              # Save/restore game state to localStorage
    ├── board/
    │   ├── setup.js            # Initial board creation, cloneBoard
    │   ├── helpers.js          # Utility functions (oppositeColor, toSquareName, etc.)
    │   ├── move-generate.js    # Pseudo-legal move generation for each piece type
    │   ├── legal-moves.js      # Filters moves that leave king in check
    │   ├── apply-move.js       # Mutates board for a move (handles special cases)
    │   ├── castling.js         # Castling eligibility checks
    │   └── check.js            # King-in-check and square-under-attack detection
    ├── bot/
    │   ├── worker.js           # Web Worker entry point — receives message, posts back best move
    │   ├── index.js            # Bot entry point — iterative deepening with time control
    │   ├── search.js           # Minimax with alpha-beta, null-move pruning, quiescence search
    │   ├── evaluate.js         # Static board evaluation
    │   ├── order-moves.js      # Move ordering (TT move, MVV-LVA, killers, history)
    │   ├── search-state.js     # Killer move and history heuristic tables
    │   ├── transposition.js    # Zobrist hashing and transposition table
    │   ├── opening-book.js     # Named opening lines for Hard difficulty
    │   ├── next-state.js       # Produces next board state from a move (for bot use)
    │   └── tables.js           # Material scores and piece-square tables
    ├── data/
    │   ├── icons.js            # Maps piece type/color to SVG paths
    │   └── points.js           # Piece point values (used in UI for captured score)
    └── ui/
        ├── board.js            # Renders the 8x8 board and all piece/square states
        ├── panel.js            # Renders the side panel (history, captures, status)
        └── end-screen.js       # Shows the winner card after a game ends
```

---

## Game State Persistence

The game is automatically saved to `localStorage` after every move, when a new game starts, and when a player resigns. If you close the tab or refresh the page mid-game, everything is restored exactly as you left it — the board position, captured pieces, move history, whose turn it is, and which mode, color, and difficulty you were playing.

The following is saved: board, current turn, captured pieces, last move, en passant target, move history, game mode, difficulty level, player color, and game-over state. Transient UI state (selected piece, legal move highlights, bot thinking flag) is intentionally excluded and resets cleanly on restore.

If the bot was thinking when you closed the page, it picks up its turn automatically on restore.

---

## Running Locally

No build step required. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node (if you have npx)
npx serve .
```

Then open `http://localhost:8080` in your browser.

---

## Technologies Used

- **Vanilla JavaScript (ES Modules)** — no bundler, no transpiler
- **Web Workers API** — bot search runs off the main thread to keep the UI responsive
- **HTML5** — semantic markup, drag-and-drop API, ARIA attributes for accessibility
- **CSS3** — custom properties, CSS Grid, Flexbox, animations, `min()` for responsive board sizing
- **SVG** — all chess pieces are vector graphics
- **Google Fonts** — Space Grotesk

---

## Author

Parfait Bashombe — built this project to learn how real game engines work, from first principles.

GitHub: https://github.com/parfaitBashombe/js-chess
