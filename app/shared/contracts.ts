export interface Game {
  id: number;
  title: string;
  genre: string;
  description: string;
  releaseYear: number;
  platforms: string[];
}
export interface PatchNote {
  id: number;
  gameId: number;
  version: string;
  summary: string;
  publishedAt: string;
}
export interface GameListResponse { games: Game[]; total: number; filters: { search: string; genre: string } }
export interface GameDetailResponse { game: Game }
export interface PatchNotesResponse { patchNotes: PatchNote[] }
export interface ApiErrorResponse { error: { code: string; message: string } }
