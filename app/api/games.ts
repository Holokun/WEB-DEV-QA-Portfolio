import type { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import type { ApiErrorResponse, Game, GameDetailResponse, GameListResponse, PatchNote, PatchNotesResponse } from '../shared/contracts.js';

export interface ApiResult {
  status: number;
  body: GameListResponse | GameDetailResponse | PatchNotesResponse | ApiErrorResponse;
}

export function apiError(status: number, code: string, message: string): ApiResult {
  return { status, body: { error: { code, message } } };
}

const invalidQuery = () => apiError(400, 'INVALID_QUERY', 'Invalid query parameters.');
const genres = new Set(['Action', 'Adventure', 'Puzzle', 'Racing', 'RPG', 'Strategy']);
const gameColumns = 'id,title,genre,description,release_year AS releaseYear,platforms';
const foldAscii = (value: string): string => value.replace(/[A-Z]/g, letter => String.fromCharCode(letter.charCodeAt(0) + 32));

function compareTitles(a: Game, b: Game): number {
  const left = Array.from(foldAscii(a.title), character => character.codePointAt(0)!);
  const right = Array.from(foldAscii(b.title), character => character.codePointAt(0)!);
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    const difference = left[index]! - right[index]!;
    if (difference) return difference;
  }
  return left.length - right.length || a.id - b.id;
}

function readGame(row: Record<string, SQLOutputValue>): Game {
  return {
    id: row.id as number, title: row.title as string, genre: row.genre as string,
    description: row.description as string, releaseYear: row.releaseYear as number,
    platforms: JSON.parse(row.platforms as string) as string[],
  };
}

export function handleGames(url: URL, db: DatabaseSync): ApiResult | undefined {
  if (url.pathname === '/api/games') {
    const keys = [...url.searchParams.keys()];
    if (keys.some(key => key !== 'search' && key !== 'genre') || new Set(keys).size !== keys.length) return invalidQuery();
    const search = (url.searchParams.get('search') ?? '').trim();
    const genre = url.searchParams.get('genre') ?? '';
    if (Array.from(search).length > 80 || (genre !== '' && !genres.has(genre))) return invalidQuery();
    const needle = foldAscii(search);
    const games = db.prepare(`SELECT ${gameColumns} FROM games`).all().map(readGame)
      .filter(game => foldAscii(game.title).includes(needle) && (!genre || game.genre === genre))
      .sort(compareTitles);
    return { status: 200, body: { games, total: games.length, filters: { search, genre } } };
  }

  const route = /^\/api\/games\/([^/]+)(\/patch-notes)?$/.exec(url.pathname);
  if (!route) return undefined;
  const textId = route[1]!;
  const id = Number(textId);
  if (!/^[1-9][0-9]*$/.test(textId) || !Number.isSafeInteger(id)) return apiError(400, 'INVALID_ID', 'Invalid game ID.');
  if ([...url.searchParams.keys()].length) return invalidQuery();
  const row = db.prepare(`SELECT ${gameColumns} FROM games WHERE id=?`).get(id);
  if (!row) return apiError(404, 'NOT_FOUND', 'Game not found.');
  if (!route[2]) return { status: 200, body: { game: readGame(row) } };
  const patchNotes = db.prepare('SELECT id,game_id AS gameId,version,summary,published_at AS publishedAt FROM patch_notes WHERE game_id=? ORDER BY published_at DESC,id DESC').all(id) as unknown as PatchNote[];
  return { status: 200, body: { patchNotes } };
}
