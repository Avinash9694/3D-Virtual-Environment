import type { AvatarDefinition } from '../avatar/avatar-catalog';
import { el } from './dom';
import { createFooter } from './footer';

export interface AvatarSelectScreen {
  element: HTMLElement;
  select(id: string): void;
  show(): void;
  hide(): void;
}

export interface AvatarSelectOptions {
  avatars: readonly AvatarDefinition[];
  initialId: string;
  onPreview(id: string): void;
  onEnter(id: string): void;
}

export function createAvatarSelect(options: AvatarSelectOptions): AvatarSelectScreen {
  let selected = options.initialId;
  const cards = new Map<string, HTMLButtonElement>();

  const list = el('div', { className: 'avatar-list', role: 'radiogroup', 'aria-label': 'Avatars' });
  for (const avatar of options.avatars) {
    const card = el(
      'button',
      {
        type: 'button',
        className: 'avatar-card',
        role: 'radio',
        'aria-checked': 'false',
        'data-avatar': avatar.id,
      },
      el('span', { className: 'avatar-swatch', style: `--accent:${avatar.accent}` }),
      el(
        'span',
        { className: 'avatar-copy' },
        el('span', { className: 'avatar-name', text: avatar.name }),
        el('span', { className: 'avatar-desc', text: avatar.description }),
        el(
          'span',
          { className: 'avatar-tags' },
          ...avatar.tags.map((t) => el('span', { className: 'tag', text: t })),
        ),
      ),
    );
    card.addEventListener('click', () => {
      api.select(avatar.id);
      options.onPreview(avatar.id);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const ids = options.avatars.map((a) => a.id);
      const idx = ids.indexOf(selected);
      const next = ids[(idx + (e.key === 'ArrowDown' ? 1 : ids.length - 1)) % ids.length];
      if (!next) return;
      api.select(next);
      options.onPreview(next);
      cards.get(next)?.focus();
    });
    cards.set(avatar.id, card);
    list.append(card);
  }

  const enter = el('button', {
    type: 'button',
    className: 'btn btn-primary btn-lg',
    text: 'Enter world',
  });
  enter.addEventListener('click', () => options.onEnter(selected));

  const panel = el(
    'div',
    { className: 'select-panel' },
    el('p', { className: 'eyebrow', text: '3D Virtual Environment' }),
    el('h1', { text: 'Choose your avatar' }),
    el('p', {
      className: 'muted',
      text: 'Pick a character, then explore the plaza with WASD or the on-screen stick.',
    }),
    list,
    enter,
  );

  const element = el(
    'section',
    { className: 'screen select-screen', 'aria-label': 'Avatar selection' },
    panel,
    createFooter(),
  );

  const api: AvatarSelectScreen = {
    element,
    select(id) {
      selected = id;
      for (const [cardId, card] of cards) {
        const on = cardId === id;
        card.setAttribute('aria-checked', String(on));
        card.tabIndex = on ? 0 : -1;
        card.classList.toggle('is-selected', on);
      }
    },
    show() {
      element.classList.remove('is-hidden');
      element.removeAttribute('aria-hidden');
      cards.get(selected)?.focus({ preventScroll: true });
    },
    hide() {
      element.classList.add('is-hidden');
      element.setAttribute('aria-hidden', 'true');
    },
  };
  api.select(selected);
  return api;
}
