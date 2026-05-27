import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { StoreProvider } from './store';

const root = document.getElementById('root')!;
createRoot(root).render(
  <ErrorBoundary>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
// Dismiss splash
try { (window as any).hideSplash?.(); } catch {}
