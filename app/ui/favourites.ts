import type { Game } from '../shared/contracts.js';

const storageKey = 'game-companion:favourites';
const validId = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export interface FavouritesStore {
  ids(): readonly number[];
  has(id: number): boolean;
  toggle(id: number): void;
  validate(games: readonly Game[]): void;
  subscribe(listener: () => void): () => void;
  warning(): string;
}

export function createFavouritesStore(storage?: Storage): FavouritesStore {
  let selected: number[] = [];
  let persistenceWarning = '';
  const listeners = new Set<() => void>();
  function persist(): void {
    if (!storage) return;
    try {
      storage.setItem(storageKey, JSON.stringify(selected));
      persistenceWarning = '';
    } catch {
      persistenceWarning = 'Favourites could not be saved to browser storage. Changes are available for this visit only.';
    }
  }
  try {
    storage ??= window.localStorage;
    const raw = storage.getItem(storageKey);
    if (raw !== null) {
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { parsed = []; }
      selected = Array.isArray(parsed) ? [...new Set(parsed.filter(validId))] : [];
      if (raw !== JSON.stringify(selected)) persist();
    }
  } catch {
    // A failed read cannot establish an empty saved list. Keep this visit's
    // state in memory without overwriting storage that could not be read.
    storage = undefined;
    persistenceWarning = 'Favourites could not be read from browser storage. Changes are available for this visit only.';
  }
  function notify(): void { for (const listener of listeners) listener(); }
  return {
    ids: () => [...selected],
    has: id => selected.includes(id),
    warning: () => persistenceWarning,
    toggle(id) {
      if (!validId(id)) return;
      selected = selected.includes(id) ? selected.filter(saved => saved !== id) : [...selected, id];
      persist();
      notify();
    },
    validate(games) {
      const known = new Set(games.map(game => game.id));
      const retained = selected.filter(id => known.has(id));
      if (retained.length === selected.length) return;
      selected = retained;
      persist();
      notify();
    },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
