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
- **Vs Bot** — play against a chess AI built with the minimax algorithm and alpha-beta pruning. The bot plays at a real but beatable level, making it a good sparring partner rather than a frustrating wall.

### Color and Side Selection

Before each game, you pick your mode and choose your side: play as White, play as Black, or let the game flip a coin (Random). When you play as Black, the entire board flips so your pieces are always at the bottom.

### Full Chess Rule Set

Every standard rule is implemented correctly:

- All piece movement (pawn, knight, bishop, rook, queen, king)
- Pawn double-push on the first move
- En passant capture
- Pawn promotion (auto-promotes to queen)
- Kingside and queenside castling (with all the proper conditions: king and rook must not have moved, no pieces between them, king cannot pass through check)
- Check detection and king highlighting
- Checkmate detection
- Stalemate detection (draw)

### Move Input

- **Click to move** — click a piece to see its legal squares highlighted, then click a destination
- **Drag and drop** — drag any piece to a legal square; non-legal drops are ignored
- **Keyboard** — every square is focusable; press Enter or Space to interact

### Side Panel

A persistent sidebar tracks the game in real time:

- Live move history in plain English (e.g. "White Pawn e2 → e4", "White castles kingside")
- Captured pieces list for each color, with a running material point total
- Current status message (whose turn, check warnings, bot thinking indicator)
- Resign button (disabled until at least one move has been made)
- New game button

### End-Game UX

When the game ends, the board stays alive for 3 seconds so both players can see the final position. Then an end screen slides in with:

- The result (checkmate, stalemate, or resignation)
- A crown on the winning king's square
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

The board is an 8x8 JavaScript array. Each cell is either `null` (empty) or an object like `{ type: "knight", color: "white", hasMoved: false }`. The `hasMoved` flag is used exclusively for castling eligibility.

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

The bot lives under `js/bot/` and uses a minimax search with alpha-beta pruning.

### Entry Point

`js/bot/index.js` is where the bot starts. It generates all legal moves for its color, picks a search depth based on how many moves are available (fewer legal moves means searching deeper is affordable), and runs minimax on each candidate move. The move with the highest score wins.

The depth adapts dynamically:

- 8 or fewer legal moves: search 5 plies deep
- 16 or fewer: search 4 plies deep
- More than 16: search 3 plies deep

### Minimax with Alpha-Beta Pruning

`js/bot/search.js` implements the core recursive search. At each node it generates legal moves, applies them, and recurses. The bot maximizes its own score and minimizes the opponent's. Alpha-beta pruning cuts branches that cannot possibly affect the final result — this dramatically reduces the number of positions the bot needs to evaluate, making deeper searches feasible without a web worker.

Terminal conditions:
- No legal moves with king in check: checkmate (score is very high or very low depending on who is checkmated)
- No legal moves without check: stalemate (score is 0)
- Depth reaches 0: evaluate the position statically

### Static Evaluation

`js/bot/evaluate.js` scores a board position from the bot's perspective. It combines:

- **Material score** — each piece has a point value (pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000)
- **Positional bonus** — piece-square tables in `js/bot/tables.js` reward pieces for being on strategically good squares (e.g. knights near the center, pawns pushed forward, king tucked to the side)
- **Mobility** — the difference in legal move count between bot and opponent, scaled by 4 points per move; more options is better
- **Check pressure** — bonus for putting the opponent in check, penalty for being in check

### Move Ordering

`js/bot/order-moves.js` sorts candidate moves before the minimax loop. Exploring good moves first makes alpha-beta pruning far more effective. Moves are scored by:

1. Captures, weighted by victim value minus attacker value (MVV-LVA heuristic — prefer taking a queen with a pawn over taking a pawn with a queen)
2. Pawn promotions (high bonus)
3. Castling (small bonus)
4. Moves that put the opponent in check (bonus)

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
    ├── board/
    │   ├── setup.js            # Initial board creation, cloneBoard
    │   ├── helpers.js          # Utility functions (oppositeColor, toSquareName, etc.)
    │   ├── move-generate.js    # Pseudo-legal move generation for each piece type
    │   ├── legal-moves.js      # Filters moves that leave king in check
    │   ├── apply-move.js       # Mutates board for a move (handles special cases)
    │   ├── castling.js         # Castling eligibility checks
    │   └── check.js            # King-in-check and square-under-attack detection
    ├── bot/
    │   ├── index.js            # Bot entry point, depth selection
    │   ├── search.js           # Minimax with alpha-beta pruning
    │   ├── evaluate.js         # Static board evaluation
    │   ├── order-moves.js      # Move ordering for pruning efficiency
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

## Development History

The project was built incrementally over a series of feature branches, each merged as a pull request:

| Branch | What was built |
|---|---|
| `ft-setup` | Initial project scaffolding |
| `ft-drag` | Drag-and-drop piece movement |
| `ft-game` | Core game logic (turns, captures, win detection) |
| `fx-pieces-mov` | Fixed movement bugs |
| `fx-logic` | Consolidated everything into one file to fix module-scope bugs |
| `ft-bot` | First version of the bot (basic move selection) |
| `ft-improved-bot` | Minimax + alpha-beta pruning, evaluation tables |
| `ft-redesign` | Full visual redesign — dark theme, SVG pieces |
| `ft-refactor` | Split monolith back into the current module structure |
| `ft-color-select` | Color/side selection, board flip, game-start flash animation |
| `ft-endgame-ux` | Winner crown, loser highlight, view board button |

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
- **HTML5** — semantic markup, drag-and-drop API, ARIA attributes for accessibility
- **CSS3** — custom properties, CSS Grid, Flexbox, animations, `min()` for responsive board sizing
- **SVG** — all chess pieces are vector graphics
- **Google Fonts** — Space Grotesk

---

## Author

Parfait Bashombe — built this project to learn how real game engines work, from first principles.

GitHub: https://github.com/parfaitBashombe/js-chess
