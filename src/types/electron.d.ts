// File: src/types/electron.d.ts
// Purpose: TypeScript definitions for the Electron API
// Usage: Imported by TypeScript to provide type checking for Electron API calls
// Contains: Interface definitions for the electronAPI object exposed via preload
// Dependencies: None
// Iteration: 1

interface ElectronAPI {
    // Authentication methods
    storeApiKey: (profileId: string, apiKey: string) => Promise<{ success: boolean; error?: string }>;
    getApiKey: (profileId: string) => Promise<string>;
    getActiveProfile: () => Promise<{ id: string; [key: string]: any } | null>;
    
    // App info methods
    getAppPath: () => Promise<string>;
    
    // Conversation storage methods
    saveConversation: (conversationData: any) => Promise<{ success: boolean; error?: string }>;
    getConversations: () => Promise<any[]>;
    getConversationById: (id: string) => Promise<any | null>;
    deleteConversation: (id: string) => Promise<{ success: boolean; error?: string }>;
    
    // Settings methods
    getSetting: (key: string) => Promise<any>;
    setSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    
    // Usage tracking methods
    recordUsage: (usageData: any) => Promise<{ success: boolean; error?: string }>;
    getUsageStats: () => Promise<any | null>;
  }
  
  interface Window {
    electronAPI: ElectronAPI;
  }