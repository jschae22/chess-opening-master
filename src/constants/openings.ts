export interface Opening {
  name: string;
  moves: string[]; // SAN moves
  description: string;
  side: 'white' | 'black';
}

export const OPENINGS: Opening[] = [
  {
    name: "Ruy Lopez",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    description: "One of the oldest and most popular openings, focusing on central control and pressure on the e5 pawn.",
    side: 'white'
  },
  {
    name: "Sicilian Defense",
    moves: ["e4", "c5"],
    description: "The most popular and best-scoring response to 1. e4, leading to asymmetrical and complex positions.",
    side: 'black'
  },
  {
    name: "French Defense",
    moves: ["e4", "e6", "d4", "d5"],
    description: "A solid and counter-attacking opening where Black challenges the center immediately.",
    side: 'black'
  },
  {
    name: "Queen's Gambit",
    moves: ["d4", "d5", "c4"],
    description: "A classic opening where White offers a pawn to gain central control and development.",
    side: 'white'
  },
  {
    name: "Caro-Kann Defense",
    moves: ["e4", "c6", "d4", "d5"],
    description: "A very solid defense for Black, often leading to endgame-oriented positions.",
    side: 'black'
  },
  {
    name: "King's Indian Defense",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    description: "A dynamic and hypermodern opening where Black allows White a large center to attack it later.",
    side: 'black'
  },
  {
    name: "Scandinavian Defense",
    moves: ["e4", "d5"],
    description: "One of the oldest recorded openings, Black immediately challenges the center.",
    side: 'black'
  },
  {
    name: "London System",
    moves: ["d4", "Nf6", "Bf4"],
    description: "A solid and flexible opening for White that can be played against almost anything Black tries.",
    side: 'white'
  },
  {
    name: "Italian Game",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    description: "A classic opening aiming for quick development and control of the center.",
    side: 'white'
  }
];
