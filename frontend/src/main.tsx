import { Provider } from 'react-redux';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { store } from './store';

import './index.css';

import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
