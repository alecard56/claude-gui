/**
 * File: src/electron/main.ts
 * Module: Electron Main Process
 * Purpose: Entry point for Electron application
 * Usage: Main process that loads the renderer
 * Contains: Application setup, window management, IPC handlers
 * Dependencies: electron
 * Iteration: 1
 */

import { app, BrowserWindow, ipcMain, Menu, shell, dialog } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';
import ElectronStore from 'electron-store';

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reloader')(module);
  } catch (err) {
    console.error('Electron reloader error:', err);
  }
}

// Application state
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// Secure store for app data
const store = new ElectronStore({
  encryptionKey: 'claude-api-gui-encryption-key',
  name: 'claude-api-app-data'
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

/**
 * Creates the main application window
 */
function createMainWindow() {
  // Get saved window dimensions or use defaults
  const windowState = store.get('windowState', {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false
  });

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowState.width as number,
    height: windowState.height as number,
    x: windowState.x as number | undefined,
    y: windowState.y as number | undefined,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready-to-show
    titleBarStyle: 'hiddenInset', // Looks better on macOS
    backgroundColor: '#f5f5f5'
  });

  // Load the index.html of the app
  if (process.env.NODE_ENV === 'development') {
    // Development - load from vite dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools automatically in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production - load from built files
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../renderer/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  // Maximize window if it was maximized when last closed
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Show window when ready
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
  });

  // Save window dimensions when closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      if (process.platform === 'darwin') {
        // On macOS, hide instead of quitting when window is closed
        app.hide();
      } else {
        // On other platforms, minimize to tray if enabled, otherwise quit
        const minimizeToTray = store.get('settings.minimizeToTray', false);
        if (minimizeToTray) {
          mainWindow?.hide();
        } else {
          app.quit();
        }
      }
      return;
    }

    // Save current window state
    if (!mainWindow) return;
    
    const isMaximized = mainWindow.isMaximized();
    const bounds = mainWindow.getBounds();

    store.set('windowState', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized
    });
  });

  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up native application menu
  createApplicationMenu();
}

/**
 * Creates the native application menu
 */
function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('open-settings')
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Conversation',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('new-conversation')
        },
        { type: 'separator' },
        {
          label: 'Export Conversation',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('export-conversation')
        },
        {
          label: 'Import Conversation',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow?.webContents.send('import-conversation')
        },
        { type: 'separator' },
        !isMac ? {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('open-settings')
        } : { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('find-in-conversation')
        }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.send('toggle-sidebar')
        }
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },

    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://www.anthropic.com/claude');
          }
        },
        {
          label: 'API Documentation',
          click: async () => {
            await shell.openExternal('https://docs.anthropic.com/claude/reference/');
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox({
              title: 'About Claude API GUI',
              message: 'Claude API GUI',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}\nV8: ${process.versions.v8}`,
              buttons: ['OK'],
              icon: path.join(__dirname, '../assets/icons/icon.png')
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Set up IPC handlers for main-process operations
 */
function setupIpcHandlers() {
  // File system operations
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  ipcMain.handle('save-file', async (event, options) => {
    const { defaultPath, filters, data } = options;
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, data);
      return result.filePath;
    }
    return null;
  });

  ipcMain.handle('open-file', async (event, options) => {
    const { filters } = options;
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return {
        path: result.filePaths[0],
        data: fs.readFileSync(result.filePaths[0], 'utf8')
      };
    }
    return null;
  });

  // Application operations
  ipcMain.handle('app-quit', () => {
    isQuitting = true;
    app.quit();
  });

  ipcMain.handle('app-relaunch', () => {
    app.relaunch();
    isQuitting = true;
    app.quit();
  });

  // Secure storage operations (encrypt/decrypt sensitive info)
  ipcMain.handle('secure-store-get', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('secure-store-set', (event, key, value) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle('secure-store-delete', (event, key) => {
    store.delete(key);
    return true;
  });
}

/**
 * Set up auto updater
 */
function setupAutoUpdater() {
  // Configure auto updater
  autoUpdater.logger = console;

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-status', 'checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-status', 'update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    mainWindow?.webContents.send('update-status', 'update-not-available', info);
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-status', 'error', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-status', 'download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-status', 'update-downloaded', info);
    
    // Prompt user to install update
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart the application to apply the updates.',
      buttons: ['Restart', 'Later']
    }).then((returnValue) => {
      if (returnValue.response === 0) {
        isQuitting = true;
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Check for updates silently
  autoUpdater.checkForUpdatesAndNotify();
}

// This method will be called when Electron has finished initialization
app.on('ready', () => {
  createMainWindow();
  setupIpcHandlers();
  setupAutoUpdater();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS it's common to re-create a window when the dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

// Handle before-quit event
app.on('before-quit', (event) => {
  if (isQuitting) return;
  
  isQuitting = true;
  
  // Save application state
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    store.set('windowState', {
      ...store.get('windowState', {}),
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: mainWindow.isMaximized()
    });
  }
});
