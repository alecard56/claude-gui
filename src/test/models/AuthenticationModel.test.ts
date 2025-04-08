// File: src/test/models/AuthenticationModel.test.ts
// Purpose: Tests for the AuthenticationModel
// Usage: Run with Jest test runner
// Contains: Unit tests for AuthenticationModel methods
// Dependencies: Jest, RootStore, AuthenticationModel
// Iteration: 2

import { RootStore } from '../../models/RootStore';
import { AuthenticationModel } from '../../models/AuthenticationModel';
import { mockAuthenticationSuccess } from '../test_runner';
import { runInAction } from 'mobx';

// Mock the electronAPI to avoid actual API calls
const originalWindow = { ...window };
const mockElectronAPI = {
  storeApiKey: jest.fn().mockResolvedValue({ success: true }),
  getApiKey: jest.fn().mockResolvedValue('mock-api-key'),
  getActiveProfile: jest.fn().mockResolvedValue({
    id: 'mock-profile-id',
    name: 'Test Profile',
    keyLastDigits: '1234',
  }),
  setSetting: jest.fn().mockResolvedValue({ success: true }),
};

beforeEach(() => {
  window.electronAPI = mockElectronAPI as any;
  jest.clearAllMocks();
});

afterAll(() => {
  window = originalWindow;
});

