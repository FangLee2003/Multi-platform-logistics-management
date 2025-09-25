import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n';
//import './index.css'
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(Suspense, { fallback: _jsx("div", { children: "Loading..." }), children: _jsx(App, {}) }) }));
