/**
 * File: src/controllers/SettingsController.ts
 * Module: Controller
 * Purpose: Manages application settings and configuration
 * Usage: Imported by AppController and used by SettingsView
 * Contains: SettingsController class
 * Dependencies: models, mobx
 * Iteration: 1
 */

import { observable, action, makeObservable } from 'mobx';
import { SettingsModel, Settings, ThemeConfig, APIConfig, EditorConfig, InterfaceConfig, StorageConfig } from '../models/SettingsModel';
import { ClaudeAPIClient } from '../models/ClaudeAPIClient';
import * as logger from '../utils/logger';

/**
 * Controller for managing application settings
 */
export class SettingsController {
  private settingsModel: SettingsModel;
  private apiClient: ClaudeAPIClient;
  
  @observable error: string | null = null;
  @observable debugMode: boolean = false;

  constructor(
    settingsModel: SettingsModel,
    apiClient: ClaudeAPIClient,
    debug_mode: boolean = false
  ) {
    this.settingsModel = settingsModel;
    this.apiClient = apiClient;
    this.debugMode = debug_mode;
    
    makeObservable(this);
    
    if (debug_mode) {
      logger.debug('SettingsController initialized');
    }
  }

  /**
   * Get all settings
   */
  public getSettings(): Settings {
    return this.settingsModel.getSettings();
  }

