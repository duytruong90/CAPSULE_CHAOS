import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';
import { installManifestAudioAdapter } from './assets/audioAdapter';
import { preloadAssets } from './assets/preloader';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Capsule Chaos could not find the root application element.');
}

installManifestAudioAdapter();
void preloadAssets();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
