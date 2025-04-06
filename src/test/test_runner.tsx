/**
 * File: src/test/test_runner.tsx
 * Module: Testing
 * Purpose: Automated testing framework for the application
 * Usage: Run to execute tests for the application
 * Contains: TestRunner class, test cases, and test utilities
 * Dependencies: react-testing-library, jest, models, controllers, views
 * Iteration: 1
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as logger from '../utils/logger';

// Import models
import { ClaudeAPIClient } from '../models/ClaudeAPIClient';
import { ConversationModel } from '../models/ConversationModel';
import { SettingsModel } from '../models/SettingsModel';
import { TokenCounter } from '../models/TokenCounter';

// Import controllers
import { AppController } from '../controllers/AppController';
import { ConversationController } from '../controllers/ConversationController';
import { SettingsController } from '../controllers/SettingsController';

// Import views for component testing
import AppView from '../views/AppView';
import PromptInputView from '../views/PromptInputView';
import ResponseDisplayView from '../views/ResponseDisplayView';
import ConversationHistoryView from '../views/ConversationHistoryView';
import SettingsView from '../views/SettingsView';

/**
 * Test utilities
 */
class TestUtils {
  static debug_mode = true;
  
  static createMockAPIClient(): ClaudeAPIClient {
    const client = new ClaudeAPIClient(this.debug_mode);
    
    // Mock API responses
    jest.spyOn(client, 'sendPrompt').mockImplementation(async (prompt, params) => {
      return {
        id: 'mock-response-id',
        type: 'message',
        role: 'assistant',
        content: `This is a mock response to: "${prompt}"`,
        model: params?.model || 'claude-3-opus-20240229',
        stopReason: null,
        stopSequence: null,
        usage: {
          inputTokens: prompt.length / 4,
          outputTokens: 50
        }
      };
    });
    
    jest.spyOn(client, 'validateAPIKey').mockResolvedValue(true);
    
    return client;
  }
  
  static setupTestEnvironment() {
    // Enable debug mode for all tests
    logger.setLevel('debug');
    
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        length: 0,
        key: (i: number) => ''
      };
    })();
    
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock electron store
    jest.mock('electron-store', () => {
      return class MockStore {
        private data: Record<string, any> = {};
        
        constructor(options?: any) {
          this.data = options?.defaults || {};
        }
        
        get(key: string, defaultValue?: any) {
          return key in this.data ? this.data[key] : defaultValue;
        }
        
        set(key: string, value: any) {
          this.data[key] = value;
        }
        
        has(key: string) {
          return key in this.data;
        }
        
        delete(key: string) {
          delete this.data[key];
        }
        
        clear() {
          this.data = {};
        }
      };
    });
  }
}

/**
 * Test cases for models
 */
class ModelTests {
  static runAll() {
    this.testClaudeAPIClient();
    this.testConversationModel();
    this.testSettingsModel();
    this.testTokenCounter();
  }
  
  static testClaudeAPIClient() {
    describe('ClaudeAPIClient', () => {
      let apiClient: ClaudeAPIClient;
      
      beforeEach(() => {
        apiClient = TestUtils.createMockAPIClient();
      });
      
      test('Should validate API key', async () => {
        const result = await apiClient.validateAPIKey('mock-api-key', 'Test Profile', true);
        expect(result).toBe(true);
      });
      
      test('Should send prompt and receive response', async () => {
        const response = await apiClient.sendPrompt('Test prompt', {}, true);
        expect(response).not.toBeNull();
        expect(response?.role).toBe('assistant');
        expect(response?.content).toContain('Test prompt');
      });
      
      test('Should estimate tokens correctly', () => {
        const text = 'This is a test prompt with approximately 15 tokens.';
        const estimate = apiClient.estimateTokens(text, true);
        expect(estimate).toBeGreaterThan(0);
      });
    });
  }
  
