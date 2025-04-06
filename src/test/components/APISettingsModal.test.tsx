// File: src/test/components/APISettingsModal.test.tsx
// Purpose: Tests for the APISettingsModal component
// Usage: Run with Jest test runner
// Contains: Unit tests for APISettingsModal component functionality
// Dependencies: React Testing Library, Jest, APISettingsModal
// Iteration: 1

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test_runner';
import APISettingsModal from '../../renderer/components/modals/APISettingsModal';
import { RootStore } from '../../models/RootStore';

describe('APISettingsModal', () => {
  let store: RootStore;
  const mockOnClose = jest.fn();

  beforeEach(() => {
    store = new RootStore();
    jest.clearAllMocks();
  });

  it('renders the modal when isOpen is true', () => {
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByText('API Settings')).toBeInTheDocument();
  });

  it('does not render the modal when isOpen is false', () => {
    render(<APISettingsModal isOpen={false} onClose={mockOnClose} />, { store });
    
    expect(screen.queryByText('API Settings')).not.toBeInTheDocument();
  });

  it('shows model selection dropdown with available models', () => {
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
    
    // Check that model options are present
    expect(screen.getByText(/claude-3-opus/)).toBeInTheDocument();
    expect(screen.getByText(/claude-3-sonnet/)).toBeInTheDocument();
    expect(screen.getByText(/claude-3-haiku/)).toBeInTheDocument();
  });

  it('shows temperature slider and input', () => {
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByText(/Temperature:/)).toBeInTheDocument();
    expect(screen.getByText(/Lower values make responses more deterministic/)).toBeInTheDocument();
  });

  it('shows max tokens slider and input', () => {
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByText(/Max Output Tokens:/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum number of tokens to generate/)).toBeInTheDocument();
  });

  it('shows top p slider and input', () => {
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByText(/Top P:/)).toBeInTheDocument();
    expect(screen.getByText(/Controls diversity via nucleus sampling/)).toBeInTheDocument();
  });

  it('shows system prompt textarea', () => {
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    expect(screen.getByText('System Prompt')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Instructions for Claude's behavior/)).toBeInTheDocument();
  });

  it('updates model when selection changes', async () => {
    const updateParamsSpy = jest.spyOn(store.apiStore, 'updateParams');
    
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Find model select and change to sonnet
    const modelSelect = screen.getByLabelText('Model');
    fireEvent.change(modelSelect, { target: { value: 'claude-3-sonnet-20240229' } });
    
    expect(updateParamsSpy).toHaveBeenCalledWith({ model: 'claude-3-sonnet-20240229' });
  });

  it('updates temperature when slider changes', async () => {
    const updateParamsSpy = jest.spyOn(store.apiStore, 'updateParams');
    
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Find the temperature slider and change it
    // Note: Testing sliders can be tricky as they're complex components
    // For simplicity, we'll use the number input instead
    const temperatureInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(temperatureInputs[0], { target: { value: '0.5' } });
    fireEvent.blur(temperatureInputs[0]);
    
    expect(updateParamsSpy).toHaveBeenCalledWith({ temperature: 0.5 });
  });

  it('updates max tokens when input changes', async () => {
    const updateParamsSpy = jest.spyOn(store.apiStore, 'updateParams');
    
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Find the max tokens input and change it
    const maxTokensInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(maxTokensInputs[1], { target: { value: '2000' } });
    fireEvent.blur(maxTokensInputs[1]);
    
    expect(updateParamsSpy).toHaveBeenCalledWith({ max_tokens: 2000 });
  });

  it('updates system prompt when textarea changes', async () => {
    const updateParamsSpy = jest.spyOn(store.apiStore, 'updateParams');
    
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Find the system prompt textarea and change it
    const systemPromptTextarea = screen.getByPlaceholderText(/Instructions for Claude's behavior/);
    fireEvent.change(systemPromptTextarea, { target: { value: 'You are a helpful assistant.' } });
    
    expect(updateParamsSpy).toHaveBeenCalledWith({ system: 'You are a helpful assistant.' });
  });

  it('closes the modal when Done button is clicked', async () => {
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Find and click the Done button
    fireEvent.click(screen.getByText('Done'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('saves settings when parameters are changed', async () => {
    const updateNestedSettingSpy = jest.spyOn(store.settingsStore, 'updateNestedSetting');
    
    render(<APISettingsModal isOpen={true} onClose={mockOnClose} />, { store });
    
    // Change the temperature
    const temperatureInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(temperatureInputs[0], { target: { value: '0.3' } });
    fireEvent.blur(temperatureInputs[0]);
    
    // We should save the setting to make it persistent
    expect(updateNestedSettingSpy).toHaveBeenCalledWith('api', 'defaultTemperature', 0.3);
  });
});