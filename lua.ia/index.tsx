
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Tailwind's JIT engine might need this to detect classes in TSX correctly sometimes,
// especially for dynamic classes. In a build setup, this is handled by PostCSS.
// For CDN usage, ensure classes are explicit or Tailwind's heuristics pick them up.
// No specific action needed here if Tailwind CDN is working as expected.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
