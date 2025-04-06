// File: src/test/components/PromptView.test.tsx
// Purpose: Tests for the PromptView component
// Usage: Run with Jest test runner
// Contains: Unit tests for PromptView component functionality
// Dependencies: React Testing Library, Jest, PromptView
// Iteration: 1

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '../test_runner';
import PromptView from '../../renderer/components/views/PromptView';
import { RootStore } from '../../models/RootStore';
import { mockApiResponse } from '../test_runner';

describe('PromptView', () => {
  let store: RootStore;
  const mockSettingsClick = jest.fn();

  beforeEach(() => {
    store = new RootStore();
    store.authStore.isAuthenticated = true;
    jest.clearAllMocks();
  });

  it('renders the prompt textarea', () => {
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    expect(screen.getByPlaceholderText('Type your message to Claude...')).toBeInTheDocument();
  });

  it('updates the prompt text when typing', () => {
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const textarea = screen.getByPlaceholderText('Type your message to Claude...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    
    expect(textarea).toHaveValue('Test prompt');
  });

  it('shows token count based on input', () => {
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const textarea = screen.getByPlaceholderText('Type your message to Claude...');
    fireEvent.change(textarea, { target: { value: 'This is a test prompt' } });
    
    // A simple heuristic is ~4 chars per token, so "This is a test prompt" should be ~5 tokens
    expect(screen.getByText(/5 tokens/)).toBeInTheDocument();
  });

  it('calls the settings click handler when settings button is clicked', () => {
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const settingsButton = screen.getByLabelText('API Settings');
    fireEvent.click(settingsButton);
    
    expect(mockSettingsClick).toHaveBeenCalled();
  });

  it('clears the prompt when clear button is clicked', () => {
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const textarea = screen.getByPlaceholderText('Type your message to Claude...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    
    const clearButton = screen.getByLabelText('Clear');
    fireEvent.click(clearButton);
    
    expect(textarea).toHaveValue('');
  });

  it('submits the prompt and calls the API when send button is clicked', async () => {
    // Mock the API response
    mockApiResponse(true);
    
    // Create a spy on the sendPrompt method
    const sendPromptSpy = jest.spyOn(store.apiStore, 'sendPrompt');
    const addMessageSpy = jest.spyOn(store.conversationStore, 'addMessage');
    
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const textarea = screen.getByPlaceholderText('Type your message to Claude...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(sendPromptSpy).toHaveBeenCalledWith('Test prompt');
      expect(addMessageSpy).toHaveBeenCalledTimes(2); // Once for user, once for assistant
    });
    
    // Textarea should be cleared after sending
    expect(textarea).toHaveValue('');
  });

  it('shows an error when trying to submit an empty prompt', async () => {
    const toastSpy = jest.spyOn(require('@chakra-ui/react'), 'useToast').mockReturnValue(jest.fn());
    
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // The toast should be called with a warning
    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
    });
  });

  it('shows an error when user is not authenticated', async () => {
    store.authStore.isAuthenticated = false;
    const toastSpy = jest.spyOn(require('@chakra-ui/react'), 'useToast').mockReturnValue(jest.fn());
    
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const textarea = screen.getByPlaceholderText('Type your message to Claude...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // The toast should be called with an error
    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock the API to return an error
    mockApiResponse(false, { error: 'API error' });
    
    // Set up the API store to have an error
    store.apiStore.error = 'API error';
    
    const toastSpy = jest.spyOn(require('@chakra-ui/react'), 'useToast').mockReturnValue(jest.fn());
    
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const textarea = screen.getByPlaceholderText('Type your message to Claude...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // The toast should be called with an error
    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
    });
  });

  it('submits the prompt when Ctrl+Enter is pressed', async () => {
    // Mock the API response
    mockApiResponse(true);
    
    // Create a spy on the sendPrompt method
    const sendPromptSpy = jest.spyOn(store.apiStore, 'sendPrompt');
    
    render(<PromptView onSettingsClick={mockSettingsClick} />, { store });
    
    const textarea = screen.getByPlaceholderText('Type your message to Claude...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    
    // Simulate pressing Ctrl+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(sendPromptSpy).toHaveBeenCalledWith('Test prompt');
    });
  });
});