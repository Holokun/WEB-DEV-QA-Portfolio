import { ApiRequestError, getJson } from './api-client.js';
import type { Game, GameDetailResponse, PatchNotesResponse } from '../shared/contracts.js';
import type { FavouritesStore } from './favourites.js';
import { createFavouriteButton, updateFavouriteButton } from './favourite-button.js';

export function mountDetail(container: HTMLElement, gameId: number, options: { store: FavouritesStore; onBack: () => void }): { destroy(): void } {
  const view = document.createElement('section');
  view.className = 'detail';
  // Fixed UI copy only; every API value is assigned through textContent.
  view.innerHTML = `<a class="back-link" href="/" tabindex="0">Back</a>
    <p class="eyebrow">FROM THE LIBRARY</p>
    <p class="detail-status" role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="request-error detail-error" role="alert" hidden><p></p><button type="button">Retry</button></div>
    <div class="game-content" hidden><h1></h1><p class="genre"></p><p class="description"></p>
      <dl class="game-facts"><div><dt>Release year</dt><dd data-year></dd></div><div><dt>Platforms</dt><dd data-platforms></dd></div></dl>
      <a class="notes-link" tabindex="0">Patch notes</a></div>
    <section class="patch-notes" aria-labelledby="notes-heading" tabindex="-1" hidden><h2 id="notes-heading">Patch notes</h2>
      <p role="status" aria-live="polite" aria-atomic="true"></p>
      <div class="request-error" role="alert" hidden><p></p><button type="button">Retry</button></div>
      <ol class="note-list"></ol></section>`;
  container.replaceChildren(view);
  const back = view.querySelector<HTMLAnchorElement>('.back-link')!;
  const content = view.querySelector<HTMLElement>('.game-content')!;
  const detailStatus = view.querySelector<HTMLElement>('.detail-status')!;
  const detailError = view.querySelector<HTMLElement>('.detail-error')!;
  const detailRetry = detailError.querySelector<HTMLButtonElement>('button')!;
  const notesLink = view.querySelector<HTMLAnchorElement>('.notes-link')!;
  notesLink.href = `/#/games/${gameId}`;
  notesLink.setAttribute('aria-controls', 'notes-heading');
  const notesArea = view.querySelector<HTMLElement>('.patch-notes')!;
  const notesStatus = notesArea.querySelector<HTMLElement>('[role=status]')!;
  const notesError = notesArea.querySelector<HTMLElement>('[role=alert]')!;
  const notesRetry = notesError.querySelector<HTMLButtonElement>('button')!;
  const noteList = notesArea.querySelector<HTMLOListElement>('ol')!;
  const listeners = new AbortController();
  let detailRequest: AbortController | undefined;
  let notesRequest: AbortController | undefined;
  let detailVersion = 0;
  let notesVersion = 0;
  let notesOpened = false;
  let favourite: { game: Game; button: HTMLButtonElement } | undefined;
  const unsubscribe = options.store.subscribe(() => {
    if (favourite) updateFavouriteButton(favourite.button, favourite.game, options.store);
  });

  function showError(element: HTMLElement, retry: HTMLButtonElement, error: unknown, copy: string): void {
    const notFound = error instanceof ApiRequestError && error.status === 404;
    element.querySelector('p')!.textContent = notFound ? 'Game not found' : copy;
    retry.hidden = notFound;
    element.hidden = false;
  }

  async function loadDetail(): Promise<void> {
    const current = ++detailVersion;
    detailRequest?.abort();
    detailRequest = new AbortController();
    detailStatus.textContent = 'Loading game details…';
    detailError.hidden = true;
    try {
      const { game } = await getJson<GameDetailResponse>(`/api/games/${gameId}`, detailRequest.signal);
      if (current !== detailVersion) return;
      content.querySelector('h1')!.textContent = game.title;
      content.querySelector('.genre')!.textContent = game.genre;
      content.querySelector('.description')!.textContent = game.description;
      content.querySelector('[data-year]')!.textContent = String(game.releaseYear);
      content.querySelector('[data-platforms]')!.textContent = game.platforms.join(', ');
      favourite?.button.remove();
      favourite = { game, button: createFavouriteButton(game, options.store) };
      content.append(favourite.button);
      content.hidden = false;
      detailStatus.textContent = 'Game details loaded.';
    } catch (error) {
      if (current !== detailVersion) return;
      detailStatus.textContent = '';
      showError(detailError, detailRetry, error, 'Could not load game details');
    }
  }

  async function loadNotes(): Promise<void> {
    const current = ++notesVersion;
    notesRequest?.abort();
    notesRequest = new AbortController();
    notesArea.hidden = false;
    notesStatus.textContent = 'Loading patch notes…';
    notesError.hidden = true;
    try {
      const { patchNotes } = await getJson<PatchNotesResponse>(`/api/games/${gameId}/patch-notes`, notesRequest.signal);
      if (current !== notesVersion) return;
      noteList.replaceChildren();
      for (const note of patchNotes) {
        const item = document.createElement('li');
        item.dataset.noteId = String(note.id);
        const version = document.createElement('h3');
        version.textContent = note.version;
        const date = document.createElement('time');
        date.dateTime = note.publishedAt;
        date.textContent = note.publishedAt;
        const summary = document.createElement('p');
        summary.textContent = note.summary;
        item.append(version, date, summary);
        noteList.append(item);
      }
      notesStatus.textContent = patchNotes.length ? `${patchNotes.length} patch notes loaded.` : 'No patch notes available';
    } catch (error) {
      if (current !== notesVersion) return;
      notesStatus.textContent = '';
      showError(notesError, notesRetry, error, 'Could not load patch notes');
    }
  }

  function plainClick(event: MouseEvent): boolean {
    return !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  }
  back.addEventListener('click', event => {
    if (!plainClick(event)) return;
    event.preventDefault();
    options.onBack();
  }, { signal: listeners.signal });
  notesLink.addEventListener('click', event => {
    if (!plainClick(event)) return;
    event.preventDefault();
    if (!notesOpened) { notesOpened = true; void loadNotes(); }
    notesArea.focus();
  }, { signal: listeners.signal });
  detailRetry.addEventListener('click', () => { void loadDetail(); }, { signal: listeners.signal });
  notesRetry.addEventListener('click', () => { void loadNotes(); }, { signal: listeners.signal });
  void loadDetail();
  return { destroy() {
    ++detailVersion;
    ++notesVersion;
    detailRequest?.abort();
    notesRequest?.abort();
    listeners.abort();
    unsubscribe();
    favourite = undefined;
    view.remove();
  } };
}
