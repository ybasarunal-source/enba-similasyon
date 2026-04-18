import React from 'react';
import ReactDOM from 'react-dom/client';
console.log("Main.tsx: Entry point loaded");
import App from './App';
import './index.css';
import { I18nProvider } from './api/i18n.tsx';

console.log("Main.tsx: Entry point loaded. Initializing ReactDOM...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Main.tsx ERROR: Root element not found!");
} else {
  console.log("Main.tsx: Root element found. Starting render...");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>
  );
  console.log("Main.tsx: Render call completed.");
}
