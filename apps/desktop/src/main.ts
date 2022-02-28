import { h, render } from 'preact';
import { App } from './app';

import './assets/editor.css';

// Neutralino.events.on('ready', async () => {
//   try {
//     await Neutralino.window.setTitle('Kodē');
//     // await Neutralino.window.setTitle('/private/var/www/private/kode/apps/desktop/neutralino.d.ts');
//   } catch (e) {
//     console.error(e);
//   }
//   // Neutralino.os.showMessageBox('Welcome', 'Hello Neutralinojs');
// });

const app = document.querySelector<HTMLDivElement>('#app')!;

render(h(App, null), app);
