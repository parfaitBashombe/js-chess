import { createInitialBoard, cloneBoard } from "../board/setup.js";
import { applyMoveToBoard } from "../board/apply-move.js";
import { hashBoard } from "./transposition.js";

const sq = (file, rank) => ({ row: 8 - rank, col: file.charCodeAt(0) - 97 });
const mv = (f1, r1, f2, r2) => ({ from: sq(f1, r1), to: sq(f2, r2) });
const castleK = (color) => {
  const rank = color === "white" ? 1 : 8;
  return { from: sq("e", rank), to: { ...sq("g", rank), special: "castleKing" } };
};
const castleQ = (color) => {
  const rank = color === "white" ? 1 : 8;
  return { from: sq("e", rank), to: { ...sq("c", rank), special: "castleQueen" } };
};

const BOOK_LINES = [

  // ── e4 openings ──────────────────────────────────────────────────────────────

  // Italian — Giuoco Piano
  // 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.O-O Nf6 5.d3 O-O 6.c3 d6 7.Re1 a6 8.Nbd2 Ba7 9.Nf1 Ne7 10.Ng3 Ng6
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("f",1,"c",4), mv("f",8,"c",5),
    castleK("white"), mv("g",8,"f",6),
    mv("d",2,"d",3), castleK("black"),
    mv("c",2,"c",3), mv("d",7,"d",6),
    mv("f",1,"e",1), mv("a",7,"a",6),
    mv("b",1,"d",2), mv("c",5,"a",7),
    mv("d",2,"f",1), mv("c",6,"e",7),
    mv("f",1,"g",3), mv("e",7,"g",6),
  ],

  // Italian — Two Knights
  // 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.d3 Bc5 5.c3 d6 6.O-O O-O 7.Bb3 a6 8.Nbd2 Ba7
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("f",1,"c",4), mv("g",8,"f",6),
    mv("d",2,"d",3), mv("f",8,"c",5),
    mv("c",2,"c",3), mv("d",7,"d",6),
    castleK("white"), castleK("black"),
    mv("c",4,"b",3), mv("a",7,"a",6),
    mv("b",1,"d",2), mv("c",5,"a",7),
  ],

  // Ruy Lopez — Morphy Defence (main line)
  // 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 d6 8.c3 O-O
  // 9.h3 Na5 10.Bc2 c5 11.d4 Qc7 12.Nbd2 Nc6
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("f",1,"b",5), mv("a",7,"a",6),
    mv("b",5,"a",4), mv("g",8,"f",6),
    castleK("white"), mv("f",8,"e",7),
    mv("f",1,"e",1), mv("b",7,"b",5),
    mv("a",4,"b",3), mv("d",7,"d",6),
    mv("c",2,"c",3), castleK("black"),
    mv("h",2,"h",3), mv("c",6,"a",5),
    mv("b",3,"c",2), mv("c",7,"c",5),
    mv("d",2,"d",4), mv("d",8,"c",7),
    mv("b",1,"d",2), mv("a",5,"c",6),
  ],

  // Ruy Lopez — Berlin Defence
  // 1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6 4.O-O Nxe4 5.d4 Nd6 6.Bxc6 dxc6 7.dxe5 Nf5 8.Qxd8+ Kxd8 9.Nc3 Bd7
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("f",1,"b",5), mv("g",8,"f",6),
    castleK("white"), mv("f",6,"e",4),
    mv("d",2,"d",4), mv("e",4,"d",6),
    mv("b",5,"c",6), mv("d",7,"c",6),
    mv("d",4,"e",5), mv("d",6,"f",5),
    mv("d",1,"d",8), mv("e",8,"d",8),
    mv("b",1,"c",3), mv("c",8,"d",7),
  ],

  // Ruy Lopez — Exchange Variation
  // 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 dxc6 5.O-O f6 6.d4 exd4 7.Nxd4 c5 8.Nb3 Qxd1 9.Rxd1 Bg4
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("f",1,"b",5), mv("a",7,"a",6),
    mv("b",5,"c",6), mv("d",7,"c",6),
    castleK("white"), mv("f",7,"f",6),
    mv("d",2,"d",4), mv("e",5,"d",4),
    mv("f",3,"d",4), mv("c",6,"c",5),
    mv("d",4,"b",3), mv("d",8,"d",1),
    mv("f",1,"d",1), mv("c",8,"g",4),
  ],

  // Scotch — Classical
  // 1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4 Bc5 5.Be3 Qf6 6.c3 Nge7 7.Bc4 O-O 8.O-O Bb6 9.Nbd2 d6 10.Nb3 Na5
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("d",2,"d",4), mv("e",5,"d",4),
    mv("f",3,"d",4), mv("f",8,"c",5),
    mv("c",1,"e",3), mv("d",8,"f",6),
    mv("c",2,"c",3), mv("g",8,"e",7),
    mv("f",1,"c",4), castleK("black"),
    castleK("white"), mv("c",5,"b",6),
    mv("b",1,"d",2), mv("d",7,"d",6),
    mv("d",2,"b",3), mv("c",6,"a",5),
  ],

  // Scotch — Schmidt Variation
  // 1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4 Nf6 5.Nc3 Bb4 6.Nxc6 bxc6 7.Bd3 d5 8.exd5 cxd5 9.O-O O-O 10.Bg5 c6
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("d",2,"d",4), mv("e",5,"d",4),
    mv("f",3,"d",4), mv("g",8,"f",6),
    mv("b",1,"c",3), mv("f",8,"b",4),
    mv("d",4,"c",6), mv("b",7,"c",6),
    mv("f",1,"d",3), mv("d",7,"d",5),
    mv("e",4,"d",5), mv("c",6,"d",5),
    castleK("white"), castleK("black"),
    mv("c",1,"g",5), mv("c",7,"c",6),
  ],

  // King's Gambit — Accepted, Becker Defence
  // 1.e4 e5 2.f4 exf4 3.Nf3 d5 4.exd5 Nf6 5.Bc4 Nxd5 6.O-O Be6 7.Bb3 Nd7 8.d4 N7f6 9.Ne5 Bd6
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("f",2,"f",4), mv("e",5,"f",4),
    mv("g",1,"f",3), mv("d",7,"d",5),
    mv("e",4,"d",5), mv("g",8,"f",6),
    mv("f",1,"c",4), mv("f",6,"d",5),
    castleK("white"), mv("c",8,"e",6),
    mv("c",4,"b",3), mv("b",8,"d",7),
    mv("d",2,"d",4), mv("d",7,"f",6),
    mv("f",3,"e",5), mv("f",8,"d",6),
  ],

  // Petrov Defence — Classical
  // 1.e4 e5 2.Nf3 Nf6 3.Nxe5 d6 4.Nf3 Nxe4 5.d4 d5 6.Bd3 Be7 7.O-O O-O 8.Re1 Nd7 9.c4 c6 10.cxd5 cxd5
  [
    mv("e",2,"e",4), mv("e",7,"e",5),
    mv("g",1,"f",3), mv("g",8,"f",6),
    mv("f",3,"e",5), mv("d",7,"d",6),
    mv("e",5,"f",3), mv("f",6,"e",4),
    mv("d",2,"d",4), mv("d",6,"d",5),
    mv("f",1,"d",3), mv("f",8,"e",7),
    castleK("white"), castleK("black"),
    mv("f",1,"e",1), mv("b",8,"d",7),
    mv("c",2,"c",4), mv("c",7,"c",6),
    mv("c",4,"d",5), mv("c",6,"d",5),
  ],

  // Sicilian — Najdorf
  // 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Be3 e5 7.Nb3 Be6 8.f3 Be7 9.Qd2 O-O 10.O-O-O Nbd7 11.g4
  [
    mv("e",2,"e",4), mv("c",7,"c",5),
    mv("g",1,"f",3), mv("d",7,"d",6),
    mv("d",2,"d",4), mv("c",5,"d",4),
    mv("f",3,"d",4), mv("g",8,"f",6),
    mv("b",1,"c",3), mv("a",7,"a",6),
    mv("c",1,"e",3), mv("e",7,"e",5),
    mv("d",4,"b",3), mv("c",8,"e",6),
    mv("f",2,"f",3), mv("f",8,"e",7),
    mv("d",1,"d",2), castleK("black"),
    castleQ("white"), mv("b",8,"d",7),
    mv("g",2,"g",4), mv("b",7,"b",5),
  ],

  // Sicilian — Dragon
  // 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6 6.Be3 Bg7 7.f3 O-O 8.Qd2 Nc6 9.O-O-O d5 10.exd5 Nxd5
  [
    mv("e",2,"e",4), mv("c",7,"c",5),
    mv("g",1,"f",3), mv("d",7,"d",6),
    mv("d",2,"d",4), mv("c",5,"d",4),
    mv("f",3,"d",4), mv("g",8,"f",6),
    mv("b",1,"c",3), mv("g",7,"g",6),
    mv("c",1,"e",3), mv("f",8,"g",7),
    mv("f",2,"f",3), castleK("black"),
    mv("d",1,"d",2), mv("b",8,"c",6),
    castleQ("white"), mv("d",6,"d",5),
    mv("e",4,"d",5), mv("f",6,"d",5),
  ],

  // Sicilian — Scheveningen
  // 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6 6.Be2 Be7 7.O-O O-O 8.f4 Nc6 9.Be3 a6 10.a4
  [
    mv("e",2,"e",4), mv("c",7,"c",5),
    mv("g",1,"f",3), mv("d",7,"d",6),
    mv("d",2,"d",4), mv("c",5,"d",4),
    mv("f",3,"d",4), mv("g",8,"f",6),
    mv("b",1,"c",3), mv("e",7,"e",6),
    mv("f",1,"e",2), mv("f",8,"e",7),
    castleK("white"), castleK("black"),
    mv("f",2,"f",4), mv("b",8,"c",6),
    mv("c",1,"e",3), mv("a",7,"a",6),
    mv("a",2,"a",4), mv("d",8,"c",7),
  ],

  // Sicilian — Kan
  // 1.e4 c5 2.Nf3 e6 3.d4 cxd4 4.Nxd4 a6 5.Nc3 Qc7 6.Bd3 Nf6 7.O-O Bc5 8.Nb3 Be7 9.Qe2 d6 10.f4 O-O
  [
    mv("e",2,"e",4), mv("c",7,"c",5),
    mv("g",1,"f",3), mv("e",7,"e",6),
    mv("d",2,"d",4), mv("c",5,"d",4),
    mv("f",3,"d",4), mv("a",7,"a",6),
    mv("b",1,"c",3), mv("d",8,"c",7),
    mv("f",1,"d",3), mv("g",8,"f",6),
    castleK("white"), mv("f",8,"c",5),
    mv("d",4,"b",3), mv("c",5,"e",7),
    mv("d",1,"e",2), mv("d",7,"d",6),
    mv("f",2,"f",4), castleK("black"),
  ],

  // French Defence — Winawer
  // 1.e4 e6 2.d4 d5 3.Nc3 Bb4 4.e5 c5 5.a3 Bxc3+ 6.bxc3 Ne7 7.Qg4 O-O 8.Nf3 Nc6 9.Bd3 Qc7 10.O-O f6
  [
    mv("e",2,"e",4), mv("e",7,"e",6),
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("b",1,"c",3), mv("f",8,"b",4),
    mv("e",4,"e",5), mv("c",7,"c",5),
    mv("a",2,"a",3), mv("b",4,"c",3),
    mv("b",2,"c",3), mv("g",8,"e",7),
    mv("d",1,"g",4), castleK("black"),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("f",1,"d",3), mv("d",8,"c",7),
    castleK("white"), mv("f",7,"f",6),
  ],

  // French Defence — Classical
  // 1.e4 e6 2.d4 d5 3.Nc3 Nf6 4.Bg5 Be7 5.e5 Nfd7 6.Bxe7 Qxe7 7.f4 O-O 8.Nf3 c5 9.dxc5 Nc6 10.Bb5 Nxc5
  [
    mv("e",2,"e",4), mv("e",7,"e",6),
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("b",1,"c",3), mv("g",8,"f",6),
    mv("c",1,"g",5), mv("f",8,"e",7),
    mv("e",4,"e",5), mv("f",6,"d",7),
    mv("g",5,"e",7), mv("d",8,"e",7),
    mv("f",2,"f",4), castleK("black"),
    mv("g",1,"f",3), mv("c",7,"c",5),
    mv("d",4,"c",5), mv("b",8,"c",6),
    mv("f",1,"b",5), mv("c",6,"c",5),
  ],

  // French Defence — Advance
  // 1.e4 e6 2.d4 d5 3.e5 c5 4.c3 Nc6 5.Nf3 Qb6 6.Bd3 cxd4 7.cxd4 Bd7 8.O-O Nxd4 9.Nxd4 Qxd4 10.Nbd2
  [
    mv("e",2,"e",4), mv("e",7,"e",6),
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("e",4,"e",5), mv("c",7,"c",5),
    mv("c",2,"c",3), mv("b",8,"c",6),
    mv("g",1,"f",3), mv("d",8,"b",6),
    mv("f",1,"d",3), mv("c",5,"d",4),
    mv("c",3,"d",4), mv("c",8,"d",7),
    castleK("white"), mv("c",6,"d",4),
    mv("f",3,"d",4), mv("b",6,"d",4),
    mv("b",1,"d",2), mv("d",4,"e",5),
  ],

  // Caro-Kann — Classical
  // 1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6 6.Nf3 Nd7 7.h4 h6 8.Bd3 Bxd3 9.Qxd3 e6 10.Bd2 Ngf6 11.O-O-O Be7
  [
    mv("e",2,"e",4), mv("c",7,"c",6),
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("b",1,"c",3), mv("d",5,"e",4),
    mv("c",3,"e",4), mv("c",8,"f",5),
    mv("e",4,"g",3), mv("f",5,"g",6),
    mv("g",1,"f",3), mv("b",8,"d",7),
    mv("h",2,"h",4), mv("h",7,"h",6),
    mv("f",1,"d",3), mv("g",6,"d",3),
    mv("d",1,"d",3), mv("e",7,"e",6),
    mv("c",1,"d",2), mv("g",8,"f",6),
    castleQ("white"), mv("f",8,"e",7),
  ],

  // Caro-Kann — Advance
  // 1.e4 c6 2.d4 d5 3.e5 Bf5 4.Nf3 e6 5.Be2 Nd7 6.O-O Ne7 7.Nbd2 Bg6 8.Nb3 Nf5 9.Nfd4 Nxd4 10.Nxd4 Be7
  [
    mv("e",2,"e",4), mv("c",7,"c",6),
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("e",4,"e",5), mv("c",8,"f",5),
    mv("g",1,"f",3), mv("e",7,"e",6),
    mv("f",1,"e",2), mv("b",8,"d",7),
    castleK("white"), mv("g",8,"e",7),
    mv("b",1,"d",2), mv("f",5,"g",6),
    mv("d",2,"b",3), mv("e",7,"f",5),
    mv("f",3,"d",4), mv("f",5,"d",4),
    mv("b",3,"d",4), mv("f",8,"e",7),
  ],

  // Pirc Defence — Austrian Attack
  // 1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.f4 Bg7 5.Nf3 O-O 6.Bd3 Na6 7.O-O c5 8.d5 Nc7 9.a4 b6 10.h3
  [
    mv("e",2,"e",4), mv("d",7,"d",6),
    mv("d",2,"d",4), mv("g",8,"f",6),
    mv("b",1,"c",3), mv("g",7,"g",6),
    mv("f",2,"f",4), mv("f",8,"g",7),
    mv("g",1,"f",3), castleK("black"),
    mv("f",1,"d",3), mv("b",8,"a",6),
    castleK("white"), mv("c",7,"c",5),
    mv("d",4,"d",5), mv("a",6,"c",7),
    mv("a",2,"a",4), mv("b",7,"b",6),
    mv("h",2,"h",3), mv("a",7,"a",6),
  ],

  // ── d4 openings ───────���──────────────────────────────────────────────────────

  // QGD — Orthodox
  // 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7 5.e3 O-O 6.Nf3 Nbd7 7.Rc1 c6 8.Bd3 dxc4 9.Bxc4 Nd5 10.Bxe7 Qxe7
  [
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("c",2,"c",4), mv("e",7,"e",6),
    mv("b",1,"c",3), mv("g",8,"f",6),
    mv("c",1,"g",5), mv("f",8,"e",7),
    mv("e",2,"e",3), castleK("black"),
    mv("g",1,"f",3), mv("b",8,"d",7),
    mv("a",1,"c",1), mv("c",7,"c",6),
    mv("f",1,"d",3), mv("d",5,"c",4),
    mv("d",3,"c",4), mv("f",6,"d",5),
    mv("g",5,"e",7), mv("d",8,"e",7),
  ],

  // QGD — Tartakower Variation
  // 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7 5.e3 O-O 6.Nf3 h6 7.Bh4 b6 8.Bd3 Bb7 9.O-O Nbd7 10.Qe2 c5
  [
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("c",2,"c",4), mv("e",7,"e",6),
    mv("b",1,"c",3), mv("g",8,"f",6),
    mv("c",1,"g",5), mv("f",8,"e",7),
    mv("e",2,"e",3), castleK("black"),
    mv("g",1,"f",3), mv("h",7,"h",6),
    mv("g",5,"h",4), mv("b",7,"b",6),
    mv("f",1,"d",3), mv("c",8,"b",7),
    castleK("white"), mv("b",8,"d",7),
    mv("d",1,"e",2), mv("c",7,"c",5),
  ],

  // Queen's Gambit Accepted
  // 1.d4 d5 2.c4 dxc4 3.Nf3 Nf6 4.e3 e6 5.Bxc4 c5 6.O-O a6 7.dxc5 Qxd1 8.Rxd1 Bxc5 9.Nbd2 Nc6 10.b3
  [
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("c",2,"c",4), mv("d",5,"c",4),
    mv("g",1,"f",3), mv("g",8,"f",6),
    mv("e",2,"e",3), mv("e",7,"e",6),
    mv("f",1,"c",4), mv("c",7,"c",5),
    castleK("white"), mv("a",7,"a",6),
    mv("d",4,"c",5), mv("d",8,"d",1),
    mv("f",1,"d",1), mv("f",8,"c",5),
    mv("b",1,"d",2), mv("b",8,"c",6),
    mv("b",2,"b",3), mv("b",7,"b",5),
  ],

  // Slav Defence — Main Line
  // 1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4 5.a4 Bf5 6.e3 e6 7.Bxc4 Bb4 8.O-O O-O 9.Qe2 Nbd7 10.e4 Bg6
  [
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("c",2,"c",4), mv("c",7,"c",6),
    mv("g",1,"f",3), mv("g",8,"f",6),
    mv("b",1,"c",3), mv("d",5,"c",4),
    mv("a",2,"a",4), mv("c",8,"f",5),
    mv("e",2,"e",3), mv("e",7,"e",6),
    mv("f",1,"c",4), mv("f",8,"b",4),
    castleK("white"), castleK("black"),
    mv("d",1,"e",2), mv("b",8,"d",7),
    mv("e",3,"e",4), mv("f",5,"g",6),
  ],

  // King's Indian Defence — Classical
  // 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O 6.Be2 e5 7.O-O Nc6 8.d5 Ne7 9.Ne1 Nd7 10.Nd3 f5
  [
    mv("d",2,"d",4), mv("g",8,"f",6),
    mv("c",2,"c",4), mv("g",7,"g",6),
    mv("b",1,"c",3), mv("f",8,"g",7),
    mv("e",2,"e",4), mv("d",7,"d",6),
    mv("g",1,"f",3), castleK("black"),
    mv("f",1,"e",2), mv("e",7,"e",5),
    castleK("white"), mv("b",8,"c",6),
    mv("d",4,"d",5), mv("c",6,"e",7),
    mv("f",3,"e",1), mv("e",7,"d",7),
    mv("e",1,"d",3), mv("f",7,"f",5),
  ],

  // King's Indian — Sämisch
  // 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.f3 O-O 6.Be3 e5 7.d5 c6 8.Qd2 cxd5 9.cxd5 Nbd7 10.O-O-O a6
  [
    mv("d",2,"d",4), mv("g",8,"f",6),
    mv("c",2,"c",4), mv("g",7,"g",6),
    mv("b",1,"c",3), mv("f",8,"g",7),
    mv("e",2,"e",4), mv("d",7,"d",6),
    mv("f",2,"f",3), castleK("black"),
    mv("c",1,"e",3), mv("e",7,"e",5),
    mv("d",4,"d",5), mv("c",7,"c",6),
    mv("d",1,"d",2), mv("c",6,"d",5),
    mv("c",4,"d",5), mv("b",8,"d",7),
    castleQ("white"), mv("a",7,"a",6),
  ],

  // Nimzo-Indian — Classical
  // 1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.Qc2 O-O 5.a3 Bxc3+ 6.Qxc3 b6 7.Bg5 Bb7 8.e3 d6 9.Nf3 Nbd7 10.Be2 c5
  [
    mv("d",2,"d",4), mv("g",8,"f",6),
    mv("c",2,"c",4), mv("e",7,"e",6),
    mv("b",1,"c",3), mv("f",8,"b",4),
    mv("d",1,"c",2), castleK("black"),
    mv("a",2,"a",3), mv("b",4,"c",3),
    mv("c",2,"c",3), mv("b",7,"b",6),
    mv("c",1,"g",5), mv("c",8,"b",7),
    mv("e",2,"e",3), mv("d",7,"d",6),
    mv("g",1,"f",3), mv("b",8,"d",7),
    mv("f",1,"e",2), mv("c",7,"c",5),
  ],

  // Nimzo-Indian — Rubinstein
  // 1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 O-O 5.Bd3 d5 6.Nf3 c5 7.O-O dxc4 8.Bxc4 cxd4 9.exd4 Nbd7 10.Bg5 Nb6
  [
    mv("d",2,"d",4), mv("g",8,"f",6),
    mv("c",2,"c",4), mv("e",7,"e",6),
    mv("b",1,"c",3), mv("f",8,"b",4),
    mv("e",2,"e",3), castleK("black"),
    mv("f",1,"d",3), mv("d",7,"d",5),
    mv("g",1,"f",3), mv("c",7,"c",5),
    castleK("white"), mv("d",5,"c",4),
    mv("d",3,"c",4), mv("c",5,"d",4),
    mv("e",3,"d",4), mv("b",8,"d",7),
    mv("c",1,"g",5), mv("d",7,"b",6),
  ],

  // Grünfeld Defence — Exchange Variation
  // 1.d4 Nf6 2.c4 g6 3.Nc3 d5 4.cxd5 Nxd5 5.e4 Nxc3 6.bxc3 Bg7 7.Nf3 c5 8.Be3 O-O 9.Qd2 Bg4 10.Rc1 Nc6
  [
    mv("d",2,"d",4), mv("g",8,"f",6),
    mv("c",2,"c",4), mv("g",7,"g",6),
    mv("b",1,"c",3), mv("d",7,"d",5),
    mv("c",4,"d",5), mv("f",6,"d",5),
    mv("e",2,"e",4), mv("d",5,"c",3),
    mv("b",2,"c",3), mv("f",8,"g",7),
    mv("g",1,"f",3), mv("c",7,"c",5),
    mv("c",1,"e",3), castleK("black"),
    mv("d",1,"d",2), mv("c",8,"g",4),
    mv("a",1,"c",1), mv("b",8,"c",6),
  ],

  // Queen's Indian Defence
  // 1.d4 Nf6 2.c4 e6 3.Nf3 b6 4.g3 Bb7 5.Bg2 Be7 6.O-O O-O 7.Nc3 Ne4 8.Qc2 Nxc3 9.Qxc3 d6 10.b3 Nd7
  [
    mv("d",2,"d",4), mv("g",8,"f",6),
    mv("c",2,"c",4), mv("e",7,"e",6),
    mv("g",1,"f",3), mv("b",7,"b",6),
    mv("g",2,"g",3), mv("c",8,"b",7),
    mv("f",1,"g",2), mv("f",8,"e",7),
    castleK("white"), castleK("black"),
    mv("b",1,"c",3), mv("f",6,"e",4),
    mv("d",1,"c",2), mv("e",4,"c",3),
    mv("c",2,"c",3), mv("d",7,"d",6),
    mv("b",2,"b",3), mv("b",8,"d",7),
  ],

  // Catalan Opening
  // 1.d4 Nf6 2.c4 e6 3.g3 d5 4.Bg2 Be7 5.Nf3 O-O 6.O-O dxc4 7.Qc2 a6 8.Qxc4 b5 9.Qc2 Bb7 10.Bd2 Nc6
  [
    mv("d",2,"d",4), mv("g",8,"f",6),
    mv("c",2,"c",4), mv("e",7,"e",6),
    mv("g",2,"g",3), mv("d",7,"d",5),
    mv("f",1,"g",2), mv("f",8,"e",7),
    mv("g",1,"f",3), castleK("black"),
    castleK("white"), mv("d",5,"c",4),
    mv("d",1,"c",2), mv("a",7,"a",6),
    mv("c",2,"c",4), mv("b",7,"b",5),
    mv("c",4,"c",2), mv("c",8,"b",7),
    mv("c",1,"d",2), mv("b",8,"c",6),
  ],

  // London System
  // 1.d4 d5 2.Nf3 Nf6 3.Bf4 e6 4.e3 Bd6 5.Bg3 O-O 6.Nbd2 c5 7.c3 Nc6 8.Bd3 Bxg3 9.hxg3 Qd6 10.O-O e5
  [
    mv("d",2,"d",4), mv("d",7,"d",5),
    mv("g",1,"f",3), mv("g",8,"f",6),
    mv("c",1,"f",4), mv("e",7,"e",6),
    mv("e",2,"e",3), mv("f",8,"d",6),
    mv("f",4,"g",3), castleK("black"),
    mv("b",1,"d",2), mv("c",7,"c",5),
    mv("c",2,"c",3), mv("b",8,"c",6),
    mv("f",1,"d",3), mv("d",6,"g",3),
    mv("h",2,"g",3), mv("d",8,"d",6),
    castleK("white"), mv("e",6,"e",5),
  ],

  // ── Other openings ───────────────────────────────────────────────────────────

  // English Opening — Four Knights
  // 1.c4 e5 2.Nc3 Nf6 3.Nf3 Nc6 4.g3 Bb4 5.Bg2 O-O 6.O-O Re8 7.d3 Bxc3 8.bxc3 d5 9.cxd5 Qxd5 10.e4
  [
    mv("c",2,"c",4), mv("e",7,"e",5),
    mv("b",1,"c",3), mv("g",8,"f",6),
    mv("g",1,"f",3), mv("b",8,"c",6),
    mv("g",2,"g",3), mv("f",8,"b",4),
    mv("f",1,"g",2), castleK("black"),
    castleK("white"), mv("f",8,"e",8),
    mv("d",2,"d",3), mv("b",4,"c",3),
    mv("b",2,"c",3), mv("d",7,"d",5),
    mv("c",4,"d",5), mv("d",8,"d",5),
    mv("e",2,"e",4), mv("d",5,"d",6),
  ],

  // English — Symmetrical
  // 1.c4 c5 2.Nf3 Nf6 3.Nc3 d5 4.cxd5 Nxd5 5.g3 Nc6 6.Bg2 g6 7.O-O Bg7 8.d3 O-O 9.Nd2 Nc7 10.Nc4
  [
    mv("c",2,"c",4), mv("c",7,"c",5),
    mv("g",1,"f",3), mv("g",8,"f",6),
    mv("b",1,"c",3), mv("d",7,"d",5),
    mv("c",4,"d",5), mv("f",6,"d",5),
    mv("g",2,"g",3), mv("b",8,"c",6),
    mv("f",1,"g",2), mv("g",7,"g",6),
    castleK("white"), mv("f",8,"g",7),
    mv("d",2,"d",3), castleK("black"),
    mv("b",1,"d",2), mv("d",5,"c",7),
    mv("d",2,"c",4), mv("c",6,"d",4),
  ],

  // Réti Opening
  // 1.Nf3 d5 2.g3 c6 3.Bg2 Bg4 4.O-O Nd7 5.d3 e5 6.Nbd2 Ngf6 7.c4 dxc4 8.dxc4 Bc5 9.b4 Bb6 10.Bb2
  [
    mv("g",1,"f",3), mv("d",7,"d",5),
    mv("g",2,"g",3), mv("c",7,"c",6),
    mv("f",1,"g",2), mv("c",8,"g",4),
    castleK("white"), mv("b",8,"d",7),
    mv("d",2,"d",3), mv("e",7,"e",5),
    mv("b",1,"d",2), mv("g",8,"f",6),
    mv("c",2,"c",4), mv("d",5,"c",4),
    mv("d",3,"c",4), mv("f",8,"c",5),
    mv("b",2,"b",4), mv("c",5,"b",6),
    mv("c",1,"b",2), mv("d",8,"e",7),
  ],

  // King's Indian Attack
  // 1.Nf3 d5 2.g3 Nf6 3.Bg2 e6 4.O-O Be7 5.d3 O-O 6.Nbd2 c5 7.e4 Nc6 8.Re1 b5 9.e5 Nd7 10.Nf1
  [
    mv("g",1,"f",3), mv("d",7,"d",5),
    mv("g",2,"g",3), mv("g",8,"f",6),
    mv("f",1,"g",2), mv("e",7,"e",6),
    castleK("white"), mv("f",8,"e",7),
    mv("d",2,"d",3), castleK("black"),
    mv("b",1,"d",2), mv("c",7,"c",5),
    mv("e",2,"e",4), mv("b",8,"c",6),
    mv("f",1,"e",1), mv("b",7,"b",5),
    mv("e",4,"e",5), mv("f",6,"d",7),
    mv("d",2,"f",1), mv("a",7,"a",5),
  ],
];

