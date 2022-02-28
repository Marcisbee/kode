import { h, render } from 'preact';

import { App } from './app';

import './assets/editor.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

render(h(App, null), app);
