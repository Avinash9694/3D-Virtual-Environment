import type { ThemeMode } from './settings-store';

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
}

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): 'dark' | 'light' {
  if (mode === 'system') return prefersDark ? 'dark' : 'light';
  return mode;
}
