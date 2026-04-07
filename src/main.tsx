import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

const migrateStorage = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('leadomancy-')) {
        const newKey = key.replace('leadomancy-', 'altair-');
        if (!localStorage.getItem(newKey)) {
          const val = localStorage.getItem(key);
          if (val) localStorage.setItem(newKey, val);
        }
        localStorage.removeItem(key);
      }
    });
  } catch {}
};
migrateStorage();

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>,
);
