import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

console.log("%c🚀 Powered by TriCorp agency", "color: #ff5722; font-size: 20px; font-weight: bold; padding: 10px; background: #222; border-radius: 5px;");
console.log("%cLooking under the hood? TriCorp developers say hi! 👋", "color: #4CAF50; font-size: 14px; font-family: monospace;");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