const buildBook = () => {
  const book = new Map();

  for (const line of BOOK_LINES) {
    let board           = createInitialBoard();
    let colorToMove     = "white";
    let enPassantTarget = null;

    for (let i = 0; i < line.length - 1; i++) {
      const { from, to } = line[i];
      const hash = hashBoard(board, colorToMove, enPassantTarget);

      if (!book.has(hash)) {
        book.set(hash, line[i]);
      }

      board = cloneBoard(board);
      const movingPiece = board[from.row][from.col];
      const boardMove = {
        row: to.row,
        col: to.col,
        capture: !!board[to.row][to.col],
        ...(to.special ? { special: to.special } : {}),
      };
      applyMoveToBoard(board, from.row, from.col, boardMove);

      enPassantTarget = null;
      if (movingPiece?.type === "pawn" && Math.abs(to.row - from.row) === 2) {
        enPassantTarget = {
          row: (from.row + to.row) / 2,
          col: from.col,
          capturedRow: to.row,
          capturedCol: from.col,
        };
      }

      colorToMove = colorToMove === "white" ? "black" : "white";
    }
  }

  return book;
};

const book = buildBook();

export const getBookMove = (board, colorToMove, enPassantTarget) => {
  const hash  = hashBoard(board, colorToMove, enPassantTarget);
  const entry = book.get(hash);
  if (!entry) return null;

  const { from, to } = entry;
  const capture = !!(board[to.row][to.col] && board[to.row][to.col].color !== colorToMove);
  return { from, to: { ...to, capture } };
};
