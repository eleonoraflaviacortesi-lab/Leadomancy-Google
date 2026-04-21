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

if (!clientId) {
  console.error("VITE_GOOGLE_CLIENT_ID is not defined. Please set it in the Secrets panel.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clientId ? (
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-red-100">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configurazione Mancante</h1>
          <p className="text-gray-600 mb-6">
            Il <strong>Google Client ID</strong> non è stato configurato. 
            Aggiungi <code>VITE_GOOGLE_CLIENT_ID</code> nei Secrets di AI Studio.
          </p>
        </div>
      </div>
    )}
  </StrictMode>,
);
