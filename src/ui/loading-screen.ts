import type { ProgressSnapshot } from '../engine/progress';
import { formatBytes } from '../engine/progress';
import { el } from './dom';
import { createFooter } from './footer';

export interface LoadingScreen {
  element: HTMLElement;
  setProgress(snapshot: ProgressSnapshot, label: string): void;
  showError(message: string, onRetry: () => void): void;
  hide(): void;
}

export function createLoadingScreen(): LoadingScreen {
  const bar = el('div', { className: 'progress-bar' });
  const track = el(
    'div',
    {
      className: 'progress-track',
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': 0,
      'aria-label': 'Loading world',
    },
    bar,
  );
  const label = el('p', {
    className: 'loading-label',
    'aria-live': 'polite',
    text: 'Preparing the world…',
  });
  const detail = el('p', { className: 'loading-detail muted', text: '' });
  const actions = el('div', { className: 'loading-actions' });
  const panel = el(
    'div',
    { className: 'loading-panel' },
    el('p', { className: 'eyebrow', text: '3D Virtual Environment' }),
    el('h1', { text: 'Loading the plaza' }),
    track,
    label,
    detail,
    actions,
  );
  const element = el(
    'section',
    { className: 'screen loading-screen', 'aria-label': 'Loading' },
    panel,
    createFooter(),
  );

  return {
    element,
    setProgress(snapshot, current) {
      const pct = Math.round(snapshot.fraction * 100);
      bar.style.width = `${pct}%`;
      track.setAttribute('aria-valuenow', String(pct));
      label.textContent = `${pct}% · ${snapshot.completed}/${snapshot.count} models`;
      detail.textContent = `${formatBytes(snapshot.loadedBytes)} of ${formatBytes(snapshot.totalBytes)} · ${current}`;
    },
    showError(message, onRetry) {
      panel.classList.add('is-error');
      label.textContent = 'Something failed to load.';
      detail.textContent = message;
      actions.replaceChildren(
        el('button', { className: 'btn btn-primary', type: 'button', text: 'Try again' }),
      );
      actions.querySelector('button')?.addEventListener('click', onRetry);
    },
    hide() {
      element.classList.add('is-hidden');
      element.addEventListener('transitionend', () => element.remove(), { once: true });
      window.setTimeout(() => element.remove(), 600);
    },
  };
}
