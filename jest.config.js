// File: jest.config.js
// Purpose: Configuration for Jest test runner
// Usage: Referenced when running Jest
// Contains: Configuration options for Jest
// Dependencies: None
// Iteration: 2

module.exports = {
    // The root directory that Jest should scan for tests and modules
    rootDir: './',
    
    // The test environment that will be used for testing
    testEnvironment: 'jsdom',
    
    // The glob patterns Jest uses to detect test files
    testMatch: [
      '**/src/test/**/*.test.(ts|tsx)',
      '**/__tests__/**/*.(ts|tsx)',
      '**/?(*.)+(spec|test).(ts|tsx)'
    ],
    
    // An array of regexp pattern strings that are matched against all test paths
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/'
    ],
    
    // An array of file extensions your modules use
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    
    // Module name mapper to handle assets and aliases
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': '<rootDir>/src/test/__mocks__/styleMock.js',
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        '<rootDir>/src/test/__mocks__/fileMock.js',
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@components/(.*)$': '<rootDir>/src/renderer/components/$1',
      '^@models/(.*)$': '<rootDir>/src/models/$1',
      '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
      '^@views/(.*)$': '<rootDir>/src/renderer/views/$1',
      '^@utils/(.*)$': '<rootDir>/src/utils/$1'
    },
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/test/jest.setup.js'],
    
    // Transform files with ts-jest and babel-jest
    transform: {
      '^.+\\.(ts|tsx)$': [
        'ts-jest',
        {
          babelConfig: true,
        },
      ],
      '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.js' }],
    },
    
    // Global variables available in all test files
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.test.json'
      }
    },
    
    // Coverage configuration
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/test/**',
      '!src/main/**',
      '!src/**/__mocks__/**'
    ],
    
    // Coverage directory
    coverageDirectory: 'coverage',
    
    // Whether to use watchman for file crawling
    watchman: true
  };