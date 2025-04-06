/**
 * File: src/controllers/AppController.ts
 * Module: Controller
 * Purpose: Main application controller handling initialization and coordination
 * Usage: Imported by main.tsx to initialize and control the application
 * Contains: AppController class
 * Dependencies: models, controllers, electron
 * Iteration: 1
 */

import { observable, action, makeObservable } from 'mobx';
import { ClaudeAPIClient } from '../models/ClaudeAPIClient';
import { ConversationModel } from '../models/ConversationModel';
import { SettingsModel } from '../models/SettingsModel';
import { TokenCounter } from '../models/TokenCounter';
import { ConversationController } from './ConversationController';
import { SettingsController } from './SettingsController';
import * as logger from '../utils/logger';

// Import electron modules
const { app, dialog } = window.require('electron');

/**
 * Main application controller that coordinates between models and sub-controllers
 */
export class AppController {
  private apiClient: ClaudeAPIClient;
  private conversationModel: ConversationModel;
  private settingsModel: SettingsModel;
  private tokenCounter: TokenCounter;
  
  private conversationController: ConversationController;
  private settingsController: SettingsController;
  
  @observable isInitialized: boolean = false;
  @observable error: string | null = null;
  @observable debug_mode: boolean = false;

  constructor(debug_mode: boolean = false) {
    this.debug_mode = debug_mode;
    
    if (debug_mode) logger.debug('Initializing AppController');
    
    // Initialize models
    this.apiClient = new ClaudeAPIClient(debug_mode);
    this.conversationModel = new ConversationModel(debug_mode);
    this.settingsModel = new SettingsModel(debug_mode);
    this.tokenCounter = new TokenCounter(debug_mode);
    
    // Initialize controllers
    this.conversationController = new ConversationController(
      this.conversationModel,
      this.apiClient,
      this.tokenCounter,
      this.settingsModel,
      debug_mode
    );
    
    this.settingsController = new SettingsController(
      this.settingsModel,
      this.apiClient,
      debug_mode
    );
    
    makeObservable(this);
    
    if (debug_mode) logger.debug('AppController initialization complete');
  }

  /**
   * Initialize the application
   */
  @action
  public async initialize(): Promise<void> {
    try {
      if (this.debug_mode) logger.debug('Starting application initialization');
      
      // Load settings
      const settings = this.settingsModel.getSettings();
      
      // Check for API key and authentication
      const apiKey = await this.checkAuthentication();
      
      if (!apiKey) {
        if (this.debug_mode) logger.debug('No API key found, prompting for authentication');
        await this.promptForAPIKey();
      } else {
        if (this.debug_mode) logger.debug('API key found, validating');
        // Validate existing API key
        const isValid = await this.apiClient.validateAPIKey(apiKey);
        
        if (!isValid) {
          if (this.debug_mode) logger.debug('Existing API key is invalid, prompting for new key');
          await this.promptForAPIKey();
        }
      }
      
      // Load available models
      await this.apiClient.getModels(this.debug_mode);
      
      // Create initial conversation if none exists
      if (this.conversationModel.conversations.length === 0) {
        if (this.debug_mode) logger.debug('Creating initial conversation');
        this.conversationModel.createConversation('New Conversation', this.debug_mode);
      }
      
      this.isInitialized = true;
      if (this.debug_mode) logger.debug('Application initialization complete');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during initialization';
      if (this.debug_mode) logger.error('Error during application initialization:', errorMsg);
      this.error = `Initialization failed: ${errorMsg}`;
      throw error;
    }
  }

  /**
   * Check for existing API key
   */
  private async checkAuthentication(): Promise<string | null> {
    // This would use a secure storage mechanism in a real app
    // For now, we'll just return null to simulate no API key
    return null;
  }

  /**
   * Prompt user for API key
   */
  private async promptForAPIKey(): Promise<void> {
    // In a real app, this would show a UI prompt
    // For this implementation, we'll use a simulated API key
    const simulatedApiKey = 'sk-ant-api123456789';
    await this.apiClient.validateAPIKey(simulatedApiKey, 'Default', this.debug_mode);
    
    if (this.debug_mode) logger.debug('API key validation completed');
  }

  /**
   * Get the conversation controller
   */
  public getConversationController(): ConversationController {
    return this.conversationController;
  }

  /**
   * Get the settings controller
   */
  public getSettingsController(): SettingsController {
    return this.settingsController;
  }

  /**
   * Show the about dialog
   */
  public showAboutDialog(): void {
    if (this.debug_mode) logger.debug('Showing about dialog');
    
    // In Electron we would use dialog.showMessageBox
    // For this implementation, we'll just log it
    const message = `
      Claude API GUI
      Version: 1.0.0
      
      A desktop application for interacting with Claude AI
      via the Anthropic API.
    `;
    
    console.log(message);
  }

  /**
   * Toggle debug mode
   */
  @action
  public toggleDebugMode(): void {
    this.debug_mode = !this.debug_mode;
    
    // Also toggle debug mode in all controllers and models
    this.conversationController.setDebugMode(this.debug_mode);
    this.settingsController.setDebugMode(this.debug_mode);
    
    logger.setLevel(this.debug_mode ? 'debug' : 'info');
    logger.debug(`Debug mode ${this.debug_mode ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get debug mode status
   */
  public isDebugMode(): boolean {
    return this.debug_mode;
  }

  /**
   * Handle application exit
   */
  public async handleExit(): Promise<void> {
    if (this.debug_mode) logger.debug('Handling application exit');
    
    // Save any pending changes
    // Clean up resources
    
    if (this.debug_mode) logger.debug('Application exit complete');
  }
}