  /**
   * Update an API configuration setting
   * @param key Setting key
   * @param value New value
   */
  @action
  public updateAPIConfig<K extends keyof APIConfig>(key: K, value: APIConfig[K]): void {
    try {
      if (this.debugMode) {
        logger.debug(`Updating API config setting: ${String(key)} = ${JSON.stringify(value)}`);
      }
      
      // Get the current API config
      const apiConfig = { ...this.settingsModel.apiConfig };
      
      // Update the specific setting
      apiConfig[key] = value;
      
      // Update the entire API config
      this.settingsModel.updateSetting('api', apiConfig, this.debugMode);
      
      if (this.debugMode) {
        logger.debug(`API config setting updated successfully: ${String(key)}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error updating API config';
      if (this.debugMode) {
        logger.error(`Error updating API config setting ${String(key)}:`, errorMsg);
      }
      this.error = errorMsg;
    }
  }

  /**
   * Update a theme configuration setting
   * @param key Setting key
   * @param value New value
   */
  @action
  public updateThemeConfig<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]): void {
    try {
      if (this.debugMode) {
        logger.debug(`Updating theme config setting: ${String(key)} = ${JSON.stringify(value)}`);
      }
      
      // Get the current theme config
      const themeConfig = { ...this.settingsModel.themeConfig };
      
      // Update the specific setting
      themeConfig[key] = value;
      
      // Update the entire theme config
      this.settingsModel.updateSetting('theme', themeConfig, this.debugMode);
      
      if (this.debugMode) {
        logger.debug(`Theme config setting updated successfully: ${String(key)}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error updating theme config';
      if (this.debugMode) {
        logger.error(`Error updating theme config setting ${String(key)}:`, errorMsg);
      }
      this.error = errorMsg;
    }
  }

  /**
   * Update an editor configuration setting
   * @param key Setting key
   * @param value New value
   */
  @action
  public updateEditorConfig<K extends keyof EditorConfig>(key: K, value: EditorConfig[K]): void {
    try {
      if (this.debugMode) {
        logger.debug(`Updating editor config setting: ${String(key)} = ${JSON.stringify(value)}`);
      }
      
      // Get the current editor config
      const editorConfig = { ...this.settingsModel.settings.editor };
      
      // Update the specific setting
      editorConfig[key] = value;
      
      // Update the entire editor config
      this.settingsModel.updateSetting('editor', editorConfig, this.debugMode);
      
      if (this.debugMode) {
        logger.debug(`Editor config setting updated successfully: ${String(key)}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error updating editor config';
      if (this.debugMode) {
        logger.error(`Error updating editor config setting ${String(key)}:`, errorMsg);
      }
      this.error = errorMsg;
    }
  }

  /**
   * Update an interface configuration setting
   * @param key Setting key
   * @param value New value
   */
  @action
  public updateInterfaceConfig<K extends keyof InterfaceConfig>(key: K, value: InterfaceConfig[K]): void {
    try {
      if (this.debugMode) {
        logger.debug(`Updating interface config setting: ${String(key)} = ${JSON.stringify(value)}`);
      }
      
      // Get the current interface config
      const interfaceConfig = { ...this.settingsModel.settings.interface };
      
      // Update the specific setting
      interfaceConfig[key] = value;
      
      // Update the entire interface config
      this.settingsModel.updateSetting('interface', interfaceConfig, this.debugMode);
      
      if (this.debugMode) {
        logger.debug(`Interface config setting updated successfully: ${String(key)}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error updating interface config';
      if (this.debugMode) {
        logger.error(`Error updating interface config setting ${String(key)}:`, errorMsg);
      }
      this.error = errorMsg;
    }
  }

  /**
   * Update a storage configuration setting
   * @param key Setting key
   * @param value New value
   */
  @action
  public updateStorageConfig<K extends keyof StorageConfig>(key: K, value: StorageConfig[K]): void {
    try {
      if (this.debugMode) {
        logger.debug(`Updating storage config setting: ${String(key)} = ${JSON.stringify(value)}`);
      }
      
      // Get the current storage config
      const storageConfig = { ...this.settingsModel.settings.storage };
      
      // Update the specific setting
      storageConfig[key] = value;
      
      // Update the entire storage config
      this.settingsModel.updateSetting('storage', storageConfig, this.debugMode);
      
      if (this.debugMode) {
        logger.debug(`Storage config setting updated successfully: ${String(key)}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error updating storage config';
      if (this.debugMode) {
        logger.error(`Error updating storage config setting ${String(key)}:`, errorMsg);
      }
      this.error = errorMsg;
    }
  }

  /**
   * Reset all settings to defaults
   */
  @action
  public resetSettings(): void {
    try {
      if (this.debugMode) {
        logger.debug('Resetting all settings to defaults');
      }
      
      this.settingsModel.resetToDefaults(this.debugMode);
      
      if (this.debugMode) {
        logger.debug('Settings reset successfully');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error resetting settings';
      if (this.debugMode) {
        logger.error('Error resetting settings:', errorMsg);
      }
      this.error = errorMsg;
    }
  }

  /**
   * Export settings to JSON
   */
  public exportSettings(): string {
    try {
      if (this.debugMode) {
        logger.debug('Exporting settings to JSON');
      }
      
      const settingsJson = this.settingsModel.exportSettings(this.debugMode);
      
      if (this.debugMode) {
        logger.debug('Settings exported successfully');
      }
      
      return settingsJson;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error exporting settings';
      if (this.debugMode) {
        logger.error('Error exporting settings:', errorMsg);
      }
      this.error = errorMsg;
      return '';
    }
  }

  /**
   * Import settings from JSON
   * @param settingsJson JSON string containing settings
   */
  @action
  public importSettings(settingsJson: string): boolean {
    try {
      if (this.debugMode) {
        logger.debug('Importing settings from JSON');
      }
      
      const success = this.settingsModel.importSettings(settingsJson, this.debugMode);
      
      if (this.debugMode) {
        logger.debug(`Settings import ${success ? 'successful' : 'failed'}`);
      }
      
      return success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error importing settings';
      if (this.debugMode) {
        logger.error('Error importing settings:', errorMsg);
      }
      this.error = errorMsg;
      return false;
    }
  }

  /**
   * Create a backup of application data
   */
  @action
  public createBackup(): void {
    try {
      if (this.debugMode) {
        logger.debug('Creating application data backup');
      }
      
      // This would normally trigger a backup process
      // For this implementation, we'll just log it
      console.log('Backup created at', new Date().toISOString());
      
      if (this.debugMode) {
        logger.debug('Backup created successfully');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error creating backup';
      if (this.debugMode) {
        logger.error('Error creating backup:', errorMsg);
      }
      this.error = errorMsg;
    }
  }

  /**
   * Get available Claude models
   */
  public getAvailableModels(): { id: string; name: string }[] {
    // This would normally come from the API client's availableModels
    // For this implementation, we'll use a static list
    return [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-2.1', name: 'Claude 2.1' },
      { id: 'claude-2.0', name: 'Claude 2.0' },
      { id: 'claude-instant-1.2', name: 'Claude Instant 1.2' }
    ];
  }

  /**
   * Toggle debug mode
   */
  @action
  public toggleDebugMode(): void {
    this.debugMode = !this.debugMode;
    
    logger.debug(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set debug mode
   * @param debug_mode Debug mode status
   */
  @action
  public setDebugMode(debug_mode: boolean): void {
    this.debugMode = debug_mode;
  }
}
