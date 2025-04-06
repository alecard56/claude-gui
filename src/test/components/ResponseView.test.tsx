// File: src/test/components/ResponseView.test.tsx
// Purpose: Tests for the ResponseView component
// Usage: Run with Jest test runner
// Contains: Unit tests for ResponseView component functionality
// Dependencies: React Testing Library, Jest, ResponseView
// Iteration: 1

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test_runner';
import ResponseView from '../../renderer/components/views/ResponseView';
import { RootStore } from '../../models/RootStore';
import { Conversation, Message } from '../../models/ConversationModel';
import { mockConversationData } from '../test_runner';

describe('ResponseView', () => {
  let store: RootStore;
  let mockCopyText: jest.SpyInstance;
  
  // Sample conversation for testing
  const createTestConversation = (): Conversation => ({
    id: 'test-conversation',
    title: 'Test Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        id: 'user-message',
        role: 'user',
        content: 'This is a test prompt',
        createdAt: new Date(),
        metadata: {
          tokens: 5,
        },
      },
      {
        id: 'assistant-message',
        role: 'assistant',
        content: 'This is a test response with **markdown**',
        createdAt: new Date(),
        metadata: {
          tokens: 10,
          model: 'claude-3-opus-20240229',
        },
      },
    ],
    tags: ['test'],
    metadata: {
      model: 'claude-3-opus-20240229',
      totalTokens: 15,
      favorited: false,
    },
  });

  beforeEach(() => {
    store = new RootStore();
    
    // Mock the clipboard API
    mockCopyText = jest.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockCopyText,
      },
      configurable: true,
    });

    jest.clearAllMocks();
  });

  it('shows loading spinner when API is loading', () => {
    store.apiStore.isLoading = true;
    
    render(<ResponseView />, { store });
    
    expect(screen.getByText('Claude is thinking...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
  });

  it('shows empty state when no conversation is active', () => {
    render(<ResponseView />, { store });
    
    expect(screen.getByText('Start a conversation with Claude')).toBeInTheDocument();
    expect(screen.getByText(/Type a message in the input area/)).toBeInTheDocument();
  });

  it('shows empty state when conversation has no messages', () => {
    const emptyConversation: Conversation = {
      ...createTestConversation(),
      messages: [],
    };
    
    store.conversationStore.conversations = [emptyConversation];
    store.conversationStore.activeConversationId = emptyConversation.id;
    
    render(<ResponseView />, { store });
    
    expect(screen.getByText('Start a conversation with Claude')).toBeInTheDocument();
  });

  it('renders conversation messages correctly', () => {
    const conversation = createTestConversation();
    store.conversationStore.conversations = [conversation];
    store.conversationStore.activeConversationId = conversation.id;
    
    // Mock the getActiveConversation method
    jest.spyOn(store.conversationStore, 'getActiveConversation').mockReturnValue(conversation);
    
    render(<ResponseView />, { store });
    
    // Check user message
    expect(screen.getByText('This is a test prompt')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    
    // Check assistant message
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByTestId('markdown')).toHaveTextContent('This is a test response with **markdown**');
  });

  it('allows copying message content', async () => {
    const conversation = createTestConversation();
    store.conversationStore.conversations = [conversation];
    store.conversationStore.activeConversationId = conversation.id;
    
    // Mock the getActiveConversation method
    jest.spyOn(store.conversationStore, 'getActiveConversation').mockReturnValue(conversation);
    
    render(<ResponseView />, { store });
    
    // Find and click the copy button for the assistant message
    const copyButtons = screen.getAllByLabelText('Copy');
    fireEvent.click(copyButtons[1]); // Second button should be for the assistant message
    
    // Check that the clipboard API was called with the correct text
    await waitFor(() => {
      expect(mockCopyText).toHaveBeenCalledWith('This is a test response with **markdown**');
    });
  });

  it('renders model badge correctly', () => {
    const conversation = createTestConversation();
    store.conversationStore.conversations = [conversation];
    store.conversationStore.activeConversationId = conversation.id;
    
    // Mock the getActiveConversation method
    jest.spyOn(store.conversationStore, 'getActiveConversation').mockReturnValue(conversation);
    
    render(<ResponseView />, { store });
    
    // The model name should be shown in a badge
    expect(screen.getByText('opus')).toBeInTheDocument();
  });

  it('renders multiple messages in the correct order', () => {
    const conversation = createTestConversation();
    
    // Add an additional exchange
    conversation.messages.push(
      {
        id: 'user-message-2',
        role: 'user',
        content: 'Another question',
        createdAt: new Date(),
        metadata: {
          tokens: 2,
        },
      },
      {
        id: 'assistant-message-2',
        role: 'assistant',
        content: 'Another answer',
        createdAt: new Date(),
        metadata: {
          tokens: 2,
          model: 'claude-3-opus-20240229',
        },
      }
    );
    
    store.conversationStore.conversations = [conversation];
    store.conversationStore.activeConversationId = conversation.id;
    
    // Mock the getActiveConversation method
    jest.spyOn(store.conversationStore, 'getActiveConversation').mockReturnValue(conversation);
    
    render(<ResponseView />, { store });
    
    // Check that all messages are rendered
    expect(screen.getByText('This is a test prompt')).toBeInTheDocument();
    expect(screen.getByText('This is a test response with **markdown**')).toBeInTheDocument();
    expect(screen.getByText('Another question')).toBeInTheDocument();
    expect(screen.getByText('Another answer')).toBeInTheDocument();
    
    // Check that there are 4 message containers (2 user, 2 assistant)
    const badges = screen.getAllByText(/You|Claude/);
    expect(badges.length).toBe(4);
  });
});