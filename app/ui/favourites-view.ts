import type { Game, GameListResponse } from '../shared/contracts.js';
import { getJson } from './api-client.js';
import { createFavouriteButton } from './favourite-button.js';
import type { FavouritesStore } from './favourites.js';

export function mountFavourites(container: HTMLElement, options: { store: FavouritesStore; onOpenGame: (id: number) => void }): { destroy(): void } {
  const view = document.createElement('section');
  view.className = 'favourites';
  view.innerHTML = `<p class="eyebrow">YOUR COLLECTION</p><h1 tabindex="-1">Favourites</h1>
    <p class="intro">Keep your next worlds close at hand.</p>
    <p role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="request-error" role="alert" hidden><p>Could not load favourites. Please try again.</p><button type="button">Retry</button></div>
    <ul class="game-grid" aria-label="Favourite games"></ul>`;
  container.replaceChildren(view);
  const status = view.querySelector<HTMLElement>('[role=status]')!;
  const error = view.querySelector<HTMLElement>('[role=alert]')!;
  const list = view.querySelector<HTMLUListElement>('ul')!;
  const heading = view.querySelector<HTMLHeadingElement>('h1')!;
  const listeners = new AbortController();
  let request: AbortController | undefined;
  let version = 0;
  let games: readonly Game[] | undefined;
  let loading = false;
  let failed = false;

  function renderList(): void {
    const focused = document.activeElement;
    const focusedIndex = [...list.children].findIndex(item => item.contains(focused));
    const removed = focusedIndex >= 0 && !options.store.has(Number((list.children[focusedIndex] as HTMLElement).dataset.gameId));
    list.replaceChildren();
    const saved = games?.filter(game => options.store.has(game.id)) ?? [];
    for (const game of saved) {
      const card = document.createElement('li');
      card.dataset.gameId = String(game.id);
      const link = document.createElement('a');
      link.href = `/#/games/${game.id}`;
      link.tabIndex = 0;
      link.textContent = game.title;
      link.dataset.gameId = String(game.id);
      const genre = document.createElement('p');
      genre.className = 'genre';
      genre.textContent = game.genre;
      card.append(link, genre, createFavouriteButton(game, options.store));
      list.append(card);
    }
    if (loading) status.textContent = 'Loading favourites…';
    else if (failed) status.textContent = `${options.store.ids().length} saved favourites retained. Try loading again.`;
    else if (games) status.textContent = saved.length ? `${saved.length} favourite${saved.length === 1 ? '' : 's'}` : 'No favourites yet. Add games from the Library.';
    if (removed) {
      const next = list.children[Math.min(focusedIndex, list.children.length - 1)];
      (next?.querySelector<HTMLButtonElement>('button') ?? heading).focus();
    } else if (focusedIndex >= 0) {
      // Another state update may recreate a retained card. Preserve its control.
      const id = (focused?.closest('li') as HTMLElement | null)?.dataset.gameId;
      const retained = [...list.children].find(item => (item as HTMLElement).dataset.gameId === id);
      retained?.querySelector<HTMLElement>(focused instanceof HTMLButtonElement ? 'button' : 'a')?.focus();
    }
  }
  const unsubscribe = options.store.subscribe(renderList);

  async function load(): Promise<void> {
    const current = ++version;
    request?.abort();
    request = new AbortController();
    loading = true;
    failed = false;
    error.hidden = true;
    renderList();
    try {
      const data = await getJson<GameListResponse>('/api/games', request.signal);
      if (current !== version) return;
      games = data.games;
      options.store.validate(games);
      loading = false;
      renderList();
    } catch {
      if (current !== version) return;
      loading = false;
      failed = true;
      error.hidden = false;
      renderList();
    }
  }
  error.querySelector('button')!.addEventListener('click', () => { void load(); }, { signal: listeners.signal });
  list.addEventListener('click', event => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-game-id]');
    if (!link || event.defaultPrevented || !(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    options.onOpenGame(Number(link.dataset.gameId));
  }, { signal: listeners.signal });
  void load();
  return { destroy() { ++version; request?.abort(); listeners.abort(); unsubscribe(); view.remove(); } };
}
