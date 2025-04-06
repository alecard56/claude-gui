// File: src/models/SettingsModel.ts
// Module: Model
// Purpose: Manages application settings and configuration
// Usage: Accessed through RootStore.settingsStore
// Contains: Methods for getting and updating settings
// Dependencies: MobX, RootStore
// Iteration: 1

import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';

// Type definitions
export interface ThemeConfig {
  colorMode: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  accentColor: string;
  customCss?: string;
}

export interface APIConfig {
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultTopP: number;
  defaultSystemPrompt: string;
}

export interface EditorConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  wordWrap: boolean;
  tabSize: number;
  showLineNumbers: boolean;
}

export interface InterfaceConfig {
  sidebarWidth: number;
  showTokenCount: boolean;
  showModelInfo: boolean;
  compactMode: boolean;
  showTimestamps: boolean;
}

export interface StorageConfig {
  maxConversations: number;
  autoExportPath?: string;
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  encryptStorage: boolean;
}

export interface Settings {
  theme: ThemeConfig;
  api: APIConfig;
  editor: EditorConfig;
  interface: InterfaceConfig;
  storage: StorageConfig;
  shortcuts: Record<string, string>;
}

export type SettingKey = keyof Settings;

/**
 * Model for managing application settings
 */
export class SettingsModel {
  // Observable properties
  settings: Settings;
  isLoading = false;
  error: string | null = null;
  
  // Reference to root store for cross-store interactions
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    
    // Initialize with default settings
    this.settings = this.getDefaultSettings();
    