  static testConversationModel() {
    describe('ConversationModel', () => {
      let conversationModel: ConversationModel;
      
      beforeEach(() => {
        conversationModel = new ConversationModel(true);
      });
      
      test('Should create new conversation', () => {
        const conversation = conversationModel.createConversation('Test Conversation', true);
        expect(conversation).not.toBeNull();
        expect(conversation.title).toBe('Test Conversation');
        expect(conversation.messages).toHaveLength(0);
      });
      
      test('Should add message to conversation', () => {
        const conversation = conversationModel.createConversation('Test Conversation', true);
        
        const message = conversationModel.addMessage(
          'user',
          'Test message',
          { tokens: 3 },
          true
        );
        
        expect(message).not.toBeNull();
        expect(conversationModel.activeConversation?.messages).toHaveLength(1);
        expect(conversationModel.activeConversation?.messages[0].content).toBe('Test message');
      });
      
      test('Should update conversation title', () => {
        const conversation = conversationModel.createConversation('Test Conversation', true);
        const result = conversationModel.updateConversationTitle(conversation.id, 'Updated Title', true);
        
        expect(result).toBe(true);
        expect(conversationModel.getConversationById(conversation.id)?.title).toBe('Updated Title');
      });
      
      test('Should delete conversation', () => {
        const conversation = conversationModel.createConversation('Test Conversation', true);
        const initialCount = conversationModel.conversations.length;
        
        const result = conversationModel.deleteConversation(conversation.id, true);
        
        expect(result).toBe(true);
        expect(conversationModel.conversations).toHaveLength(initialCount - 1);
      });
    });
  }
  
  static testSettingsModel() {
    describe('SettingsModel', () => {
      let settingsModel: SettingsModel;
      
      beforeEach(() => {
        settingsModel = new SettingsModel(true);
      });
      
      test('Should have default settings', () => {
        const settings = settingsModel.getSettings();
        
        expect(settings).not.toBeNull();
        expect(settings.theme).toBeDefined();
        expect(settings.api).toBeDefined();
        expect(settings.editor).toBeDefined();
        expect(settings.interface).toBeDefined();
        expect(settings.storage).toBeDefined();
      });
      
      test('Should update setting', () => {
        const newTheme = { ...settingsModel.themeConfig, mode: 'dark' as const };
        settingsModel.updateSetting('theme', newTheme, true);
        
        expect(settingsModel.themeConfig.mode).toBe('dark');
      });
      
      test('Should reset to defaults', () => {
        const newTheme = { ...settingsModel.themeConfig, mode: 'dark' as const };
        settingsModel.updateSetting('theme', newTheme, true);
        
        expect(settingsModel.themeConfig.mode).toBe('dark');
        
        settingsModel.resetToDefaults(true);
        
        expect(settingsModel.themeConfig.mode).toBe('system');
      });
      
      test('Should export and import settings', () => {
        const newTheme = { ...settingsModel.themeConfig, mode: 'dark' as const };
        settingsModel.updateSetting('theme', newTheme, true);
        
        const exported = settingsModel.exportSettings(true);
        expect(exported).not.toBe('');
        
        settingsModel.resetToDefaults(true);
        expect(settingsModel.themeConfig.mode).toBe('system');
        
        const imported = settingsModel.importSettings(exported, true);
        expect(imported).toBe(true);
        expect(settingsModel.themeConfig.mode).toBe('dark');
      });
    });
  }
  
  static testTokenCounter() {
    describe('TokenCounter', () => {
      let tokenCounter: TokenCounter;
      
      beforeEach(() => {
        tokenCounter = new TokenCounter(true);
      });
      
      test('Should record token usage', () => {
        tokenCounter.recordUsage(10, 50, 'claude-3-opus-20240229', true);
        
        const summary = tokenCounter.usageSummary;
        expect(summary.totalPromptTokens).toBe(10);
        expect(summary.totalCompletionTokens).toBe(50);
        expect(summary.totalTokens).toBe(60);
        expect(summary.totalCost).toBeGreaterThan(0);
      });
      
      test('Should estimate token count', () => {
        const text = 'This is a test prompt with approximately 15 tokens.';
        const estimate = tokenCounter.estimateTokenCount(text, true);
        
        expect(estimate).toBeGreaterThan(0);
      });
      
      test('Should reset statistics', () => {
        tokenCounter.recordUsage(10, 50, 'claude-3-opus-20240229', true);
        expect(tokenCounter.usageSummary.totalTokens).toBe(60);
        
        tokenCounter.resetStats(true);
        expect(tokenCounter.usageSummary.totalTokens).toBe(0);
      });
    });
  }
}

/**
 * Test cases for controllers
 */
class ControllerTests {
  static runAll() {
    this.testAppController();
    this.testConversationController();
    this.testSettingsController();
  }
  
  static testAppController() {
    describe('AppController', () => {
      let appController: AppController;
      
      beforeEach(() => {
        appController = new AppController(true);
      });
      
      test('Should initialize app', async () => {
        await appController.initialize();
        expect(appController.isInitialized).toBe(true);
      });
      
      test('Should provide access to child controllers', () => {
        const conversationController = appController.getConversationController();
        const settingsController = appController.getSettingsController();
        
        expect(conversationController).toBeInstanceOf(ConversationController);
        expect(settingsController).toBeInstanceOf(SettingsController);
      });
      
      test('Should toggle debug mode', () => {
        const initialMode = appController.isDebugMode();
        appController.toggleDebugMode();
        expect(appController.isDebugMode()).toBe(!initialMode);
      });
    });
  }
  
