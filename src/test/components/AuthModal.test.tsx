/**
 * File: src/test/components/AuthModal.test.tsx
 * 
 * Module: Test
 * Purpose: Test suite for the AuthModal component
 * Usage: Run with Jest/React Testing Library
 * Contains: Tests for AuthModal component functionality
 * Dependencies: React Testing Library, Jest
 * Iteration: 2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from '../../renderer/components/modals/AuthModal';

// Mock store
const mockStore = {
  authStore: {
    validateAPIKey: jest.fn().mockResolvedValue(true),
    storeAPIKey: jest.fn().mockResolvedValue(true),
    isAuthenticating: false,
    error: null
  }
};

// Mock useStore hook
jest.mock('../../../utils/StoreContext', () => ({
  useStore: () => mockStore
}));

// Mock Chakra UI toast
const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  return {
    __esModule: true,
    ...originalModule,
    useToast: () => mockToast
  };
});

describe('AuthModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.authStore.validateAPIKey.mockResolvedValue(true);
    mockStore.authStore.storeAPIKey.mockResolvedValue(true);
    mockStore.authStore.isAuthenticating = false;
    mockStore.authStore.error = null;
  });

  it('renders the modal when isOpen is true', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Claude API Authentication')).toBeInTheDocument();
  });

  it('does not render the modal when isOpen is false', () => {
    render(<AuthModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Claude API Authentication')).not.toBeInTheDocument();
  });

  it('shows API key input field', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByLabelText('Claude API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sk-ant-...')).toBeInTheDocument();
  });

  it('shows profile name input field', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByLabelText('Profile Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Default')).toBeInTheDocument();
  });

  it('updates API key and profile name when input changes', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    const apiKeyInput = screen.getByLabelText('Claude API Key');
    const profileNameInput = screen.getByLabelText('Profile Name');
    
    fireEvent.change(apiKeyInput, { target: { value: 'test-key' } });
    fireEvent.change(profileNameInput, { target: { value: 'Test Profile' } });
    
    expect(apiKeyInput).toHaveValue('test-key');
    expect(profileNameInput).toHaveValue('Test Profile');
  });

  it('toggles API key visibility when show/hide button is clicked', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    const apiKeyInput = screen.getByLabelText('Claude API Key');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    
    const toggleButton = screen.getByLabelText('Show API Key');
    fireEvent.click(toggleButton);
    
    expect(apiKeyInput).toHaveAttribute('type', 'text');
    
    const hideButton = screen.getByLabelText('Hide API Key');
    fireEvent.click(hideButton);
    
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  it('validates and stores API key when form is submitted', async () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    const apiKeyInput = screen.getByLabelText('Claude API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-key' } });
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockStore.authStore.validateAPIKey).toHaveBeenCalledWith('test-key');
      expect(mockStore.authStore.storeAPIKey).toHaveBeenCalledWith('test-key', 'Default');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error toast when API key validation fails', async () => {
    mockStore.authStore.validateAPIKey.mockResolvedValue(false);
    mockStore.authStore.error = 'Invalid API key';
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    const apiKeyInput = screen.getByLabelText('Claude API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'invalid-key' } });
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockStore.authStore.validateAPIKey).toHaveBeenCalledWith('invalid-key');
      expect(mockStore.authStore.storeAPIKey).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        title: 'Invalid API Key'
      }));
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('shows error toast when API key storage fails', async () => {
    mockStore.authStore.validateAPIKey.mockResolvedValue(true);
    mockStore.authStore.storeAPIKey.mockResolvedValue(false);
    mockStore.authStore.error = 'Failed to store key';
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    const apiKeyInput = screen.getByLabelText('Claude API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-key' } });
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockStore.authStore.validateAPIKey).toHaveBeenCalledWith('test-key');
      expect(mockStore.authStore.storeAPIKey).toHaveBeenCalledWith('test-key', 'Default');
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        title: 'Error'
      }));
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('shows error when submitting with empty API key', async () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    // Leave API key input empty
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Please enter an API key'
      }));
      expect(mockStore.authStore.validateAPIKey).not.toHaveBeenCalled();
    });
  });

  it('displays loading state during authentication', async () => {
    mockStore.authStore.isAuthenticating = true;
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    const submitButton = screen.getByText('Authenticate');
    expect(submitButton).toHaveAttribute('disabled');
    
    // Reset for subsequent tests
    mockStore.authStore.isAuthenticating = false;
  });

  it('respects closeOnOverlayClick prop', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false} />);
    
    // Verify ModalCloseButton is not rendered when closeOnOverlayClick is false
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    
    // We can't directly test overlay clicks in JSDOM, but we can verify the prop is passed
    // The component conditionally renders the ModalCloseButton based on this prop
  });
});