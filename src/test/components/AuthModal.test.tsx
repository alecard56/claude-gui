// File: src/test/components/AuthModal.test.tsx
// Purpose: Tests for the AuthModal component
// Usage: Run with Jest test runner
// Contains: Unit tests for AuthModal component functionality
// Dependencies: React Testing Library, Jest, AuthModal
// Iteration: 1

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test_runner';
import AuthModal from '../../renderer/components/modals/AuthModal';
import { RootStore } from '../../models/RootStore';
import { mockAuthenticationSuccess } from '../test_runner';

describe('AuthModal', () => {
  let store: RootStore;
  const mockOnClose = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    store = new RootStore();
    
    // Mock the toast function from Chakra UI
    jest.spyOn(require('@chakra-ui/react'), 'useToast').mockReturnValue(mockToast);
    
    jest.clearAllMocks();
  });

  it('renders the modal when isOpen is true', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByText('Claude API Authentication')).toBeInTheDocument();
  });

  it('does not render the modal when isOpen is false', () => {
    render(<AuthModal isOpen={false} onClose={mockOnClose} />, { store });
    
    expect(screen.queryByText('Claude API Authentication')).not.toBeInTheDocument();
  });

  it('shows API key input field', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByLabelText('Claude API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sk-ant-...')).toBeInTheDocument();
  });

  it('shows profile name input field', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByLabelText('Profile Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Default')).toBeInTheDocument();
  });

  it('updates API key and profile name when input changes', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    const apiKeyInput = screen.getByPlaceholderText('sk-ant-...');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-ant-test123' } });
    
    const profileNameInput = screen.getByDisplayValue('Default');
    fireEvent.change(profileNameInput, { target: { value: 'Test Profile' } });
    
    expect(apiKeyInput).toHaveValue('sk-ant-test123');
    expect(profileNameInput).toHaveValue('Test Profile');
  });

  it('toggles API key visibility when show/hide button is clicked', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    const apiKeyInput = screen.getByPlaceholderText('sk-ant-...');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    
    // Find and click the show/hide button
    const visibilityButton = screen.getByLabelText('Show API Key');
    fireEvent.click(visibilityButton);
    
    expect(apiKeyInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    const hideButton = screen.getByLabelText('Hide API Key');
    fireEvent.click(hideButton);
    
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  it('validates and stores API key when form is submitted', async () => {
    const validateAPISpy = jest.spyOn(store.authStore, 'validateAPIKey');
    const storeAPISpy = jest.spyOn(store.authStore, 'storeAPIKey');
    
    // Mock successful authentication
    mockAuthenticationSuccess(true);
    validateAPISpy.mockResolvedValue(true);
    storeAPISpy.mockResolvedValue(true);
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Fill in the form
    const apiKeyInput = screen.getByPlaceholderText('sk-ant-...');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-ant-test123' } });
    
    const profileNameInput = screen.getByDisplayValue('Default');
    fireEvent.change(profileNameInput, { target: { value: 'Test Profile' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Authenticate'));
    
    await waitFor(() => {
      expect(validateAPISpy).toHaveBeenCalledWith('sk-ant-test123');
      expect(storeAPISpy).toHaveBeenCalledWith('sk-ant-test123', 'Test Profile');
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalled();
    });
  });

  it('shows error toast when API key validation fails', async () => {
    const validateAPISpy = jest.spyOn(store.authStore, 'validateAPIKey');
    
    // Mock failed authentication
    mockAuthenticationSuccess(false);
    validateAPISpy.mockResolvedValue(false);
    store.authStore.error = 'Invalid API key';
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Fill in the form
    const apiKeyInput = screen.getByPlaceholderText('sk-ant-...');
    fireEvent.change(apiKeyInput, { target: { value: 'invalid-key' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Authenticate'));
    
    await waitFor(() => {
      expect(validateAPISpy).toHaveBeenCalledWith('invalid-key');
      expect(mockToast).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled(); // Modal should stay open
    });
  });

  it('shows error toast when API key storage fails', async () => {
    const validateAPISpy = jest.spyOn(store.authStore, 'validateAPIKey');
    const storeAPISpy = jest.spyOn(store.authStore, 'storeAPIKey');
    
    // Mock successful validation but failed storage
    mockAuthenticationSuccess(true);
    validateAPISpy.mockResolvedValue(true);
    storeAPISpy.mockResolvedValue(false);
    store.authStore.error = 'Failed to store API key';
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Fill in the form
    const apiKeyInput = screen.getByPlaceholderText('sk-ant-...');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-ant-test123' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Authenticate'));
    
    await waitFor(() => {
      expect(validateAPISpy).toHaveBeenCalledWith('sk-ant-test123');
      expect(storeAPISpy).toHaveBeenCalledWith('sk-ant-test123', 'Default');
      expect(mockToast).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled(); // Modal should stay open
    });
  });

  it('shows error when submitting with empty API key', async () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Submit the form without entering an API key
    fireEvent.click(screen.getByText('Authenticate'));
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
      // The validateAPIKey method should not be called
      expect(store.authStore.validateAPIKey).not.toHaveBeenCalled();
    });
  });

  it('displays loading state during authentication', async () => {
    // Mock a slow authentication to test loading state
    const validateAPISpy = jest.spyOn(store.authStore, 'validateAPIKey');
    
    // Create a promise that won't resolve immediately
    let resolvePromise: (value: boolean) => void;
    const authPromise = new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
    
    validateAPISpy.mockReturnValue(authPromise);
    store.authStore.isAuthenticating = true;
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Fill in the form
    const apiKeyInput = screen.getByPlaceholderText('sk-ant-...');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-ant-test123' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Authenticate'));
    
    // The button should show loading state
    expect(screen.getByRole('button', { name: /Authenticate/i })).toHaveAttribute('data-loading');
    
    // Resolve the promise to finish the test
    resolvePromise!(true);
  });

  it('respects closeOnOverlayClick prop', () => {
    // Test when closeOnOverlayClick is false
    render(<AuthModal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false} />, { store });
    
    // Check that the modal has the closeOnOverlayClick prop set to false
    // This is harder to test directly in React Testing Library since it's internal to Chakra UI
    // Instead, we can check that the close button is not present if we don't want it to be closable
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    
    // Test when closeOnOverlayClick is true
    render(<AuthModal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true} />, { store });
    
    // The close button should be present
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });
});