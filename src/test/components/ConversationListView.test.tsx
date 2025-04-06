// File: src/test/components/ConversationListView.test.tsx
// Purpose: Tests for the ConversationListView component
// Usage: Run with Jest test runner
// Contains: Unit tests for ConversationListView component functionality
// Dependencies: React Testing Library, Jest, ConversationListView
// Iteration: 1

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test_runner';
import ConversationListView from '../../renderer/components/views/ConversationListView';
import { RootStore } from '../../models/RootStore';
import { Conversation } from '../../models/ConversationModel';
import { mockConversationData } from '../test_runner';

describe('ConversationListView', () => {
  let store: RootStore;
  
  // Sample conversations for testing
  const sampleConversations: Conversation[] = [
    {
      id: 'conversation-1',
      title: 'First Conversation',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      messages: [
        {
          id: 'message-1',
          role: 'user',
          content: 'Test message',
          createdAt: new Date('2023-01-01'),
          metadata: { tokens: 2 },
        },
      ],
      tags: ['work', 'important'],
      metadata: {
        model: 'claude-3-opus-20240229',
        totalTokens: 2,
        favorited: true,
      },
    },
    {
      id: 'conversation-2',
      title: 'Second Conversation',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
      messages: [
        {
          id: 'message-2',
          role: 'user',
          content: 'Another message',
          createdAt: new Date('2023-01-02'),
          metadata: { tokens: 2 },
        },
      ],
      tags: ['personal'],
      metadata: {
        model: 'claude-3-opus-20240229',
        totalTokens: 2,
        favorited: false,
      },
    },
  ];

  beforeEach(() => {
    store = new RootStore();
    store.conversationStore.conversations = sampleConversations;
    store.conversationStore.conversationTags = ['work', 'important', 'personal'];
    
    jest.clearAllMocks();
  });

  it('renders the conversation list correctly', () => {
    render(<ConversationListView />, { store });
    
    // Check that both conversation titles are displayed
    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.getByText('Second Conversation')).toBeInTheDocument();
  });

  it('shows new conversation button', () => {
    render(<ConversationListView />, { store });
    
    expect(screen.getByText('New Conversation')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<ConversationListView />, { store });
    
    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
  });

  it('shows tags for filtering', () => {
    render(<ConversationListView />, { store });
    
    expect(screen.getByText('FILTER BY TAG')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('important')).toBeInTheDocument();
    expect(screen.getByText('personal')).toBeInTheDocument();
  });

  it('creates a new conversation when button is clicked', async () => {
    const createConversationSpy = jest.spyOn(store.conversationStore, 'createConversation');
    
    render(<ConversationListView />, { store });
    
    fireEvent.click(screen.getByText('New Conversation'));
    
    expect(createConversationSpy).toHaveBeenCalled();
  });

  it('selects a conversation when clicked', async () => {
    const setActiveConversationSpy = jest.spyOn(store.conversationStore, 'setActiveConversation');
    
    render(<ConversationListView />, { store });
    
    fireEvent.click(screen.getByText('First Conversation'));
    
    expect(setActiveConversationSpy).toHaveBeenCalledWith('conversation-1');
  });

  it('toggles favorite status when favorite button is clicked', async () => {
    const toggleFavoriteSpy = jest.spyOn(store.conversationStore, 'toggleFavorite');
    
    render(<ConversationListView />, { store });
    
    // Find and click the favorite button for the first conversation
    const favoriteButtons = screen.getAllByLabelText('Favorite');
    fireEvent.click(favoriteButtons[0]);
    
    expect(toggleFavoriteSpy).toHaveBeenCalledWith('conversation-1');
  });

  it('deletes a conversation when delete button is clicked', async () => {
    const deleteConversationSpy = jest.spyOn(store.conversationStore, 'deleteConversation');
    
    render(<ConversationListView />, { store });
    
    // Find and click the delete button for the first conversation
    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    expect(deleteConversationSpy).toHaveBeenCalledWith('conversation-1');
  });

  it('filters conversations by search query', async () => {
    render(<ConversationListView />, { store });
    
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'First' } });
    
    // First conversation should be visible
    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    
    // Second conversation should not be visible
    expect(screen.queryByText('Second Conversation')).not.toBeInTheDocument();
  });

  it('filters conversations by tag', async () => {
    render(<ConversationListView />, { store });
    
    // Click on the 'personal' tag to filter
    fireEvent.click(screen.getByText('personal'));
    
    // First conversation should not be visible (it has tags 'work', 'important')
    expect(screen.queryByText('First Conversation')).not.toBeInTheDocument();
    
    // Second conversation should be visible (it has tag 'personal')
    expect(screen.getByText('Second Conversation')).toBeInTheDocument();
  });

  it('shows message count for each conversation', () => {
    render(<ConversationListView />, { store });
    
    // Both conversations have 1 message
    expect(screen.getAllByText('1 msgs').length).toBe(2);
  });

  it('shows empty state when no conversations match search', async () => {
    render(<ConversationListView />, { store });
    
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentQuery' } });
    
    expect(screen.getByText('No conversations match your search criteria')).toBeInTheDocument();
  });

  it('shows empty state when no conversations exist', async () => {
    store.conversationStore.conversations = [];
    
    render(<ConversationListView />, { store });
    
    expect(screen.getByText('No conversations yet. Create a new one to get started!')).toBeInTheDocument();
  });

  it('shows favorite indicator for favorited conversations', () => {
    render(<ConversationListView />, { store });
    
    // First conversation is favorited, so it should have a star icon
    const starIcons = screen.getAllByRole('img', { hidden: true });
    expect(starIcons.length).toBeGreaterThan(0);
  });
});