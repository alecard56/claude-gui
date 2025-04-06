// File: src/test/jest.setup.js
// Purpose: Setup file for Jest tests
// Usage: Run before each test by Jest
// Contains: Testing library setup and global mocks
// Dependencies: Jest, Testing Library
// Iteration: 3

// Import jest-dom matchers
require('@testing-library/jest-dom');

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

// Mock react-markdown without using JSX syntax
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