  static testConversationController() {
    describe('ConversationController', () => {
      let conversationModel: ConversationModel;
      let apiClient: ClaudeAPIClient;
      let tokenCounter: TokenCounter;
      let settingsModel: SettingsModel;
      let conversationController: ConversationController;
      
      beforeEach(() => {
        conversationModel = new ConversationModel(true);
        apiClient = TestUtils.createMockAPIClient();
        tokenCounter = new TokenCounter(true);
        settingsModel = new SettingsModel(true);
        
        conversationController = new ConversationController(
          conversationModel,
          apiClient,
          tokenCounter,
          settingsModel,
          true
        );
      });
      
      test('Should start new conversation', () => {
        const initialCount = conversationController.getAllConversations().length;
        conversationController.startNewConversation('Test Conversation');
        expect(conversationController.getAllConversations()).toHaveLength(initialCount + 1);
      });
      
      test('Should submit prompt and get response', async () => {
        conversationController.startNewConversation('Test Conversation');
        await conversationController.submitPrompt('Test prompt');
        
        const conversation = conversationController.getActiveConversation();
        expect(conversation?.messages).toHaveLength(2);
        expect(conversation?.messages[0].role).toBe('user');
        expect(conversation?.messages[1].role).toBe('assistant');
      });
      
      test('Should rename conversation', () => {
        conversationController.startNewConversation('Test Conversation');
        const conversation = conversationController.getActiveConversation();
        
        if (!conversation) {
          fail('No active conversation');
          return;
        }
        
        conversationController.renameConversation(conversation.id, 'Updated Title');
        expect(conversationController.getActiveConversation()?.title).toBe('Updated Title');
      });
      
      test('Should delete conversation', () => {
        conversationController.startNewConversation('Test Conversation');
        const conversation = conversationController.getActiveConversation();
        
        if (!conversation) {
          fail('No active conversation');
          return;
        }
        
        const initialCount = conversationController.getAllConversations().length;
        conversationController.deleteConversation(conversation.id);
        expect(conversationController.getAllConversations()).toHaveLength(initialCount - 1);
      });
    });
  }
  
  static testSettingsController() {
    describe('SettingsController', () => {
      let settingsModel: SettingsModel;
      let apiClient: ClaudeAPIClient;
      let settingsController: SettingsController;
      
      beforeEach(() => {
        settingsModel = new SettingsModel(true);
        apiClient = TestUtils.createMockAPIClient();
        settingsController = new SettingsController(settingsModel, apiClient, true);
      });
      
      test('Should update API config', () => {
        settingsController.updateAPIConfig('temperature', 0.8);
        expect(settingsController.getSettings().api.temperature).toBe(0.8);
      });
      
      test('Should update theme config', () => {
        settingsController.updateThemeConfig('mode', 'dark');
        expect(settingsController.getSettings().theme.mode).toBe('dark');
      });
      
      test('Should reset settings', () => {
        settingsController.updateAPIConfig('temperature', 0.8);
        expect(settingsController.getSettings().api.temperature).toBe(0.8);
        
        settingsController.resetSettings();
        expect(settingsController.getSettings().api.temperature).toBe(0.7);
      });
      
      test('Should export and import settings', () => {
        settingsController.updateAPIConfig('temperature', 0.8);
        const exported = settingsController.exportSettings();
        
        settingsController.resetSettings();
        expect(settingsController.getSettings().api.temperature).toBe(0.7);
        
        const imported = settingsController.importSettings(exported);
        expect(imported).toBe(true);
        expect(settingsController.getSettings().api.temperature).toBe(0.8);
      });
    });
  }
}

/**
 * Test cases for views (component tests)
 */
class ViewTests {
  static runAll() {
    this.testPromptInputView();
    this.testResponseDisplayView();
    this.testConversationHistoryView();
    this.testSettingsView();
    this.testAppView();
  }
  
