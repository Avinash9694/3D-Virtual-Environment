import './style.css';

import { startApp } from './app';
import { isWebGLAvailable } from './engine/webgl-support';
import { el } from './ui/dom';
import { createFooter } from './ui/footer';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app root');

if (!isWebGLAvailable()) {
  root.append(
    el(
      'section',
      { className: 'screen loading-screen', 'aria-label': 'Unsupported browser' },
      el(
        'div',
        { className: 'loading-panel' },
        el('p', { className: 'eyebrow', text: '3D Virtual Environment' }),
        el('h1', { text: 'WebGL is not available' }),
        el('p', {
          className: 'muted',
          text: 'This experience needs WebGL. Try a current version of Chrome, Firefox, Safari or Edge, and make sure hardware acceleration is enabled.',
        }),
      ),
      createFooter(),
    ),
  );
} else {
  startApp(root).catch((error: unknown) => {
    console.error(error);
    root.append(
      el('p', {
        className: 'fatal',
        role: 'alert',
        text: 'The world could not start. Reload the page to try again.',
      }),
    );
  });
}
