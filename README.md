# BrowserFrontEnd

A modern, responsive frontend web application built with HTML, CSS, and JavaScript.

## Features

- **Browser-in-Browser Interface**: Sophisticated editor with familiar browser chrome
- **Live Markdown Editing**: Real-time preview with syntax highlighting
- **Auto-Save Functionality**: Obsidian-style automatic saving every 2 seconds
- **Database Integration**: PostgreSQL storage via SQL database agent
- **Collapsing Menu System**: Clean, context-sensitive menu bar
- **File Explorer**: Sidebar navigation for document management
- **AI Integration**: Centralized prompt management for AI-powered writing
- **Keyboard Shortcuts**: Full keyboard navigation and formatting shortcuts
- **Responsive Design**: Works seamlessly across all device sizes

## Project Structure

```text
BrowserFrontEnd/
├── index.html                  # Main HTML file
├── styles.css                  # Base CSS styling
├── editor-styles.css           # Editor-specific CSS
├── script.js                   # JavaScript functionality
├── ai-integration.js           # AI integration and prompt management
├── markdown-editor.js          # Markdown editor core functionality
├── server.js                   # Node.js backend server
├── prompts.json                # Centralized AI prompts and templates
├── package.json                # Node.js dependencies and scripts
├── Dockerfile                  # Production container image
├── Dockerfile.dev              # Development container image
├── docker-compose.yml          # Multi-service orchestration
├── docker-compose.dev.yml      # Development overrides
├── deploy.sh                   # Deployment automation script
├── nginx.conf                  # Nginx web server configuration
├── default.conf                # Nginx site configuration
├── .env.example                # Environment variables template
├── .dockerignore               # Docker build exclusions
├── README.md                   # Project documentation
├── CONVERSATION_LOG.md         # Development decisions and conversation history
├── database/
│   ├── init.sql                # PostgreSQL schema initialization
│   └── backup/                 # Database backup directory
├── redis/
│   └── redis.conf              # Redis configuration
└── .github/
    ├── workflows/
    │   └── docker-build.yml    # CI/CD pipeline
    └── copilot-instructions.md
```

## Getting Started

1. **Local Development**: Simply open `index.html` in your browser
2. **Live Server**: Use VS Code's Live Server extension for hot-reload development
3. **HTTP Server**: Serve files using any local HTTP server

### Using Python's built-in server

```bash
python -m http.server 8000
```

### Using Node.js http-server

```bash
npx http-server .
```

## Development

- **Main entry point**: `index.html`
- **Base styling**: `styles.css` (original styles)
- **Editor styling**: `editor-styles.css` (browser-in-browser interface)
- **Core functionality**: `markdown-editor.js` (editor, auto-save, database)
- **AI integration**: `ai-integration.js` and `prompts.json`
- **Enhanced interactions**: `script.js` (updated with editor integration)
- Modern web standards with ES6+ JavaScript classes and features

## AI Integration

The project includes a comprehensive AI integration system:

### Centralized Prompts (`prompts.json`)

All AI prompts are organized in categories:

- **System**: Project context, code review, debugging prompts
- **Development**: Feature requests, optimization, refactoring templates
- **Content**: Copywriting, technical docs, user guides
- **Analysis**: Code review, user experience, performance analysis
- **Testing**: Test scenarios, automation, accessibility testing
- **Deployment**: Checklists, optimization, monitoring
- **Maintenance**: Updates, monitoring, analytics

### AI Integration API (`ai-integration.js`)

```javascript
// Get a specific prompt
const prompt = aiIntegration.getPrompt('development', 'featureRequest', {
    feature_name: 'contact form',
    description: 'user contact functionality'
});

// Generate AI content
const result = await aiIntegration.generateContent('content', 'copywriting', variables);

// List available categories
const categories = aiIntegration.getAvailableCategories();
```

### Usage Examples

1. **Feature Development**: Use structured prompts for consistent AI assistance
2. **Code Review**: Apply standardized review criteria
3. **Content Generation**: Maintain brand voice and style
4. **Testing**: Generate comprehensive test scenarios
5. **Documentation**: Create consistent technical documentation

## Markdown Editor Features

### Browser-in-Browser Interface

The application now features a sophisticated browser-in-browser markdown editor:

- **Collapsing Menu Bar**: Context-sensitive menu with File, Edit, View, and Tools
- **Browser Chrome**: Realistic browser window with traffic lights and address bar
- **File Explorer**: Sidebar for document navigation and management
- **Split-Pane Editing**: Side-by-side markdown editor and live preview

### Live Editing & Auto-Save

- **Real-time Preview**: Markdown rendered instantly as you type
- **Auto-save**: Changes saved every 2 seconds (like Obsidian)
- **Database Storage**: Documents stored in PostgreSQL via SQL agent
- **Local Fallback**: Automatic localStorage backup when database unavailable
- **Unsaved Changes Warning**: Prevents data loss on navigation

### Keyboard Shortcuts

- `Ctrl+S`: Manual save
- `Ctrl+N`: New document
- `Ctrl+B`: Bold text
- `Ctrl+I`: Italic text
- `Ctrl+K`: Insert link
- `F11`: Toggle fullscreen
- `Ctrl+Shift+P`: Toggle preview
- `Tab`: Indent (4 spaces)

### Database Integration

The editor uses a SQL Database Agent for PostgreSQL integration:

```javascript
// Database configuration
const sqlAgent = new SQLDatabaseAgent({
    host: 'localhost',
    database: 'markdown_editor',
    table: 'documents'
});

// Auto-save functionality
editor.autoSave(); // Saves to database every 2 seconds
```

### Document Management

- **File Tree**: Browse and open documents from sidebar
- **Document Status**: Real-time connection and save status
- **Export Functionality**: Download documents as .md files
- **Document Statistics**: Live word count, character count, cursor position

## Docker Deployment

The application is fully containerized and ready for deployment with Docker.

### Quick Start

```bash
# Clone and setup
git clone <your-repo-url>
cd BrowserFrontEnd
cp .env.example .env

# Deploy with Docker Compose
./deploy.sh production deploy
```

### Development Environment

```bash
# Start development environment with hot reload
./deploy.sh development deploy

# Access services:
# - Application: http://localhost:3000
# - Database Admin: http://localhost:8081
# - Redis Admin: http://localhost:8082
```

### Production Environment

```bash
# Deploy production stack
./deploy.sh production deploy

# Create database backup
./deploy.sh production backup

# View logs
./deploy.sh production logs
```

### Docker Services

- **markdown-editor**: Main application (Nginx + Node.js)
- **postgres**: PostgreSQL database with automatic initialization
- **redis**: Redis for session management and caching
- **traefik**: Reverse proxy and load balancer (production)

### Environment Configuration

Copy `.env.example` to `.env` and configure:

- Database credentials
- Redis password
- Session secrets
- AI API keys
- SSL/TLS settings

### Database Schema

The PostgreSQL database is automatically initialized with:

- `documents` table for markdown files
- `users` table for authentication
- `document_shares` for collaboration
- `document_history` for version control
- Full-text search capabilities
- Sample documents and admin user

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Feel free to submit issues and enhancement requests!
