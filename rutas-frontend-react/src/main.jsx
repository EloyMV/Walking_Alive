import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { RoutesProvider } from './context/RoutesContext';
import './styles.css';
import './components.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoutesProvider>
        <App />
      </RoutesProvider>
    </BrowserRouter>
  </React.StrictMode>
);
