import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// 拡張機能のnewtabページ(chrome-extension://.../index.html)ではpushStateベースの
// ルーティングが不安定なため、ハッシュルーティングを使う。
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
