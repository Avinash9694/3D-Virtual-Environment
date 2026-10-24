import { el, svgIcon } from './dom';
import { ICONS } from './icons';

export function createFooter(className = 'credit'): HTMLElement {
  return el(
    'footer',
    { className },
    el('a', {
      href: 'https://avinash9694.github.io',
      target: '_blank',
      rel: 'noreferrer',
      text: 'Built by Avinash Sahu',
    }),
    el(
      'a',
      {
        href: 'https://github.com/Avinash9694',
        target: '_blank',
        rel: 'noreferrer',
        'aria-label': 'GitHub profile',
        className: 'icon-link',
      },
      svgIcon(ICONS.github),
    ),
    el(
      'a',
      {
        href: 'https://www.linkedin.com/in/A-v-i-n-a-s-h/',
        target: '_blank',
        rel: 'noreferrer',
        'aria-label': 'LinkedIn profile',
        className: 'icon-link',
      },
      svgIcon(ICONS.linkedin),
    ),
  );
}
