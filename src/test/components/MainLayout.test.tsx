// File: src/test/components/MainLayout.test.tsx
// Purpose: Tests for the MainLayout component
// Usage: Run with Jest test runner
// Contains: Unit tests for MainLayout component functionality
// Dependencies: React Testing Library, Jest, MainLayout
// Iteration: 2

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test_runner';
import MainLayout from '../../renderer/components/layouts/MainLayout';
import { RootStore } from '../../models/RootStore';

// Mock the child components to simplify testing
jest.mock('../../renderer/components/views/PromptView', () => {
  return {
    __esModule: true,
    default: function MockPromptView(props) {
      return React.createElement(
        "div", 
        { "data-testid": "prompt-view" }, 
        [
          "PromptView Mock",
          React.createElement(
            "button", 
            { 
              "data-testid": "settings-button", 
              onClick: props.onSettingsClick,
              key: "settings-button"
            }, 
            "Settings"
          )
        ]
      );
    }
  };
});

jest.mock('../../renderer/components/views/ResponseView', () => {
  return {
    __esModule: true,
    default: function MockResponseView() {
      return React.createElement("div", { "data-testid": "response-view" }, "ResponseView Mock");
    }
  };
});

jest.mock('../../renderer/components/views/ConversationListView', () => {
  return {
    __esModule: true,
    default: function MockConversationListView() {
      return React.createElement("div", { "data-testid": "conversation-list-view" }, "ConversationListView Mock");
    }
  };
});

jest.mock('../../renderer/components/modals/APISettingsModal', () => {
  return {
    __esModule: true,
    default: function MockAPISettingsModal(props) {
      return props.isOpen ? 
        React.createElement(
          "div", 
          { "data-testid": "api-settings-modal" }, 
          [
            "API Settings Modal Mock",
            React.createElement(
              "button", 
              { 
                "data-testid": "close-modal-button", 
                onClick: props.onClose,
                key: "close-button" 
              }, 
              "Close"
            )
          ]
        ) : null;
    }
  };
});

describe('MainLayout', () => {
  let store: RootStore;

  beforeEach(() => {
    store = new RootStore();
    jest.clearAllMocks();
  });

  it('renders the main layout correctly', () => {
    render(<MainLayout />, { store });
    
    // Check that all the main components are rendered
    expect(screen.getByText('Claude API GUI')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-view')).toBeInTheDocument();
    expect(screen.getByTestId('response-view')).toBeInTheDocument();
    
    // On larger screens, the conversation list should be visible
    expect(screen.getByTestId('conversation-list-view')).toBeInTheDocument();
  });

  it('toggles color mode when theme button is clicked', () => {
    // Get the spy for the toggleColorMode function
    const toggleColorModeSpy = jest.spyOn(require('@chakra-ui/react'), 'useColorMode')
      .mockReturnValue({
        colorMode: 'light',
        toggleColorMode: jest.fn(),
      });
    
    render(<MainLayout />, { store });
    
    // Find and click the toggle color mode button
    const themeButton = screen.getByLabelText('Toggle Color Mode');
    fireEvent.click(themeButton);
    
    // Check that the toggle function was called
    expect(toggleColorModeSpy().toggleColorMode).toHaveBeenCalled();
  });

  it('opens the sidebar drawer on mobile when menu button is clicked', async () => {
    render(<MainLayout />, { store });
    
    // Find and click the mobile menu button
    const menuButton = screen.getByLabelText('Open Menu');
    fireEvent.click(menuButton);
    
    // The drawer should be opened
    await waitFor(() => {
      expect(screen.getByText('Conversations')).toBeInTheDocument();
    });
  });

  it('opens and closes the API settings modal', async () => {
    render(<MainLayout />, { store });
    
    // Initially, the settings modal should not be shown
    expect(screen.queryByTestId('api-settings-modal')).not.toBeInTheDocument();
    
    // Find and click the settings button in the PromptView component
    const settingsButton = screen.getByTestId('settings-button');
    fireEvent.click(settingsButton);
    
    // The settings modal should now be shown
    await waitFor(() => {
      expect(screen.getByTestId('api-settings-modal')).toBeInTheDocument();
    });
    
    // Find and click the close button to close the modal
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    
    // The settings modal should now be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('api-settings-modal')).not.toBeInTheDocument();
    });
  });

  it('uses dark theme correctly', () => {
    // Mock the color mode to be dark
    jest.spyOn(require('@chakra-ui/react'), 'useColorMode')
      .mockReturnValue({
        colorMode: 'dark',
        toggleColorMode: jest.fn(),
      });
    
    render(<MainLayout />, { store });
    
    // The sun icon should be shown in dark mode
    expect(screen.getByLabelText('Toggle Color Mode')).toBeInTheDocument();
    
    // We can't easily check the CSS styles directly using React Testing Library,
    // but we can check that the component renders without errors
  });

  it('uses proper semantic HTML structure', () => {
    render(<MainLayout />, { store });
    
    // Check that there's a nav element
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Check that the page has a proper heading
    expect(screen.getByRole('heading', { name: 'Claude API GUI' })).toBeInTheDocument();
  });
});// File: src/test/components/MainLayout.test.tsx
// Purpose: Tests for the MainLayout component
// Usage: Run with Jest test runner
// Contains: Unit tests for MainLayout component functionality
// Dependencies: React Testing Library, Jest, MainLayout
// Iteration: 1

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test_runner';
import MainLayout from '../../renderer/components/layouts/MainLayout';
import { RootStore } from '../../models/RootStore';

