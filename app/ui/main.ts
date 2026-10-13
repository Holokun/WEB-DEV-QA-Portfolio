import { mountCatalogue } from './catalogue.js';
import { mountDetail } from './detail.js';
import { createFavouritesStore } from './favourites.js';
import { mountFavourites } from './favourites-view.js';
import { mountFeedback } from './feedback.js';

const container = document.querySelector<HTMLElement>('#app')!;
const store = createFavouritesStore();
const libraryLink = document.querySelector<HTMLAnchorElement>('[data-library-link]')!;
const favouritesLink = document.querySelector<HTMLAnchorElement>('[data-favourites-link]')!;
const feedbackLink = document.querySelector<HTMLAnchorElement>('[data-feedback-link]')!;
const warning = document.querySelector<HTMLElement>('[data-persistence-warning]')!;
let unsubscribeHeader: (() => void) | undefined;
let mounted: { destroy(): void } | undefined;
let active = false;
let currentHash: string | undefined;

function onLibraryClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  window.location.hash = '';
}

function render(): void {
  if (!active || currentHash === window.location.hash) return;
  mounted?.destroy();
  currentHash = window.location.hash;
  const match = /^#\/games\/([1-9][0-9]*)$/.exec(currentHash);
  const id = match ? Number(match[1]) : undefined;
  const onOpenGame = (gameId: number): void => { window.location.hash = `/games/${gameId}`; };
  mounted = currentHash === '#/favourites'
    ? mountFavourites(container, { store, onOpenGame })
    : currentHash === '#/feedback'
      ? mountFeedback(container, { store, onBack: () => { window.location.hash = ''; } })
    : id !== undefined && Number.isSafeInteger(id)
      ? mountDetail(container, id, { store, onBack: () => { window.location.hash = ''; } })
      : mountCatalogue(container, { store, onOpenGame });
  for (const link of document.querySelectorAll<HTMLAnchorElement>('.site-nav a')) {
    const selected = link === favouritesLink ? currentHash === '#/favourites'
      : link === feedbackLink ? currentHash === '#/feedback' : !currentHash || currentHash === '#/';
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  // Move focus off controls from the removed view; Tab starts at this view.
  container.tabIndex = -1;
  container.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function activate(): void {
  if (active) return;
  active = true;
  const updateHeader = (): void => {
    favouritesLink.textContent = `Favourites (${store.ids().length})`;
    warning.textContent = store.warning();
    warning.hidden = !store.warning();
  };
  unsubscribeHeader = store.subscribe(updateHeader);
  updateHeader();
  libraryLink.addEventListener('click', onLibraryClick);
  window.addEventListener('hashchange', render);
  render();
}
window.addEventListener('pagehide', () => {
  active = false;
  libraryLink.removeEventListener('click', onLibraryClick);
  window.removeEventListener('hashchange', render);
  mounted?.destroy();
  unsubscribeHeader?.();
  unsubscribeHeader = undefined;
  mounted = undefined;
  currentHash = undefined;
});
// A persisted browser-history document survives pagehide. Remount the current
// route, rather than reviving its destroyed view or old request ownership.
window.addEventListener('pageshow', activate);
activate();
