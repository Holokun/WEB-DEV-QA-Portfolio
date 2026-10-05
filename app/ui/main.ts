import { mountCatalogue } from './catalogue.js';

const container = document.querySelector<HTMLElement>('#app')!;
const catalogue = mountCatalogue(container, { onOpenGame: id => { window.location.hash = `/games/${id}`; } });
window.addEventListener('pagehide', () => { catalogue.destroy(); }, { once: true });
