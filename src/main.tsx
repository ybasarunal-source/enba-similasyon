import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { I18nProvider } from './api/i18n.tsx';

// Popup redirect context: sadece MSAL redirect'i işle, tam uygulamayı yükleme
const isPopupRedirect =
  window.opener !== null &&
  window.opener !== window &&
  (window.location.search.includes('code=') ||
   window.location.hash.includes('code=') ||
   window.location.hash.includes('access_token='));

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Main.tsx ERROR: Root element not found!");
} else if (isPopupRedirect) {
  // Popup penceresi: ana penceredeki MSAL auth code'u URL'den okuyacak.
  // Sadece bekle — handleRedirectPromise çağırma, auth code'u tüketir.
  rootElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666">Giriş tamamlanıyor...</div>';
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>
  );
}
