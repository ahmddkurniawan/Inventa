import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (!localStorage.getItem('inventa_force_reset_v5')) {
  localStorage.clear();
  localStorage.setItem('inventa_force_reset_v5', 'true');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
