import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  window.location.protocol.startsWith('http') &&
  !(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration skipped if unsupported
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
