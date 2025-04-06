// File: src/main/preload.ts
// Purpose: Preload script for Electron's renderer process
// Usage: Exposes selective Node.js APIs to the renderer
// Contains: Contextual bridge, IPC handlers, exposed APIs
// Dependencies: Electron
// Iteration: 1

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// specific IPC channels using the window object
contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication methods
  storeApiKey: (profileId: string, apiKey: string) => 
    ipcRenderer.invoke('store-api-key', profileId, apiKey),
  
  getApiKey: (profileId: string) => 
    ipcRenderer.invoke('get-api-key', profileId),
  
  getActiveProfile: () => 
    ipcRenderer.invoke('get-active-profile'),
  
  // App info methods
  getAppPath: () => 
    ipcRenderer.invoke('get-app-path'),
  
  // Conversation storage methods
  saveConversation: (conversationData: any) => 
    ipcRenderer.invoke('save-conversation', conversationData),
  
  getConversations: () => 
    ipcRenderer.invoke('get-conversations'),
  
  getConversationById: (id: string) => 
    ipcRenderer.invoke('get-conversation-by-id', id),
  
  deleteConversation: (id: string) => 
    ipcRenderer.invoke('delete-conversation', id),
  
  // Settings methods
  getSetting: (key: string) => 
    ipcRenderer.invoke('get-setting', key),
  
  setSetting: (key: string, value: any) => 
    ipcRenderer.invoke('set-setting', key, value),
  
  // API methods
  validateApiKey: (apiKey: string) => 
    ipcRenderer.invoke('validate-api-key', apiKey),
  
  sendPrompt: (apiKey: string, payload: any) => 
    ipcRenderer.invoke('send-prompt', apiKey, payload),
    
  // Usage tracking methods
  recordUsage: (usageData: any) => 
    ipcRenderer.invoke('record-usage', usageData),
  
  getUsageStats: () => 
    ipcRenderer.invoke('get-usage-stats'),
});