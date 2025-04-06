// File: src/models/RootStore.ts
// Module: Model
// Purpose: Central store that coordinates all other stores
// Usage: Instantiated once at app startup, passed to StoreProvider
// Contains: All model stores, provides access to shared state
// Dependencies: MobX, other model stores
// Iteration: 1

import { makeAutoObservable } from 'mobx';
import { AuthenticationModel } from './AuthenticationModel';
import { ConversationModel } from './ConversationModel';
import { APIModel } from './APIModel';
import { SettingsModel } from './SettingsModel';
import { TokenUsageModel } from './TokenUsageModel';

/**
 * Root store that contains all other stores and provides
 * a single access point for the application state.
 */
export class RootStore {
  authStore: AuthenticationModel;
  conversationStore: ConversationModel;
  apiStore: APIModel;
  settingsStore: SettingsModel;
  usageStore: TokenUsageModel;

  constructor() {
    // Initialize all stores
    this.authStore = new AuthenticationModel(this);
    this.settingsStore = new SettingsModel(this);
    this.apiStore = new APIModel(this);
    this.usageStore = new TokenUsageModel(this);
    this.conversationStore = new ConversationModel(this);
    
    // Make all properties observable
    makeAutoObservable(this);
  }

  /**
   * Reset all stores to their initial state.
   * Useful for logging out or clearing application state.
   */
  resetAllStores() {
    this.authStore.reset();
    this.conversationStore.reset();
    this.apiStore.reset();
    this.settingsStore.reset();
    this.usageStore.reset();
  }

  /**
   * Initialize all stores on application startup.
   * Loads data from persistent storage.
   */
  async initialize(debug_mode = false) {
    if (debug_mode) {
      console.log('Initializing RootStore...');
    }

    try {
      // Initialize stores in the correct order to handle dependencies
      await this.settingsStore.initialize(debug_mode);
      await this.authStore.initialize(debug_mode);
      await this.apiStore.initialize(debug_mode);
      await this.usageStore.initialize(debug_mode);
      await this.conversationStore.initialize(debug_mode);
      
      if (debug_mode) {
        console.log('RootStore initialization complete');
      }
    } catch (error) {
      console.error('Failed to initialize RootStore:', error);
      throw error;
    }
  }
}