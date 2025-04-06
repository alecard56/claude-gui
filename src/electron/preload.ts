/**
 * File: src/electron/preload.ts
 * Module: Electron Preload
 * Purpose: Preload script to expose safe APIs to renderer
 * Usage: Loaded by Electron before the renderer process
 * Contains: Context bridge API exposures
 * Dependencies: electron
 * Iteration: 1
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFile: (options: any) => ipcRenderer.invoke('save-file', options),
  openFile: (options: any) => ipcRenderer.invoke('open-file', options),
  
  // Application operations
  quitApp: () => ipcRenderer.invoke('app-quit'),
  relaunchApp: () => ipcRenderer.invoke('app-relaunch'),
  
  // Secure storage operations
  secureStoreGet: (key: string) => ipcRenderer.invoke('secure-store-get', key),
  secureStoreSet: (key: string, value: any) => ipcRenderer.invoke('secure-store-set', key, value),
  secureStoreDelete: (key: string) => ipcRenderer.invoke('secure-store-delete', key),
  
  // IPC events to listen for main process messages
  on: (channel: string, callback: (...args: any[]) => void) => {
    // Whitelist channels that can be listened to
    const validChannels = [
      'open-settings',
      'new-conversation',
      'export-conversation',
      'import-conversation',
      'find-in-conversation',
      'toggle-sidebar',
      'update-status'
    ];
    
    if (validChannels.includes(channel)) {
      const subscription = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, subscription);
      
      // Return a function to remove the event listener
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    
    return () => {}; // Return empty function if channel is not valid
  }
});

// Additional APIs can be exposed here as needed
contextBridge.exposeInMainWorld('appInfo', {
  // Static app information
  appName: 'Claude API GUI',
  platform: process.platform,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux'
});

// Log successful preload
console.log('Preload script loaded successfully');
