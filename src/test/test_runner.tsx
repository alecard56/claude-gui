// File: src/test/test_runner.tsx
// Purpose: Main test runner for the Claude API GUI application
// Usage: Used by Jest to configure and run all application tests
// Contains: Test environment setup, mock configurations, and utility functions
// Dependencies: Jest, React Testing Library, Mock implementations
// Iteration: 1

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider, theme } from '@chakra-ui/react';
import { RootStore } from '../models/RootStore';
import { StoreProvider } from '../utils/StoreContext';
import { configure, runInAction } from 'mobx';

// Configure MobX for non-decorator usage in tests
configure({
  useProxies: "always",
  enforceActions: "never",
});

// Configure MobX
import { configure } from 'mobx';

// Use non-decorator syntax for MobX in tests
configure({
  useProxies: "always",
  enforceActions: "never",
});
  storeApiKey: jest.fn().mockResolvedValue({ success: true }),
  getApiKey: jest.fn().mockResolvedValue('mock-api-key'),
  getActiveProfile: jest.fn().mockResolvedValue({
    id: 'mock-profile-id',
    name: 'Test Profile',
    keyLastDigits: '1234',
    created: new Date(),
    lastUsed: new Date(),
  }),
  getAppPath: jest.fn().mockResolvedValue('/mock/path'),
  saveConversation: jest.fn().mockResolvedValue({ success: true }),
  getConversations: jest.fn().mockResolvedValue([]),
  getConversationById: jest.fn().mockResolvedValue(null),
  deleteConversation: jest.fn().mockResolvedValue({ success: true }),
  getSetting: jest.fn().mockResolvedValue(null),
  setSetting: jest.fn().mockResolvedValue({ success: true }),
  recordUsage: jest.fn().mockResolvedValue({ success: true }),
  getUsageStats: jest.fn().mockResolvedValue(null),
  validateApiKey: jest.fn().mockResolvedValue({ success: true, status: 200 }),
  sendPrompt: jest.fn().mockResolvedValue({ 
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
      }
    }
  }),
};

// Create a customized render function with providers
const createTestStore = () => {
  const rootStore = new RootStore();
  
  // Initialize stores with test data
  // Use runInAction to update observable properties
  runInAction(() => {
    rootStore.authStore.isAuthenticated = true;
    rootStore.authStore.activeProfileId = 'mock-profile-id';
    rootStore.authStore.authProfiles = [{
      id: 'mock-profile-id',
      name: 'Test Profile',
      keyLastDigits: '1234',
      created: new Date(),
      lastUsed: new Date(),
    }];
  });
  
  return rootStore;
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: RootStore;
}

const customRender = (
  ui: React.ReactElement,
  { store = createTestStore(), ...options }: CustomRenderOptions = {}
) => {
  const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const mockSendPrompt = window.electronAPI.sendPrompt as jest.Mock;
  
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
  const mockValidateApiKey = window.electronAPI.validateApiKey as jest.Mock;
  
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
  
  const mockGetConversations = window.electronAPI.getConversations as jest.Mock;
  mockGetConversations.mockResolvedValue(conversations);
  
  return conversations;
};

// Mock browser APIs that may not be available in the test environment
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { value: jest.fn() });
}

// Mock for react-markdown to avoid issues with processing markdown in tests
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
  };
});