describe('AuthenticationModel', () => {
  let rootStore: RootStore;
  let authModel: AuthenticationModel;

  beforeEach(() => {
    rootStore = new RootStore();
    authModel = new AuthenticationModel(rootStore);
  });

  describe('initialize', () => {
    it('should load active profile if available', async () => {
      await authModel.initialize(true);
      
      expect(authModel.isAuthenticated).toBe(true);
      expect(authModel.activeProfileId).toBe('mock-profile-id');
      expect(authModel.authProfiles.length).toBe(1);
    });

    it('should handle case with no active profile', async () => {
      window.electronAPI.getActiveProfile = jest.fn().mockResolvedValue(null);
      
      await authModel.initialize(true);
      
      expect(authModel.isAuthenticated).toBe(false);
      expect(authModel.activeProfileId).toBe('');
      expect(authModel.authProfiles.length).toBe(0);
    });

    it('should handle initialization errors', async () => {
      window.electronAPI.getActiveProfile = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await authModel.initialize(true);
      
      expect(authModel.isAuthenticated).toBe(false);
      expect(authModel.activeProfileId).toBe('');
    });
  });

  describe('validateAPIKey', () => {
    it('should validate a valid API key', async () => {
      window.electronAPI.validateApiKey = jest.fn().mockResolvedValue({
        success: true,
        status: 200,
      });

      const result = await authModel.validateAPIKey('valid-api-key');
      
      expect(result).toBe(true);
      expect(authModel.isAuthenticated).toBe(true);
      expect(authModel.isAuthenticating).toBe(false);
      expect(authModel.error).toBe(null);
    });

    it('should handle invalid API key', async () => {
      window.electronAPI.validateApiKey = jest.fn().mockResolvedValue({
        success: false,
        error: 'Invalid API key',
      });

      const result = await authModel.validateAPIKey('invalid-api-key');
      
      expect(result).toBe(false);
      expect(authModel.isAuthenticated).toBe(false);
      expect(authModel.isAuthenticating).toBe(false);
      expect(authModel.error).not.toBe(null);
    });

    it('should handle validation errors', async () => {
      window.electronAPI.validateApiKey = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await authModel.validateAPIKey('api-key');
      
      expect(result).toBe(false);
      expect(authModel.isAuthenticated).toBe(false);
      expect(authModel.isAuthenticating).toBe(false);
      expect(authModel.error).not.toBe(null);
    });
  });

  describe('storeAPIKey', () => {
    it('should store an API key and create a profile', async () => {
      const result = await authModel.storeAPIKey('test-api-key', 'Test Profile');
      
      expect(result).toBe(true);
      expect(window.electronAPI.storeApiKey).toHaveBeenCalled();
      expect(authModel.isAuthenticated).toBe(true);
      expect(authModel.authProfiles.length).toBe(1);
      expect(authModel.authProfiles[0].name).toBe('Test Profile');
    });

    it('should handle storage failure', async () => {
      window.electronAPI.storeApiKey = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Storage error' 
      });

      const result = await authModel.storeAPIKey('test-api-key');
      
      expect(result).toBe(false);
      expect(authModel.error).not.toBe(null);
    });

    it('should handle storage errors', async () => {
      window.electronAPI.storeApiKey = jest.fn().mockRejectedValue(new Error('Storage error'));

      const result = await authModel.storeAPIKey('test-api-key');
      
      expect(result).toBe(false);
      expect(authModel.error).not.toBe(null);
    });
  });

  describe('getActiveProfile', () => {
    it('should return the active profile if available', async () => {
      // Set up an active profile
      window.electronAPI.storeApiKey.mockResolvedValue({ success: true });
      const storeAPISpy = jest.spyOn(authModel, 'storeAPIKey').mockResolvedValue(true);
      
      // Manually set the profile data since storeAPIKey won't run the full implementation in test
      runInAction(() => {
        authModel.activeProfileId = 'test-profile-id';
        authModel.authProfiles = [{
          id: 'test-profile-id',
          name: 'Test Profile',
          keyLastDigits: '1234',
          created: new Date(),
          lastUsed: new Date()
        }];
      });
      
      const profile = authModel.getActiveProfile();
      
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe('Test Profile');
    });

    it('should return null if no active profile', () => {
      // Ensure no active profile
      runInAction(() => {
        authModel.activeProfileId = '';
        authModel.authProfiles = [];
      });
      
      const profile = authModel.getActiveProfile();
      
      expect(profile).toBeNull();
    });
  });

  describe('switchProfile', () => {
    it('should switch to a different profile', async () => {
      // Set up profiles
      window.electronAPI.setSetting.mockResolvedValue({ success: true });
      
      // Manually set up two profiles
      runInAction(() => {
        authModel.authProfiles = [
          {
            id: 'profile-1',
            name: 'Profile 1',
            keyLastDigits: '1234',
            created: new Date(),
            lastUsed: new Date()
          },
          {
            id: 'profile-2',
            name: 'Profile 2',
            keyLastDigits: '5678',
            created: new Date(),
            lastUsed: new Date()
          }
        ];
        authModel.activeProfileId = 'profile-2';
      });
      
      // Switch to the first profile
      const result = await authModel.switchProfile('profile-1');
      
      expect(result).toBe(true);
      expect(authModel.activeProfileId).toBe('profile-1');
      expect(window.electronAPI.setSetting).toHaveBeenCalledWith('auth.activeProfileId', 'profile-1');
    });

    it('should handle non-existent profile', async () => {
      const result = await authModel.switchProfile('non-existent-id');
      
      expect(result).toBe(false);
      expect(authModel.error).not.toBe(null);
    });

    it('should handle switch errors', async () => {
      await authModel.storeAPIKey('test-api-key', 'Test Profile');
      const profileId = authModel.activeProfileId;
      
      window.electronAPI.setSetting = jest.fn().mockRejectedValue(new Error('Switch error'));
      
      const result = await authModel.switchProfile(profileId);
      
      expect(result).toBe(false);
      expect(authModel.error).not.toBe(null);
    });
  });

  describe('deleteProfile', () => {
    it('should delete a profile', async () => {
      // Set up a profile
      window.electronAPI.setSetting.mockResolvedValue({ success: true });
      
      // Manually set up a profile
      runInAction(() => {
        authModel.authProfiles = [
          {
            id: 'test-profile',
            name: 'Test Profile',
            keyLastDigits: '1234',
            created: new Date(),
            lastUsed: new Date()
          }
        ];
        authModel.activeProfileId = 'test-profile';
        authModel.isAuthenticated = true;
      });
      
      const result = await authModel.deleteProfile('test-profile');
      
      expect(result).toBe(true);
      expect(authModel.authProfiles.length).toBe(0);
      expect(authModel.activeProfileId).toBe('');
      expect(authModel.isAuthenticated).toBe(false);
    });

    it('should handle deletion errors', async () => {
      await authModel.storeAPIKey('test-api-key', 'Test Profile');
      const profileId = authModel.activeProfileId;
      
      window.electronAPI.setSetting = jest.fn().mockRejectedValue(new Error('Deletion error'));
      
      const result = await authModel.deleteProfile(profileId);
      
      expect(result).toBe(false);
      expect(authModel.error).not.toBe(null);
    });
  });

  describe('checkAuthentication', () => {
    it('should verify authentication with valid key', async () => {
      // Set up mock validation
      window.electronAPI.validateApiKey.mockResolvedValue({
        success: true,
        status: 200,
      });
      window.electronAPI.getApiKey.mockResolvedValue('test-api-key');
      window.electronAPI.getActiveProfile.mockResolvedValue({
        id: 'test-profile',
        name: 'Test Profile',
        keyLastDigits: '1234',
        created: new Date(),
        lastUsed: new Date(),
      });
      
      // Spy on validateAPIKey to return success
      jest.spyOn(authModel, 'validateAPIKey').mockResolvedValue(true);
      
      // Reset authentication state
      runInAction(() => {
        authModel.isAuthenticated = false;
      });
      
      const result = await authModel.checkAuthentication();
      
      expect(result).toBe(true);
      expect(authModel.isAuthenticated).toBe(true);
    });

    it('should handle invalid or expired key', async () => {
      // Set up mock validation to fail
      window.electronAPI.validateApiKey.mockResolvedValue({
        success: false,
        error: 'Invalid API key',
      });
      window.electronAPI.getApiKey.mockResolvedValue('invalid-api-key');
      window.electronAPI.getActiveProfile.mockResolvedValue({
        id: 'test-profile',
        name: 'Test Profile',
        keyLastDigits: '1234',
      });
      
      // Mock validateAPIKey to return false for invalid key
      jest.spyOn(authModel, 'validateAPIKey').mockResolvedValue(false);
      
      // Set initial state
      runInAction(() => {
        authModel.isAuthenticated = true; // Will become false after check
      });
      
      const result = await authModel.checkAuthentication();
      
      expect(result).toBe(false);
      expect(authModel.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear authentication state', async () => {
      // Set up a profile and authentication
      window.electronAPI.setSetting.mockResolvedValue({ success: true });
      
      // Set authentication state
      runInAction(() => {
        authModel.isAuthenticated = true;
        authModel.activeProfileId = 'test-profile';
        authModel.authProfiles = [{
          id: 'test-profile',
          name: 'Test Profile',
          keyLastDigits: '1234',
          created: new Date(),
          lastUsed: new Date()
        }];
      });
      
      const result = await authModel.logout();
      
      expect(result).toBe(true);
      expect(authModel.isAuthenticated).toBe(false);
      expect(authModel.activeProfileId).toBe('');
    });

    it('should handle logout errors', async () => {
      await authModel.storeAPIKey('test-api-key', 'Test Profile');
      
      window.electronAPI.setSetting = jest.fn().mockRejectedValue(new Error('Logout error'));
      
      const result = await authModel.logout();
      
      expect(result).toBe(false);
      expect(authModel.error).not.toBe(null);
    });
  });

  describe('reset', () => {
    it('should reset all properties to default values', async () => {
      // Set up a profile and authenticate
      await authModel.storeAPIKey('test-api-key', 'Test Profile');
      
      // Reset the model
      authModel.reset();
      
      expect(authModel.isAuthenticated).toBe(false);
      expect(authModel.isAuthenticating).toBe(false);
      expect(authModel.authProfiles).toEqual([]);
      expect(authModel.activeProfileId).toBe('');
      expect(authModel.error).toBe(null);
    });
  });
});