// File: src/models/AuthenticationModel.ts
// Module: Model
// Purpose: Manages API authentication state and credentials
// Usage: Accessed through RootStore.authStore
// Contains: API key validation, profile management
// Dependencies: MobX, axios, electron API
// Iteration: 2

import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { RootStore } from './RootStore';

// Type definitions
export interface AuthProfile {
  id: string;
  name: string;
  keyLastDigits: string;
  created: Date;
  lastUsed: Date;
}

/**
 * Model for managing API authentication and credentials
 */
export class AuthenticationModel {
  // Observable properties
  isAuthenticated: boolean = false;
  isAuthenticating: boolean = false;
  authProfiles: AuthProfile[] = [];
  activeProfileId: string = '';
  error: string | null = null;
  
  // Reference to root store for cross-store interactions
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  /**
   * Initialize the authentication model
   * Loads saved profiles and checks active credentials
   */
  async initialize(debug_mode = false) {
    if (debug_mode) {
      console.log('Initializing AuthenticationModel...');
    }
    
    try {
      // Get active profile from electron store
      const activeProfile = await window.electronAPI.getActiveProfile();
      
      if (activeProfile) {
        runInAction(() => {
          this.activeProfileId = activeProfile.id;
          this.authProfiles = [activeProfile];
          this.isAuthenticated = true;
        });
        
        if (debug_mode) {
          console.log('Active profile loaded:', activeProfile.id);
        }
      } else {
        if (debug_mode) {
          console.log('No active profile found');
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth model:', error);
      if (debug_mode) {
        console.error('Auth initialization error details:', error);
      }
    }
  }

  /**
   * Validate an API key by making a test request to the Claude API
   */
  async validateAPIKey(key: string, debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Validating API key...');
    }
    
    this.isAuthenticating = true;
    this.error = null;
    
    try {
      // Make a request via the main process to validate the key
      const result = await window.electronAPI.validateApiKey(key);
      
      if (debug_mode) {
        console.log('API key validation response:', result);
      }
      
      runInAction(() => {
        this.isAuthenticating = false;
        this.isAuthenticated = result.success;
        
        if (!result.success) {
          this.error = result.error || 'Invalid API key or connection error';
        }
      });
      
      return this.isAuthenticated;
    } catch (error) {
      if (debug_mode) {
        console.error('API key validation error:', error);
      }
      
      runInAction(() => {
        this.isAuthenticating = false;
        this.isAuthenticated = false;
        this.error = 'Error validating API key: ' + (error instanceof Error ? error.message : 'Unknown error');
      });
      
      return false;
    }
  }

  /**
   * Store an API key and create a profile
   */
  async storeAPIKey(key: string, profileName = 'Default', debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Storing API key for profile:', profileName);
    }
    
    try {
      const profileId = uuidv4();
      const result = await window.electronAPI.storeApiKey(profileId, key);
      
      if (result.success) {
        const newProfile: AuthProfile = {
          id: profileId,
          name: profileName,
          keyLastDigits: key.slice(-4),
          created: new Date(),
          lastUsed: new Date()
        };
        
        runInAction(() => {
          this.authProfiles.push(newProfile);
          this.activeProfileId = profileId;
          this.isAuthenticated = true;
        });
        
        if (debug_mode) {
          console.log('API key stored successfully');
        }
        
        return true;
      }
      
      if (debug_mode) {
        console.error('Failed to store API key:', result.error);
      }
      
      runInAction(() => {
        this.error = result.error || 'Failed to store API key';
      });
      
      return false;
    } catch (error) {
      if (debug_mode) {
        console.error('Error storing API key:', error);
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error storing API key';
      });
      
      return false;
    }
  }

  /**
   * Get the active profile
   */
  getActiveProfile(): AuthProfile | null {
    return this.authProfiles.find(profile => profile.id === this.activeProfileId) || null;
  }

  /**
   * Switch to a different profile
   */
  async switchProfile(profileId: string, debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Switching to profile:', profileId);
    }
    
    const profile = this.authProfiles.find(p => p.id === profileId);
    
    if (!profile) {
      if (debug_mode) {
        console.error('Profile not found:', profileId);
      }
      
      runInAction(() => {
        this.error = 'Profile not found';
      });
      
      return false;
    }
    
    try {
      // Update last used timestamp
      profile.lastUsed = new Date();
      
      // Update active profile in store
      const result = await window.electronAPI.setSetting('auth.activeProfileId', profileId);
      
      if (result.success) {
        runInAction(() => {
          this.activeProfileId = profileId;
        });
        
        if (debug_mode) {
          console.log('Switched to profile:', profileId);
        }
        
        return true;
      }
      
      if (debug_mode) {
        console.error('Failed to switch profile:', result.error);
      }
      
      runInAction(() => {
        this.error = result.error || 'Failed to switch profile';
      });
      
      return false;
    } catch (error) {
      if (debug_mode) {
        console.error('Error switching profile:', error);
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error switching profile';
      });
      
      return false;
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string, debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Deleting profile:', profileId);
    }
    
    try {
      // Delete the profile from storage
      const result = await window.electronAPI.setSetting(`auth.keys.${profileId}`, null);
      
      if (result.success) {
        runInAction(() => {
          // Remove from profiles array
          this.authProfiles = this.authProfiles.filter(p => p.id !== profileId);
          
          // If we deleted the active profile, switch to another one or clear
          if (this.activeProfileId === profileId) {
            this.activeProfileId = this.authProfiles.length > 0 ? this.authProfiles[0].id : '';
            this.isAuthenticated = this.authProfiles.length > 0;
          }
        });
        
        // Update active profile in storage if needed
        if (this.activeProfileId !== profileId) {
          await window.electronAPI.setSetting('auth.activeProfileId', this.activeProfileId);
        }
        
        if (debug_mode) {
          console.log('Profile deleted:', profileId);
        }
        
        return true;
      }
      
      if (debug_mode) {
        console.error('Failed to delete profile:', result.error);
      }
      
      runInAction(() => {
        this.error = result.error || 'Failed to delete profile';
      });
      
      return false;
    } catch (error) {
      if (debug_mode) {
        console.error('Error deleting profile:', error);
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error deleting profile';
      });
      
      return false;
    }
  }

  /**
   * Check if the user is currently authenticated
   */
  async checkAuthentication(debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Checking authentication...');
    }
    
    // If we already know we're authenticated, return early
    if (this.isAuthenticated && this.activeProfileId) {
      return true;
    }
    
    try {
      // Try to get the active profile
      const activeProfile = await window.electronAPI.getActiveProfile();
      
      if (!activeProfile) {
        if (debug_mode) {
          console.log('No active profile found during authentication check');
        }
        
        runInAction(() => {
          this.isAuthenticated = false;
        });
        
        return false;
      }
      
      // Try to get the API key
      const apiKey = await window.electronAPI.getApiKey(activeProfile.id);
      
      if (!apiKey) {
        if (debug_mode) {
          console.log('No API key found for active profile');
        }
        
        runInAction(() => {
          this.isAuthenticated = false;
        });
        
        return false;
      }
      
      // Validate the API key
      const isValid = await this.validateAPIKey(apiKey, debug_mode);
      
      runInAction(() => {
        this.isAuthenticated = isValid;
        
        if (isValid) {
          this.activeProfileId = activeProfile.id;
          
          // Ensure profile is in our list
          if (!this.authProfiles.some(p => p.id === activeProfile.id)) {
            this.authProfiles.push({
              id: activeProfile.id,
              name: activeProfile.name || 'Default',
              keyLastDigits: activeProfile.keyLastDigits || '****',
              created: new Date(activeProfile.created || Date.now()),
              lastUsed: new Date(),
            });
          }
        }
      });
      
      return isValid;
    } catch (error) {
      if (debug_mode) {
        console.error('Error checking authentication:', error);
      }
      
      runInAction(() => {
        this.isAuthenticated = false;
        this.error = error instanceof Error ? error.message : 'Unknown error checking authentication';
      });
      
      return false;
    }
  }

  /**
   * Log out the current user
   */
  async logout(debug_mode = false): Promise<boolean> {
    if (debug_mode) {
      console.log('Logging out...');
    }
    
    try {
      // Clear active profile
      await window.electronAPI.setSetting('auth.activeProfileId', '');
      
      runInAction(() => {
        this.isAuthenticated = false;
        this.activeProfileId = '';
      });
      
      if (debug_mode) {
        console.log('Logged out successfully');
      }
      
      return true;
    } catch (error) {
      if (debug_mode) {
        console.error('Error logging out:', error);
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error logging out';
      });
      
      return false;
    }
  }

  /**
   * Reset the authentication model state
   */
  reset() {
    this.isAuthenticated = false;
    this.isAuthenticating = false;
    this.authProfiles = [];
    this.activeProfileId = '';
    this.error = null;
  }
}