  static testPromptInputView() {
    describe('PromptInputView', () => {
      let conversationModel: ConversationModel;
      let apiClient: ClaudeAPIClient;
      let tokenCounter: TokenCounter;
      let settingsModel: SettingsModel;
      let conversationController: ConversationController;
      
      beforeEach(() => {
        conversationModel = new ConversationModel(true);
        apiClient = TestUtils.createMockAPIClient();
        tokenCounter = new TokenCounter(true);
        settingsModel = new SettingsModel(true);
        
        conversationController = new ConversationController(
          conversationModel,
          apiClient,
          tokenCounter,
          settingsModel,
          true
        );
        
        conversationController.startNewConversation('Test Conversation');
      });
      
      test('Should render input field', () => {
        render(<PromptInputView controller={conversationController} debug_mode={true} />);
        
        const textarea = screen.getByPlaceholderText('Ask Claude anything...');
        expect(textarea).toBeInTheDocument();
      });
      
      test('Should update text on input', () => {
        render(<PromptInputView controller={conversationController} debug_mode={true} />);
        
        const textarea = screen.getByPlaceholderText('Ask Claude anything...');
        fireEvent.change(textarea, { target: { value: 'Test prompt' } });
        
        expect(textarea).toHaveValue('Test prompt');
      });
      
      test('Should show token count', () => {
        render(<PromptInputView controller={conversationController} debug_mode={true} />);
        
        const textarea = screen.getByPlaceholderText('Ask Claude anything...');
        fireEvent.change(textarea, { target: { value: 'Test prompt with tokens' } });
        
        // The token count badge should be visible
        const tokenBadge = screen.getByText(/tokens$/);
        expect(tokenBadge).toBeInTheDocument();
      });
      
      test('Should enable send button when text is entered', () => {
        render(<PromptInputView controller={conversationController} debug_mode={true} />);
        
        const sendButton = screen.getByText('Send');
        expect(sendButton).toBeDisabled();
        
        const textarea = screen.getByPlaceholderText('Ask Claude anything...');
        fireEvent.change(textarea, { target: { value: 'Test prompt' } });
        
        expect(sendButton).not.toBeDisabled();
      });
    });
  }
  
  static testResponseDisplayView() {
    describe('ResponseDisplayView', () => {
      let conversationModel: ConversationModel;
      let apiClient: ClaudeAPIClient;
      let tokenCounter: TokenCounter;
      let settingsModel: SettingsModel;
      let conversationController: ConversationController;
      
      beforeEach(() => {
        conversationModel = new ConversationModel(true);
        apiClient = TestUtils.createMockAPIClient();
        tokenCounter = new TokenCounter(true);
        settingsModel = new SettingsModel(true);
        
        conversationController = new ConversationController(
          conversationModel,
          apiClient,
          tokenCounter,
          settingsModel,
          true
        );
        
        conversationController.startNewConversation('Test Conversation');
      });
      
      test('Should show empty state when no messages', () => {
        render(<ResponseDisplayView controller={conversationController} debug_mode={true} />);
        
        const emptyState = screen.getByText('No conversation yet');
        expect(emptyState).toBeInTheDocument();
      });
      
      test('Should display messages when conversation has messages', async () => {
        await conversationController.submitPrompt('Test prompt');
        
        render(<ResponseDisplayView controller={conversationController} debug_mode={true} />);
        
        const userMessage = screen.getByText('Test prompt');
        expect(userMessage).toBeInTheDocument();
        
        const assistantMessage = screen.getByText(/This is a mock response/);
        expect(assistantMessage).toBeInTheDocument();
      });
      
      test('Should show copy buttons for messages', async () => {
        await conversationController.submitPrompt('Test prompt');
        
        render(<ResponseDisplayView controller={conversationController} debug_mode={true} />);
        
        const copyButtons = screen.getAllByLabelText('Copy message');
        expect(copyButtons.length).toBe(2); // One for user, one for assistant
      });
    });
  }
  
  static testConversationHistoryView() {
    describe('ConversationHistoryView', () => {
      let conversationModel: ConversationModel;
      let apiClient: ClaudeAPIClient;
      let tokenCounter: TokenCounter;
      let settingsModel: SettingsModel;
      let conversationController: ConversationController;
      
      beforeEach(() => {
        conversationModel = new ConversationModel(true);
        apiClient = TestUtils.createMockAPIClient();
        tokenCounter = new TokenCounter(true);
        settingsModel = new SettingsModel(true);
        
        conversationController = new ConversationController(
          conversationModel,
          apiClient,
          tokenCounter,
          settingsModel,
          true
        );
      });
      
      test('Should render new conversation button', () => {
        render(
          <ConversationHistoryView 
            controller={conversationController} 
            onSelectConversation={() => {}} 
            debug_mode={true} 
          />
        );
        
        const newButton = screen.getByText('New Conversation');
        expect(newButton).toBeInTheDocument();
      });
      
      test('Should show conversations', () => {
        conversationController.startNewConversation('Test Conversation 1');
        conversationController.startNewConversation('Test Conversation 2');
        
        render(
          <ConversationHistoryView 
            controller={conversationController} 
            onSelectConversation={() => {}} 
            debug_mode={true} 
          />
        );
        
        const conv1 = screen.getByText('Test Conversation 1');
        const conv2 = screen.getByText('Test Conversation 2');
        
        expect(conv1).toBeInTheDocument();
        expect(conv2).toBeInTheDocument();
      });
      
      test('Should filter conversations with search', () => {
        conversationController.startNewConversation('Apple Conversation');
        conversationController.startNewConversation('Banana Conversation');
        
        render(
          <ConversationHistoryView 
            controller={conversationController} 
            onSelectConversation={() => {}} 
            debug_mode={true} 
          />
        );
        
        const searchInput = screen.getByPlaceholderText('Search conversations');
        fireEvent.change(searchInput, { target: { value: 'Apple' } });
        
        expect(screen.getByText('Apple Conversation')).toBeInTheDocument();
        expect(screen.queryByText('Banana Conversation')).not.toBeInTheDocument();
      });
    });
  }
  
