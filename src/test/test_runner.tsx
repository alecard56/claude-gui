// File: src/test/test_runner.tsx
// Purpose: Main test runner for the Claude API GUI application
// Usage: Used by Jest to configure and run all application tests
// Contains: Test environment setup, mock configurations, and utility functions
// Dependencies: Jest, React Testing Library, Mock implementations
// Iteration: 3

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider, theme } from '@chakra-ui/react';
import { RootStore } from '../models/RootStore';
import { StoreProvider } from '../utils/StoreContext';
import { configure, runInAction } from 'mobx';

// Configure MobX for tests
// This sets more permissive settings for tests than we'd use in production
configure({
  enforceActions: "never",  // Don't require actions for state modifications in tests
  useProxies: "always",     // Use Proxy objects for better compatibility
  isolateGlobalState: true, // Isolate global state for tests
  disableErrorBoundaries: false, // Keep error boundaries for better error reporting
});

// Mock functions for the electronAPI
const mockStoreApiKey = jest.fn().mockResolvedValue({ success: true });
const mockGetApiKey = jest.fn().mockResolvedValue('mock-api-key');
const mockGetActiveProfile = jest.fn().mockResolvedValue({
  id: 'mock-profile-id',
  name: 'Test Profile',
  keyLastDigits: '1234',
  created: new Date(),
  lastUsed: new Date(),
});
const mockGetAppPath = jest.fn().mockResolvedValue('/mock/path');
const mockSaveConversation = jest.fn().mockResolvedValue({ success: true });
const mockGetConversations = jest.fn().mockResolvedValue([]);
const mockGetConversationById = jest.fn().mockResolvedValue(null);
const mockDeleteConversation = jest.fn().mockResolvedValue({ success: true });
const mockGetSetting = jest.fn().mockResolvedValue(null);
const mockSetSetting = jest.fn().mockResolvedValue({ success: true });
const mockRecordUsage = jest.fn().mockResolvedValue({ success: true });
const mockGetUsageStats = jest.fn().mockResolvedValue(null);
const mockValidateApiKey = jest.fn().mockResolvedValue({ success: true, status: 200 });
const mockSendPrompt = jest.fn().mockResolvedValue({
  success: true,
  data: {
    id: 'mock-response-id',
    type: 'text',
    content: [{ type: 'text', text: 'This is a mock response from Claude API.' }],
    model: 'claude-3-opus-20240229',
    stop_reason: null,
    stop_sequence: null,
    usage: {
      input_tokens: 10,
      output_tokens: 20,
    },
  },
});

// Setup window.electronAPI
beforeAll(() => {
  // Define electronAPI on window if it doesn't exist
  if (!window.electronAPI) {
    Object.defineProperty(window, 'electronAPI', {
      value: {
        storeApiKey: mockStoreApiKey,
        getApiKey: mockGetApiKey,
        getActiveProfile: mockGetActiveProfile,
        getAppPath: mockGetAppPath,
        saveConversation: mockSaveConversation,
        getConversations: mockGetConversations,
        getConversationById: mockGetConversationById,
        deleteConversation: mockDeleteConversation,
        getSetting: mockGetSetting,
        setSetting: mockSetSetting,
        recordUsage: mockRecordUsage,
        getUsageStats: mockGetUsageStats,
        validateApiKey: mockValidateApiKey,
        sendPrompt: mockSendPrompt,
      },
      writable: true,
      configurable: true
    });
  }
});

// Helper to reset all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Create a test store with initialized data
const createTestStore = () => {
  const rootStore = new RootStore();
  
  // Initialize stores with test data using runInAction to ensure MobX tracking
  runInAction(() => {
    // Set up auth store
    rootStore.authStore.isAuthenticated = true;
    rootStore.authStore.activeProfileId = 'mock-profile-id';
    rootStore.authStore.authProfiles = [{
      id: 'mock-profile-id',
      name: 'Test Profile',
      keyLastDigits: '1234',
      created: new Date(),
      lastUsed: new Date(),
    }];

    // Set up API store with default parameters
    rootStore.apiStore.currentParams = {
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.9,
    };
    
    rootStore.apiStore.availableModels = [
      {
        name: 'claude-3-opus-20240229',
        description: 'Most powerful model',
        contextWindow: 200000,
        maxTokens: 4096,
      },
      {
        name: 'claude-3-sonnet-20240229',
        description: 'Balanced model',
        contextWindow: 200000,
        maxTokens: 4096,
      },
    ];
  });
  
  return rootStore;
};

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: RootStore;
}

const customRender = (
  ui: React.ReactElement,
  { store = createTestStore(), ...options }: CustomRenderOptions = {}
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <StoreProvider value={store}>
        <ChakraProvider theme={theme}>
          {children}
        </ChakraProvider>
      </StoreProvider>
    );
  };
  
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Helper functions for tests
export const mockApiResponse = (success = true, data = {}) => {
  if (success) {
    mockSendPrompt.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'mock-response-id',
        type: 'text',
        content: [{ type: 'text', text: 'This is a mock response from Claude API.' }],
        model: 'claude-3-opus-20240229',
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
        ...data,
      },
    });
  } else {
    mockSendPrompt.mockResolvedValueOnce({
      success: false,
      error: 'Mock API error',
      ...data,
    });
  }
};

export const mockAuthenticationSuccess = (success = true) => {
  if (success) {
    mockValidateApiKey.mockResolvedValueOnce({
      success: true,
      status: 200,
      data: { available_models: [] },
    });
  } else {
    mockValidateApiKey.mockResolvedValueOnce({
      success: false,
      error: 'Invalid API key',
    });
  }
};

export const mockConversationData = (count = 3) => {
  const conversations = [];
  
  for (let i = 0; i < count; i++) {
    conversations.push({
      id: `conversation-${i}`,
      title: `Test Conversation ${i}`,
      createdAt: new Date(Date.now() - (i * 86400000)), // Each one day earlier
      updatedAt: new Date(Date.now() - (i * 86400000)),
      messages: [
        {
          id: `message-${i}-1`,
          role: 'user',
          content: `Test message ${i}`,
          createdAt: new Date(Date.now() - (i * 86400000)),
          metadata: {
            tokens: 5,
          },
        },
        {
          id: `message-${i}-2`,
          role: 'assistant',
          content: `Test response ${i}`,
          createdAt: new Date(Date.now() - (i * 86400000) + 1000),
          metadata: {
            tokens: 10,
            model: 'claude-3-opus-20240229',
          },
        },
      ],
      tags: i % 2 === 0 ? ['test', 'example'] : ['test'],
      metadata: {
        model: 'claude-3-opus-20240229',
        totalTokens: 15,
        favorited: i === 0,
      },
    });
  }
  
  mockGetConversations.mockResolvedValue(conversations);
  
  return conversations;
};