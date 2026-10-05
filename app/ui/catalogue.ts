import { getJson } from './api-client.js';
import type { GameListResponse } from '../shared/contracts.js';

export function mountCatalogue(container: HTMLElement, options: { onOpenGame: (id: number) => void }): { destroy(): void } {
  const view = document.createElement('section');
  view.className = 'catalogue';
  // The template is fixed UI copy. API values only enter textContent below.
  view.innerHTML = `<p class="eyebrow">THE LIBRARY</p><h1>Find your next world.</h1>
    <p class="intro">Explore the collection by title or genre.</p>
    <div class="controls"><div class="field"><label for="game-search">Search games</label>
      <input id="game-search" type="text" placeholder="Try Ember or Orbit" autocomplete="off" aria-describedby="search-validation">
      <p id="search-validation" class="validation" hidden>Search must be 80 characters or fewer</p></div>
    <div class="field"><label for="game-genre">Genre</label><select id="game-genre">
      <option value="">All genres</option><option>Action</option><option>Adventure</option><option>Puzzle</option>
      <option>Racing</option><option>RPG</option><option>Strategy</option></select></div>
    <button type="button" class="secondary" data-clear>Clear controls</button></div>
    <p role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="request-error" role="alert" hidden><p>Could not load games. Please try again.</p><button type="button" data-retry>Retry</button></div>
    <p class="result-summary" hidden></p>
    <ul class="game-grid" aria-label="Games"></ul>`;
  container.replaceChildren(view);
  const search = view.querySelector<HTMLInputElement>('input')!;
  const genre = view.querySelector<HTMLSelectElement>('select')!;
  const status = view.querySelector<HTMLElement>('[role=status]')!;
  const list = view.querySelector<HTMLUListElement>('ul')!;
  const clear = view.querySelector<HTMLButtonElement>('[data-clear]')!;
  const retry = view.querySelector<HTMLButtonElement>('[data-retry]')!;
  const error = view.querySelector<HTMLElement>('[role=alert]')!;
  const validation = view.querySelector<HTMLElement>('#search-validation')!;
  const summary = view.querySelector<HTMLElement>('.result-summary')!;
  const listeners = new AbortController();
  let request: AbortController | undefined;
  let version = 0;
  let results: GameListResponse | undefined;
  function resultStatus(): string {
    return results ? (results.total ? `${results.total} games` : '0 games · No games found') : '';
  }

  async function load(): Promise<void> {
    const current = ++version;
    request?.abort();
    const trimmed = search.value.trim();
    if ([...trimmed].length > 80) {
      validation.hidden = false;
      search.setAttribute('aria-invalid', 'true');
      status.textContent = resultStatus() || 'Search needs correction.';
      return;
    }
    validation.hidden = true;
    search.removeAttribute('aria-invalid');
    request = new AbortController();
    const filters = new URLSearchParams();
    if (trimmed) filters.set('search', trimmed);
    if (genre.value) filters.set('genre', genre.value);
    status.textContent = 'Loading games…';
    error.hidden = true;
    try {
      const data = await getJson<GameListResponse>(`/api/games${filters.size ? `?${filters}` : ''}`, request.signal);
      if (current !== version) return;
      results = data;
      list.replaceChildren();
      for (const game of data.games) {
        const card = document.createElement('li');
        const link = document.createElement('a');
        link.href = `/#/games/${game.id}`;
        // Explicit sequential focus keeps these links reachable by ordinary Tab
        // in WebKit's Windows port, whose native policy skips implicit links.
        link.tabIndex = 0;
        link.textContent = game.title;
        link.dataset.gameId = String(game.id);
        const tag = document.createElement('p');
        tag.className = 'genre';
        tag.textContent = game.genre;
        card.append(link, tag);
        list.append(card);
      }
      status.textContent = resultStatus();
      summary.textContent = `Results for search “${data.filters.search || 'All titles'}”; genre “${data.filters.genre || 'All genres'}” · ${data.total} games`;
      summary.hidden = false;
    } catch {
      if (current !== version) return;
      status.textContent = results ? `${results.total} games retained from the previous successful request.` : 'Games could not be loaded.';
      error.hidden = false;
    }
  }
  search.addEventListener('input', () => { void load(); }, { signal: listeners.signal });
  genre.addEventListener('change', () => { void load(); }, { signal: listeners.signal });
  clear.addEventListener('click', () => { search.value = ''; genre.value = ''; void load(); search.focus(); }, { signal: listeners.signal });
  retry.addEventListener('click', () => { search.focus(); void load(); }, { signal: listeners.signal });
  list.addEventListener('click', event => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-game-id]');
    if (!link || event.defaultPrevented || !(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    options.onOpenGame(Number(link.dataset.gameId));
  }, { signal: listeners.signal });
  void load();
  return { destroy() { ++version; request?.abort(); listeners.abort(); view.remove(); } };
}
