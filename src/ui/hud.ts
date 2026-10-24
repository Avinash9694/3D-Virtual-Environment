import { el, svgIcon } from './dom';
import { createFooter } from './footer';
import { ICONS } from './icons';

export interface HudOptions {
  onChangeAvatar(): void;
  onOpenSettings(): void;
}

export interface Hud {
  element: HTMLElement;
  setAvatarName(name: string): void;
  setHint(text: string): void;
  /** Starts the hint fade; returns early if the user already dismissed it. */
  showHint(): void;
  dismissHint(): void;
  show(): void;
  hide(): void;
  readonly touchLayer: HTMLElement;
}

const HINT_LIFETIME_MS = 9000;

export function createHud(options: HudOptions): Hud {
  const avatarName = el('span', { className: 'hud-avatar', text: '' });
  const hint = el('div', { className: 'hud-hint', role: 'status', 'aria-live': 'polite' });

  const changeBtn = iconButton(ICONS.swap, 'Change avatar');
  changeBtn.addEventListener('click', options.onChangeAvatar);
  const settingsBtn = iconButton(ICONS.settings, 'Settings');
  settingsBtn.addEventListener('click', options.onOpenSettings);
  const fullscreenBtn = iconButton(ICONS.fullscreen, 'Toggle fullscreen');
  fullscreenBtn.addEventListener('click', () => {
    void toggleFullscreen();
  });
  if (!document.fullscreenEnabled) fullscreenBtn.hidden = true;

  const topBar = el(
    'div',
    { className: 'hud-top' },
    el(
      'div',
      { className: 'hud-title' },
      el('span', { className: 'hud-brand', text: 'Plaza' }),
      avatarName,
    ),
    el('div', { className: 'hud-actions' }, changeBtn, settingsBtn, fullscreenBtn),
  );

  const touchLayer = el('div', { className: 'touch-layer' });
  const element = el(
    'div',
    { className: 'hud is-hidden' },
    topBar,
    hint,
    touchLayer,
    createFooter('credit credit-hud'),
  );

  let hintTimer = 0;
  let dismissed = false;

  return {
    element,
    touchLayer,
    setAvatarName(name) {
      avatarName.textContent = name;
    },
    setHint(text) {
      hint.textContent = text;
    },
    showHint() {
      if (dismissed) return;
      hint.classList.add('is-visible');
      window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => hint.classList.remove('is-visible'), HINT_LIFETIME_MS);
    },
    dismissHint() {
      dismissed = true;
      window.clearTimeout(hintTimer);
      hint.classList.remove('is-visible');
    },
    show() {
      element.classList.remove('is-hidden');
    },
    hide() {
      element.classList.add('is-hidden');
    },
  };
}

function iconButton(icon: string, label: string): HTMLButtonElement {
  const button = el(
    'button',
    { type: 'button', className: 'icon-btn', 'aria-label': label, title: label },
    svgIcon(icon),
  );
  return button;
}

async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    // Fullscreen can be refused inside iframes or by user settings; the button is simply inert then.
  }
}
