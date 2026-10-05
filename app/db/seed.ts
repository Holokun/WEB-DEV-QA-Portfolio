import type { Game, PatchNote } from '../shared/contracts.js';

// Version 1: synthetic fixtures, not descriptions of real games or releases.
export const seedGames: readonly Game[] = [
  { id: 1, title: 'Orbit', genre: 'Action', description: 'Defend a tiny space station from drifting robots.', releaseYear: 2018, platforms: ['Windows', 'Linux'] },
  { id: 2, title: 'ORBIT', genre: 'RPG', description: 'Gather a crew and explore a ring of forgotten worlds.', releaseYear: 2020, platforms: ['Windows'] },
  { id: 3, title: 'Écho', genre: 'Puzzle', description: 'Follow sound patterns through a quiet crystal maze.', releaseYear: 2024, platforms: ['Windows', 'Linux'] },
  { id: 4, title: 'Zeta', genre: 'Strategy', description: 'Plan supply routes across a fictional frontier.', releaseYear: 2022, platforms: ['Windows'] },
  { id: 5, title: 'Ember Trail', genre: 'Adventure', description: 'Walk a lantern trail and uncover woodland stories.', releaseYear: 2021, platforms: ['Windows', 'Linux'] },
  { id: 6, title: 'Ember Quest', genre: 'RPG', description: 'Build a party to restore the valley lanterns.', releaseYear: 2023, platforms: ['Windows'] },
  { id: 7, title: 'Neon Sprint', genre: 'Racing', description: 'Race glowing circuits above a fictional city.', releaseYear: 2019, platforms: ['Windows'] },
  { id: 8, title: 'Iron Citadel', genre: 'Action', description: 'Protect a clockwork fortress with a magnetic shield.', releaseYear: 2017, platforms: ['Windows', 'Linux'] },
  { id: 9, title: 'Moss Garden', genre: 'Puzzle', description: 'Arrange stepping stones to grow an imaginary garden.', releaseYear: 2025, platforms: ['Windows'] },
  { id: 10, title: 'Atlas Tactics', genre: 'Strategy', description: 'Guide mapmakers through turn-based island expeditions.', releaseYear: 2020, platforms: ['Windows', 'Linux'] },
];
export const seedPatchNotes: readonly PatchNote[] = [
  { id: 1, gameId: 1, publishedAt: '2026-09-01', version: '1.1.0', summary: 'Added a training arena.' },
  { id: 2, gameId: 1, publishedAt: '2026-09-01', version: '1.1.1', summary: 'Fixed training arena navigation.' },
  { id: 3, gameId: 1, publishedAt: '2026-08-01', version: '1.0.0', summary: 'Initial release.' },
  { id: 4, gameId: 6, publishedAt: '2026-09-20', version: '1.2.0', summary: 'Added a quest journal.' },
];
