// File: src/test/jest.setup.js
// Purpose: Setup file for Jest tests
// Usage: Run before each test by Jest
// Contains: Testing library setup and global mocks
// Dependencies: Jest, Testing Library
// Iteration: 2

// Import jest-dom matchers
require('@testing-library/jest-dom');

// Set up global mocks for items that are used across many tests

// Mock the window.electronAPI
if (typeof global.window === 'undefined') {
  global.window = {};
}

// Define the electronAPI mock object
Object.defineProperty(global.window, 'electronAPI', {
  value: {
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
        },
      },
    }),
  },
  writable: true,
  configurable: true
});

// Mock Chakra UI components to avoid issues with their hooks
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  
  return {
    __esModule: true,
    ...originalModule,
    useColorMode: jest.fn().mockReturnValue({
      colorMode: 'light',
      toggleColorMode: jest.fn(),
    }),
    useDisclosure: jest.fn().mockReturnValue({
      isOpen: false,
      onOpen: jest.fn(),
      onClose: jest.fn(),
    }),
    useToast: jest.fn().mockReturnValue(jest.fn()),
  };
});

// Mock react-markdown
jest.mock('react-markdown', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockMarkdown(props) {
      return React.createElement('div', { 'data-testid': 'markdown' }, props.children);
    }
  };
});

// Mock some browser APIs
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { value: jest.fn() });
}

// Suppress console errors and warnings during tests
// This helps keep the test output clean
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});