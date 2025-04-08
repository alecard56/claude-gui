# Claude API GUI

A desktop application for interacting with Anthropic's Claude AI models through their API. This application provides an intuitive interface for sending prompts to Claude, managing conversations, and configuring API parameters without writing code.

## Features

- **Secure Authentication**: Safely store and manage your Claude API keys
- **Conversation Management**: Create, save, and organize conversations with Claude
- **Parameter Controls**: Fine-tune Claude's behavior with temperature, max tokens, and other settings
- **Markdown Rendering**: View Claude's responses with proper formatting and syntax highlighting
- **Token Usage Tracking**: Monitor your API usage and associated costs
- **Dark/Light Mode**: Choose your preferred theme
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Screenshots

*[Screenshots of the application will be added here]*

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- npm or yarn
- Claude API key from Anthropic

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/claude-api-gui.git
   cd claude-api-gui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development version:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Package the application for your platform:
   ```bash
   npm run package
   ```

## Architecture

Claude API GUI follows the Model-View-Controller (MVC) architecture:

- **Models**: Data structures and business logic (conversation management, API parameters, etc.)
- **Views**: UI components for user interaction
- **Controllers**: Coordination between models and views, handling user actions

## Technology Stack

- **TypeScript**: Type-safe JavaScript
- **React**: UI library
- **Electron**: Cross-platform desktop application framework
- **Chakra UI**: Component library for the user interface
- **MobX**: State management
- **Vite**: Build tooling

## Testing

The application includes comprehensive unit tests. Run the test suite with:

```bash
npm test
```

For coverage information:

```bash
npm run test:coverage
```

## Development

### Project Structure

```
claude-api-gui/
├── dist/               # Build output
├── public/             # Static assets
├── src/
│   ├── controllers/    # Controllers for MVC pattern
│   ├── main/           # Electron main process
│   ├── models/         # Data models and business logic
│   ├── renderer/       # React UI components
│   │   ├── components/ # Reusable UI components
│   │   ├── styles/     # CSS and style-related files
│   │   └── views/      # Main view components
│   ├── test/           # Test files
│   ├── types/          # TypeScript declarations
│   └── utils/          # Utility functions
├── package.json
└── README.md
```

### API Integration

The application communicates with the Claude API via Electron's main process to handle authentication and avoid CORS issues. All sensitive data like API keys are securely stored using `electron-store`.

## License

[MIT License](LICENSE)

## Acknowledgements

- [Anthropic](https://www.anthropic.com/) for creating Claude AI
- [Electron](https://www.electronjs.org/) for the cross-platform framework
- [React](https://reactjs.org/) for the UI library
- [Chakra UI](https://chakra-ui.com/) for the component library
- All other open-source projects that made this possible