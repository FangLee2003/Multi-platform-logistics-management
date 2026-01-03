import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
//import './index.css'

// Suppress next-auth errors - React app uses its own authentication system
// This prevents console noise from next-auth client trying to fetch sessions
const originalError = console.error;
console.error = (...args) => {
  // Ignore next-auth related errors (harmless noise)
  if (
    args[0]?.includes?.('next-auth') ||
    args[0]?.includes?.('CLIENT_FETCH_ERROR') ||
    (typeof args[0] === 'string' && args[0].includes('/api/auth/session'))
  ) {
    return;
  }
  // Log all other errors normally
  originalError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
