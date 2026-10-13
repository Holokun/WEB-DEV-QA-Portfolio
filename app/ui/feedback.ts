import type { FeedbackResponse, GameListResponse } from '../shared/contracts.js';
import { validateFeedback, type FeedbackErrors } from '../shared/feedback-validation.js';
import { getJson, postJson } from './api-client.js';
import type { FavouritesStore } from './favourites.js';

export function mountFeedback(container: HTMLElement, options: { onBack(): void; store: FavouritesStore }): { destroy(): void } {
  const view = document.createElement('section');
  view.className = 'feedback';
  view.innerHTML = `<a class="back-link" href="/" tabindex="0">Back</a>
    <p class="eyebrow">SHARE YOUR EXPERIENCE</p><h1>Feedback</h1>
    <p class="intro">Choose a game and tell us about your experience.</p>
    <p role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="request-error" role="alert" data-load-error hidden><p>Could not load games. Please try again.</p><button type="button">Retry loading games</button></div>
    <p class="request-error" role="alert" data-submit-error hidden>Could not submit feedback. Your entries are saved here; please try again.</p>
    <form novalidate class="feedback-form">
      <div class="field"><label for="feedback-game">Game</label><select id="feedback-game" name="gameId" required aria-describedby="feedback-game-error" disabled><option value="">Choose a game</option></select>
        <p id="feedback-game-error" class="validation" aria-live="polite" aria-atomic="true"></p></div>
      <div class="field"><label for="feedback-email">Email</label><input id="feedback-email" name="email" type="text" inputmode="email" autocomplete="email" required aria-describedby="feedback-email-error">
        <p id="feedback-email-error" class="validation" aria-live="polite" aria-atomic="true"></p></div>
      <div class="field"><label for="feedback-description">Description</label><textarea id="feedback-description" name="description" rows="5" required aria-describedby="feedback-description-help feedback-description-error"></textarea>
        <p id="feedback-description-help" class="field-help">At least 20 characters after trimming spaces.</p>
        <p id="feedback-description-error" class="validation" aria-live="polite" aria-atomic="true"></p></div>
      <button type="submit">Submit feedback</button>
    </form>`;
  container.replaceChildren(view);
  const form = view.querySelector<HTMLFormElement>('form')!;
  const game = view.querySelector<HTMLSelectElement>('select')!;
  const email = view.querySelector<HTMLInputElement>('input')!;
  const description = view.querySelector<HTMLTextAreaElement>('textarea')!;
  const button = form.querySelector<HTMLButtonElement>('button')!;
  const status = view.querySelector<HTMLElement>('[role=status]')!;
  const loadError = view.querySelector<HTMLElement>('[data-load-error]')!;
  const submitError = view.querySelector<HTMLElement>('[data-submit-error]')!;
  const listeners = new AbortController();
  let loadRequest: AbortController | undefined;
  let submitRequest: AbortController | undefined;
  let loadVersion = 0;
  let active = true;
  let gamesLoaded = false;
  let pending = false;
  let validationShown = false;
  const fields = { gameId: game, email, description };

  function input() { return { gameId: Number(game.value), email: email.value, description: description.value }; }
  function showErrors(errors: FeedbackErrors): void {
    for (const [name, field] of Object.entries(fields) as [keyof typeof fields, typeof game | typeof email | typeof description][]) {
      field.setAttribute('aria-invalid', String(Boolean(errors[name])));
      view.querySelector<HTMLElement>(`#${field.id}-error`)!.textContent = errors[name] ?? '';
    }
  }
  function setPending(value: boolean): void {
    pending = value;
    form.setAttribute('aria-busy', String(value));
    button.disabled = value;
    game.disabled = value || !gamesLoaded;
    email.disabled = value;
    description.disabled = value;
  }

  async function loadGames(): Promise<void> {
    const version = ++loadVersion;
    loadRequest?.abort();
    loadRequest = new AbortController();
    loadError.hidden = true;
    status.textContent = 'Loading games…';
    try {
      const data = await getJson<GameListResponse>('/api/games', loadRequest.signal);
      if (!active || version !== loadVersion) return;
      for (const item of data.games) {
        const option = document.createElement('option');
        option.value = String(item.id);
        option.textContent = item.title;
        game.append(option);
      }
      gamesLoaded = true;
      game.disabled = pending;
      if (!data.filters.search && !data.filters.genre && data.total === data.games.length) options.store.validate(data.games);
      status.textContent = '';
    } catch {
      if (!active || version !== loadVersion) return;
      status.textContent = '';
      loadError.hidden = false;
    }
  }

  async function send(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!active || pending) return;
    validationShown = true;
    const result = validateFeedback(input());
    showErrors(result.valid ? {} : result.errors);
    submitError.hidden = true;
    status.textContent = '';
    if (!result.valid) {
      Object.values(fields).find(field => field.getAttribute('aria-invalid') === 'true' && !field.disabled)?.focus();
      return;
    }
    setPending(true);
    status.textContent = 'Submitting feedback…';
    submitRequest = new AbortController();
    try {
      await postJson<FeedbackResponse>('/api/feedback', result.value, submitRequest.signal);
      if (!active) return;
      status.textContent = 'Feedback submitted. Thank you!';
    } catch {
      if (!active) return;
      status.textContent = '';
      submitError.hidden = false;
    } finally {
      if (active) setPending(false);
    }
  }
  form.addEventListener('submit', event => { void send(event); }, { signal: listeners.signal });
  form.addEventListener('input', () => {
    if (!validationShown || pending) return;
    const result = validateFeedback(input());
    showErrors(result.valid ? {} : result.errors);
  }, { signal: listeners.signal });
  loadError.querySelector('button')!.addEventListener('click', () => { void loadGames(); }, { signal: listeners.signal });
  view.querySelector('a')!.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    options.onBack();
  }, { signal: listeners.signal });
  void loadGames();
  return { destroy() { active = false; ++loadVersion; loadRequest?.abort(); submitRequest?.abort(); listeners.abort(); view.remove(); } };
}
