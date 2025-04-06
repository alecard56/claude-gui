// File: src/main/main.ts
// Purpose: Electron main process entry point
// Usage: Referenced in package.json as the main entry
// Contains: BrowserWindow creation, IPC handlers, app lifecycle
// Dependencies: Electron, electron-store
// Iteration: 1

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as url from 'url';
import log from 'electron-log';
import Store from 'electron-store';
import axios from 'axios';

// Define tipos para la configuración de la aplicación
interface StoreSchema {
  'auth.profiles': Record<string, any>;
  'auth.keys': Record<string, string>;
  'auth.activeProfileId': string;
  [key: string]: any;
}

// Initialize the store
const store = new Store<StoreSchema>();

// Configure logging
log.transports.file.level = 'info';
log.info('Application starting...');

// Declare the main window
let mainWindow: BrowserWindow | null = null;

// Create main window function
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // Don't show until ready-to-show
    backgroundColor: '#f0f0f0',
  });

  // Determine the URL to load
  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000' // Dev server URL
    : url.format({
        pathname: path.join(__dirname, '../renderer/index.html'),
        protocol: 'file:',
        slashes: true,
      });
      
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      
      // Open DevTools in development
      if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  log.info('Main window created');
}

// App ready event
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for main process
ipcMain.handle('get-app-path', () => app.getPath('userData'));

// Handle storing API key securely
ipcMain.handle('store-api-key', (_, profileId: string, apiKey: string) => {
  try {
    // In a real app, we would encrypt this
    const profiles = store.get('auth.profiles', {}) as Record<string, any>;
    
    // Only store the last 4 characters for display
    const maskedKey = apiKey.slice(-4);
    
    // Create a new profiles object to avoid mutation
    const updatedProfiles = { 
      ...profiles,
      [profileId]: {
        keyLastDigits: maskedKey,
        lastUsed: new Date().toISOString(),
      }
    };
    
    store.set('auth.profiles', updatedProfiles);
    store.set(`auth.keys.${profileId}`, apiKey);
    store.set('auth.activeProfileId', profileId);
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to store API key:', error);
    return { success: false, error: errorMessage };
  }
});

// Handle retrieving API key
ipcMain.handle('get-api-key', (_, profileId: string) => {
  try {
    if (!profileId || typeof profileId !== 'string') {
      log.error('Invalid profileId provided to get-api-key');
      return '';
    }
    return store.get(`auth.keys.${profileId}`, '') as string;
  } catch (error) {
    log.error('Failed to retrieve API key:', error);
    return '';
  }
});

  // Handle getting active profile
ipcMain.handle('get-active-profile', () => {
  try {
    const activeProfileId = store.get('auth.activeProfileId', '') as string;
    const profiles = store.get('auth.profiles', {}) as Record<string, any>;
    
    if (activeProfileId && typeof activeProfileId === 'string' && profiles && profiles[activeProfileId]) {
      return {
        id: activeProfileId,
        ...profiles[activeProfileId],
      };
    }
    
    return null;
  } catch (error) {
    log.error('Failed to get active profile:', error);
    return null;
  }
});

// Add API request handlers
ipcMain.handle('validate-api-key', async (_, apiKey: string) => {
  try {
    const response = await axios.get(
      'https://api.anthropic.com/v1/models',
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    return { success: true, status: response.status, data: response.data };
  } catch (error: unknown) {
    log.error('API key validation error:', error);
    
    // Extraer información de error segura de tipo
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Comprobación de tipo segura para acceder a error.response
    const axiosError = error as { response?: { status?: number; data?: any } };
    
    return { 
      success: false, 
      error: errorMessage,
      status: axiosError.response?.status
    };
  }
});

ipcMain.handle('send-prompt', async (_, apiKey: string, payload: any) => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      payload,
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        }
      }
    );
    
    return { success: true, data: response.data };
  } catch (error: unknown) {
    log.error('API request error:', error);
    
    // Extraer información de error segura de tipo
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Comprobación de tipo segura para acceder a error.response
    const axiosError = error as { response?: { status?: number; data?: any } };
    
    return { 
      success: false, 
      error: errorMessage,
      status: axiosError.response?.status,
      data: axiosError.response?.data
    };
  }
});