import { el, svgIcon } from './dom';
import { ICONS } from './icons';
import type { Quality, Settings, SettingsStore, ThemeMode } from './settings-store';

export interface SettingsPanel {
  element: HTMLElement;
  open(): void;
  close(): void;
  readonly isOpen: boolean;
}

const QUALITY_LABELS: Record<Quality, string> = {
  low: 'Low · 1× pixels, 1k shadows',
  medium: 'Medium · 1.5× pixels, 2k shadows',
  high: 'High · 2× pixels, 4k shadows',
};

const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'Follow system',
  dark: 'Dark',
  light: 'Light',
};

export function createSettingsPanel(store: SettingsStore): SettingsPanel {
  let lastFocus: HTMLElement | null = null;

  const qualityGroup = el(
    'fieldset',
    { className: 'field-group' },
    el('legend', { text: 'Quality' }),
  );
  const qualityInputs: HTMLInputElement[] = [];
  for (const q of Object.keys(QUALITY_LABELS) as Quality[]) {
    const input = el('input', { type: 'radio', name: 'quality', value: q, id: `quality-${q}` });
    input.addEventListener('change', () => store.update({ quality: q }));
    qualityInputs.push(input);
    qualityGroup.append(
      el(
        'label',
        { className: 'choice', for: `quality-${q}` },
        input,
        el('span', { text: QUALITY_LABELS[q] }),
      ),
    );
  }

  const shadows = el('input', { type: 'checkbox', id: 'setting-shadows' });
  shadows.addEventListener('change', () => store.update({ shadows: shadows.checked }));

  const theme = el('select', { id: 'setting-theme', className: 'select' });
  for (const t of Object.keys(THEME_LABELS) as ThemeMode[]) {
    theme.append(el('option', { value: t, text: THEME_LABELS[t] }));
  }
  theme.addEventListener('change', () => store.update({ theme: theme.value as ThemeMode }));

  const closeBtn = el(
    'button',
    { type: 'button', className: 'icon-btn', 'aria-label': 'Close settings' },
    svgIcon(ICONS.close),
  );

  const dialog = el(
    'div',
    {
      className: 'dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'settings-title',
    },
    el(
      'div',
      { className: 'dialog-head' },
      el('h2', { id: 'settings-title', text: 'Settings' }),
      closeBtn,
    ),
    qualityGroup,
    el(
      'div',
      { className: 'field-row' },
      el('label', { for: 'setting-shadows', text: 'Soft shadows' }),
      shadows,
    ),
    el(
      'div',
      { className: 'field-row' },
      el('label', { for: 'setting-theme', text: 'Interface theme' }),
      theme,
    ),
    el('p', { className: 'muted small', text: 'Settings are saved on this device.' }),
  );
  const element = el('div', { className: 'dialog-backdrop', hidden: true }, dialog);

  const sync = (s: Settings): void => {
    for (const input of qualityInputs) input.checked = input.value === s.quality;
    shadows.checked = s.shadows;
    theme.value = s.theme;
  };
  sync(store.get());
  store.subscribe(sync);

  const api: SettingsPanel = {
    element,
    get isOpen() {
      return !element.hidden;
    },
    open() {
      lastFocus = document.activeElement as HTMLElement | null;
      element.hidden = false;
      (qualityInputs.find((i) => i.checked) ?? closeBtn).focus();
      document.addEventListener('keydown', onKey);
    },
    close() {
      element.hidden = true;
      document.removeEventListener('keydown', onKey);
      lastFocus?.focus();
    },
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      api.close();
    } else if (e.key === 'Tab') {
      trapFocus(dialog, e);
    }
  };

  closeBtn.addEventListener('click', api.close);
  element.addEventListener('click', (e) => {
    if (e.target === element) api.close();
  });

  return api;
}

function trapFocus(container: HTMLElement, e: KeyboardEvent): void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, input, select, [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