  static testSettingsView() {
    describe('SettingsView', () => {
      let settingsModel: SettingsModel;
      let apiClient: ClaudeAPIClient;
      let settingsController: SettingsController;
      
      beforeEach(() => {
        settingsModel = new SettingsModel(true);
        apiClient = TestUtils.createMockAPIClient();
        settingsController = new SettingsController(settingsModel, apiClient, true);
      });
      
      test('Should render settings tabs', () => {
        render(<SettingsView controller={settingsController} debug_mode={true} />);
        
        expect(screen.getByText('API')).toBeInTheDocument();
        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText('Editor')).toBeInTheDocument();
        expect(screen.getByText('Interface')).toBeInTheDocument();
        expect(screen.getByText('Storage')).toBeInTheDocument();
        expect(screen.getByText('Advanced')).toBeInTheDocument();
      });
      
      test('Should show model selector', () => {
        render(<SettingsView controller={settingsController} debug_mode={true} />);
        
        expect(screen.getByText('Default Model')).toBeInTheDocument();
        
        // Should show at least one model option
        expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument();
      });
      
      test('Should show temperature slider', () => {
        render(<SettingsView controller={settingsController} debug_mode={true} />);
        
        // The temperature label contains the current value
        expect(screen.getByText(/Temperature:/)).toBeInTheDocument();
      });
    });
  }
  
  static testAppView() {
    describe('AppView', () => {
      let appController: AppController;
      
      beforeEach(async () => {
        appController = new AppController(true);
        await appController.initialize();
      });
      
      test('Should render main layout', async () => {
        render(<AppView controller={appController} debug_mode={true} />);
        
        // Header
        expect(screen.getByText('Claude API GUI')).toBeInTheDocument();
        
        // Initially shows empty state in conversation area
        await waitFor(() => {
          expect(screen.getByText('No conversation yet')).toBeInTheDocument();
        });
        
        // Has prompt input
        expect(screen.getByPlaceholderText('Ask Claude anything...')).toBeInTheDocument();
      });
    });
  }
}

/**
 * Integration tests
 */
class IntegrationTests {
  static runAll() {
    this.testEndToEndConversation();
  }
  
  static testEndToEndConversation() {
    describe('End-to-End Conversation', () => {
      let appController: AppController;
      
      beforeEach(async () => {
        appController = new AppController(true);
        await appController.initialize();
      });
      
      test('Should allow conversation flow', async () => {
        render(<AppView controller={appController} debug_mode={true} />);
        
        // Wait for app to initialize
        await waitFor(() => {
          expect(screen.getByText('No conversation yet')).toBeInTheDocument();
        });
        
        // Find and type in the prompt input
        const promptInput = screen.getByPlaceholderText('Ask Claude anything...');
        fireEvent.change(promptInput, { target: { value: 'Tell me about AI' } });
        
        // Click send button
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        
        // Wait for response
        await waitFor(() => {
          expect(screen.getByText(/This is a mock response/)).toBeInTheDocument();
        });
        
        // Verify both messages are displayed
        expect(screen.getByText('Tell me about AI')).toBeInTheDocument();
        expect(screen.getByText(/This is a mock response/)).toBeInTheDocument();
        
        // Verify prompt input is cleared
        expect(promptInput).toHaveValue('');
      });
    });
  }
}

/**
 * Main test runner
 */
export class TestRunner {
  static run() {
    TestUtils.setupTestEnvironment();
    
    describe('Claude API GUI Tests', () => {
      // Run model tests
      ModelTests.runAll();
      
      // Run controller tests
      ControllerTests.runAll();
      
      // Run view tests
      ViewTests.runAll();
      
      // Run integration tests
      IntegrationTests.runAll();
    });
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  TestRunner.run();
}