// Mock the child components to simplify testing
jest.mock('../../renderer/components/views/PromptView', () => {
  return {
    __esModule: true,
    default: ({ onSettingsClick }: { onSettingsClick: () => void }) => (
      <div data-testid="prompt-view">
        PromptView Mock
        <button data-testid="settings-button" onClick={onSettingsClick}>
          Settings
        </button>
      </div>
    ),
  };
});

jest.mock('../../renderer/components/views/ResponseView', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="response-view">ResponseView Mock</div>,
  };
});

jest.mock('../../renderer/components/views/ConversationListView', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="conversation-list-view">ConversationListView Mock</div>,
  };
});

jest.mock('../../renderer/components/modals/APISettingsModal', () => {
  return {
    __esModule: true,
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
      isOpen ? (
        <div data-testid="api-settings-modal">
          API Settings Modal Mock
          <button data-testid="close-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
      ) : null
    ),
  };
});

describe('MainLayout', () => {
  let store: RootStore;

  beforeEach(() => {
    store = new RootStore();
    jest.clearAllMocks();
  });

  it('renders the main layout correctly', () => {
    render(<MainLayout />, { store });
    
    // Check that all the main components are rendered
    expect(screen.getByText('Claude API GUI')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-view')).toBeInTheDocument();
    expect(screen.getByTestId('response-view')).toBeInTheDocument();
    
    // On larger screens, the conversation list should be visible
    expect(screen.getByTestId('conversation-list-view')).toBeInTheDocument();
  });

  it('toggles color mode when theme button is clicked', () => {
    // Get the spy for the toggleColorMode function
    const toggleColorModeSpy = jest.spyOn(require('@chakra-ui/react'), 'useColorMode')
      .mockReturnValue({
        colorMode: 'light',
        toggleColorMode: jest.fn(),
      });
    
    render(<MainLayout />, { store });
    
    // Find and click the toggle color mode button
    const themeButton = screen.getByLabelText('Toggle Color Mode');
    fireEvent.click(themeButton);
    
    // Check that the toggle function was called
    expect(toggleColorModeSpy().toggleColorMode).toHaveBeenCalled();
  });

  it('opens the sidebar drawer on mobile when menu button is clicked', async () => {
    render(<MainLayout />, { store });
    
    // Find and click the mobile menu button
    const menuButton = screen.getByLabelText('Open Menu');
    fireEvent.click(menuButton);
    
    // The drawer should be opened
    await waitFor(() => {
      expect(screen.getByText('Conversations')).toBeInTheDocument();
    });
  });

  it('opens and closes the API settings modal', async () => {
    render(<MainLayout />, { store });
    
    // Initially, the settings modal should not be shown
    expect(screen.queryByTestId('api-settings-modal')).not.toBeInTheDocument();
    
    // Find and click the settings button in the PromptView component
    const settingsButton = screen.getByTestId('settings-button');
    fireEvent.click(settingsButton);
    
    // The settings modal should now be shown
    await waitFor(() => {
      expect(screen.getByTestId('api-settings-modal')).toBeInTheDocument();
    });
    
    // Find and click the close button to close the modal
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    
    // The settings modal should now be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('api-settings-modal')).not.toBeInTheDocument();
    });
  });

  it('uses dark theme correctly', () => {
    // Mock the color mode to be dark
    jest.spyOn(require('@chakra-ui/react'), 'useColorMode')
      .mockReturnValue({
        colorMode: 'dark',
        toggleColorMode: jest.fn(),
      });
    
    render(<MainLayout />, { store });
    
    // The sun icon should be shown in dark mode
    expect(screen.getByLabelText('Toggle Color Mode')).toBeInTheDocument();
    
    // We can't easily check the CSS styles directly using React Testing Library,
    // but we can check that the component renders without errors
  });

  it('uses proper semantic HTML structure', () => {
    render(<MainLayout />, { store });
    
    // Check that there's a nav element
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Check that the page has a proper heading
    expect(screen.getByRole('heading', { name: 'Claude API GUI' })).toBeInTheDocument();
  });
});