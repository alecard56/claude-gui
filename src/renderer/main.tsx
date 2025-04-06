// File: src/renderer/main.tsx
// Purpose: Main entry point for the React application
// Usage: Imported by index.html, initializes the React app
// Contains: React initialization, theme provider setup, and root component rendering
// Dependencies: React, ReactDOM, Chakra UI, MobX
// Iteration: 1

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { RootStore } from '../models/RootStore';
import { StoreProvider } from '../utils/StoreContext';
import App from './App';
import './styles/global.css';

// Initialize the root store
const rootStore = new RootStore();

// Define the Chakra UI theme
const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  colors: {
    brand: {
      50: '#f0e4ff',
      100: '#cbb2ff',
      200: '#a480ff',
      300: '#7a4dff',
      400: '#541bfe',
      500: '#4300e5',
      600: '#3500b3',
      700: '#270082',
      800: '#180052',
      900: '#0a0022',
    },
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
});

// Render the app
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StoreProvider value={rootStore}>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </StoreProvider>
  </React.StrictMode>
);