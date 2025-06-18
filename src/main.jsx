import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async'

import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/main.css'

console.log('🚀 App starting...');

// Catch ALL errors immediately
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('🚨 CAUGHT ERROR:', {
    message: msg,
    source: url,
    line: lineNo,
    column: columnNo,
    error: error
  });
  return false;
};

// Catch promise rejections
window.onunhandledrejection = function(event) {
  console.error('🚨 UNHANDLED PROMISE:', event.reason);
  console.trace();
};

console.log('✅ Error handlers installed');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)