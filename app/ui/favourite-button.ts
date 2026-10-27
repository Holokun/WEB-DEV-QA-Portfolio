import type { Game } from '../shared/contracts.js';
import type { FavouritesStore } from './favourites.js';

export function updateFavouriteButton(button: HTMLButtonElement, game: Game, store: FavouritesStore): void {
  const saved = store.has(game.id);
  const name = `${saved ? 'Remove' : 'Add'} ${game.title} ${saved ? 'from' : 'to'} favourites`;
  button.textContent = name;
  button.setAttribute('aria-label', name);
  button.setAttribute('aria-pressed', String(saved));
}

export function createFavouriteButton(game: Game, store: FavouritesStore): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'favourite-button';
  updateFavouriteButton(button, game, store);
  // Views subscribe once and update their own buttons. Detached buttons never
  // retain a store subscription when results or routes change.
  button.addEventListener('click', () => { store.toggle(game.id); });
  return button;
}
