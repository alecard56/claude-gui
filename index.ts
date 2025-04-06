/**
 * File: src/index.ts
 * Purpose: Main entry point for the React application
 * Loads the main App component and renders it to the DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppController } from './controllers/AppController';
import AppView from './views/AppView';
import './styles/global.css';

// Enable debug mode in development
const debug_mode = process.env.NODE_ENV === 'development';

// Initialize the main controller
const appController = new AppController(debug_mode);

// Create the root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the application
root.render(
  <React.StrictMode>
    <AppView controller={appController} debug_mode={debug_mode} />
  </React.StrictMode>
);

// Initialize the application
appController.initialize().catch(error => {
  console.error('Failed to initialize application:', error);
});