    makeAutoObservable(this);
  }

  /**
   * Initialize the settings model
   * Loads saved settings from storage
   */
  async initialize(debug_mode = false) {
    if (debug_mode) {
      console.log('Initializing SettingsModel...');
    }
    
    this.isLoading = true;
    
    try {
      // Get settings from storage
      const savedSettings = await this.loadSettings();
      
      if (savedSettings) {
        runInAction(() => {
          // Merge with default settings to ensure all properties exist
          this.settings = this.mergeWithDefaults(savedSettings);
        });
        
        if (debug_mode) {
          console.log('Settings loaded:', this.settings);
        }
      } else if (debug_mode) {
        console.log('No saved settings found, using defaults');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      
      if (debug_mode) {
        console.error('Settings loading error details:', error);
      }
      
      runInAction(() => {
        this.error = 'Failed to load settings';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Reset the settings model state
   */
  reset() {
    this.settings = this.getDefaultSettings();
    this.error = null;
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): Settings {
    return {
      theme: {
        colorMode: 'system',
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        accentColor: '#7a4dff',
      },
      api: {
        defaultModel: 'claude-3-opus-20240229',
        defaultTemperature: 0.7,
        defaultMaxTokens: 4096,
        defaultTopP: 0.9,
        defaultSystemPrompt: '',
      },
      editor: {
        autoSave: true,
        autoSaveInterval: 30,
        spellCheck: true,
        wordWrap: true,
        tabSize: 2,
        showLineNumbers: true,
      },
      interface: {
        sidebarWidth: 300,
        showTokenCount: true,
        showModelInfo: true,
        compactMode: false,
        showTimestamps: true,
      },
      storage: {
        maxConversations: 100,
        backupFrequency: 'weekly',
        encryptStorage: false,
      },
      shortcuts: {
        newConversation: 'Ctrl+N',
        saveConversation: 'Ctrl+S',
        submitPrompt: 'Ctrl+Enter',
        cancelRequest: 'Escape',
        clearPrompt: 'Ctrl+L',
        focusPrompt: 'Alt+P',
      },
    };
  }

  /**
   * Merge saved settings with defaults to ensure all properties exist
   */
  private mergeWithDefaults(savedSettings: Partial<Settings>): Settings {
    const defaults = this.getDefaultSettings();
    
    // Recursive function to merge nested objects
    const mergeObjects = <T extends Record<string, any>>(
      target: T,
      source: Partial<T>
    ): T => {
      const result = { ...target };
      
      Object.keys(source).forEach(key => {
        const sourceValue = source[key as keyof typeof source];
        const targetValue = target[key as keyof typeof target];
        
        // If both values are objects, merge them recursively
        if (
          sourceValue &&
          targetValue &&
          typeof sourceValue === 'object' &&
          typeof targetValue === 'object' &&
          !Array.isArray(sourceValue) &&
          !Array.isArray(targetValue)
        ) {
          result[key as keyof typeof result] = mergeObjects(
            targetValue,
            sourceValue
          ) as any;
        } else {
          // Otherwise use the source value
          result[key as keyof typeof result] = sourceValue as any;
        }
      });
      
      return result;
    };
    
    return mergeObjects(defaults, savedSettings);
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<Partial<Settings> | null> {
    try {
      const allSettings: Partial<Settings> = {};
      
      // Load each section of settings
      for (const key of Object.keys(this.getDefaultSettings())) {
        const value = await window.electronAPI.getSetting(key);
        if (value !== undefined) {
          allSettings[key as keyof Settings] = value;
        }
      }
      
      return Object.keys(allSettings).length > 0 ? allSettings : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings() {
    try {
      // Save each section of settings
      for (const [key, value] of Object.entries(this.settings)) {
        await window.electronAPI.setSetting(key, value);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      runInAction(() => {
        this.error = 'Failed to save settings';
      });
      throw error;
    }
  }

  /**
   * Update a specific setting
   */
  async updateSetting<K extends keyof Settings, T extends Settings[K]>(
    key: K,
    value: T,
    debug_mode = false
  ): Promise<boolean> {
    if (debug_mode) {
      console.log(`Updating setting ${String(key)}:`, value);
    }
    
    try {
      runInAction(() => {
        this.settings[key] = value;
      });
      
      // Save the updated settings
      await this.saveSettings();
      
      // Notify other stores about the change if needed
      this.notifySettingChange(key);
      
      return true;
    } catch (error) {
      console.error(`Failed to update setting ${String(key)}:`, error);
      
      if (debug_mode) {
        console.error('Setting update error details:', error);
      }
      
      runInAction(() => {
        this.error = `Failed to update setting: ${String(key)}`;
      });
      
      return false;
    }
  }

  /**
   * Update a nested setting
   */
  async updateNestedSetting<
    K extends keyof Settings,
    SK extends keyof Settings[K],
    T extends Settings[K][SK]
  >(
    parentKey: K,
    key: SK,
    value: T,
    debug_mode = false
  ): Promise<boolean> {
    if (debug_mode) {
      console.log(`Updating nested setting ${String(parentKey)}.${String(key)}:`, value);
    }
    
    try {
      runInAction(() => {
        this.settings[parentKey][key] = value;
      });
      
      // Save the updated settings
      await this.saveSettings();
      
      // Notify other stores about the change if needed
      this.notifySettingChange(parentKey);
      
      return true;
    } catch (error) {
      console.error(`Failed to update nested setting ${String(parentKey)}.${String(key)}:`, error);
      
      if (debug_mode) {
        console.error('Nested setting update error details:', error);
      }
      
      runInAction(() => {
        this.error = `Failed to update setting: ${String(parentKey)}.${String(key)}`;
      });
      
      return false;
    }
  }

  /**
   * Notify other stores about a setting change
   */
  private notifySettingChange(key: keyof Settings) {
    // Update API parameters if API settings changed
    if (key === 'api') {
      this.rootStore.apiStore.updateParams({
        model: this.settings.api.defaultModel,
        temperature: this.settings.api.defaultTemperature,
        max_tokens: this.settings.api.defaultMaxTokens,
        top_p: this.settings.api.defaultTopP,
        system: this.settings.api.defaultSystemPrompt || undefined,
      });
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Resetting settings to defaults');
    }
    
    try {
      runInAction(() => {
        this.settings = this.getDefaultSettings();
      });
      
      // Save the default settings
      await this.saveSettings();
      
      // Notify all relevant stores
      this.notifySettingChange('api');
      
      return true;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      
      if (debug_mode) {
        console.error('Settings reset error details:', error);
      }
      
      runInAction(() => {
        this.error = 'Failed to reset settings';
      });
      
      return false;
    }
  }
}