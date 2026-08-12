import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/base.css'; 
import { BrowserRouter } from 'react-router-dom';

if (!document.title || !document.title.trim()) {
  document.title = 'GameVerse | Discover Games, News and Compatibility';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
