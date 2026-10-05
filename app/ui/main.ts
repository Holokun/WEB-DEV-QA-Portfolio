import { mountCatalogue } from './catalogue.js';
import { mountDetail } from './detail.js';

const container = document.querySelector<HTMLElement>('#app')!;
let mounted: { destroy(): void } | undefined;
let active = false;
let currentHash: string | undefined;

function render(): void {
  if (!active || currentHash === window.location.hash) return;
  mounted?.destroy();
  currentHash = window.location.hash;
  const match = /^#\/games\/([1-9][0-9]*)$/.exec(currentHash);
  const id = match ? Number(match[1]) : undefined;
  mounted = id !== undefined && Number.isSafeInteger(id)
    ? mountDetail(container, id, { onBack: () => { window.location.hash = ''; } })
    : mountCatalogue(container, { onOpenGame: gameId => { window.location.hash = `/games/${gameId}`; } });
  // Move focus off controls from the removed view; Tab starts at this view.
  container.tabIndex = -1;
  container.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function activate(): void {
  if (active) return;
  active = true;
  window.addEventListener('hashchange', render);
  render();
}
window.addEventListener('pagehide', () => {
  active = false;
  window.removeEventListener('hashchange', render);
  mounted?.destroy();
  mounted = undefined;
  currentHash = undefined;
});
// A persisted browser-history document survives pagehide. Remount the current
// route, rather than reviving its destroyed view or old request ownership.
window.addEventListener('pageshow', activate);
activate();
