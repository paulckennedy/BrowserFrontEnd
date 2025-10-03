# Markdown Extension Shortcuts System

A comprehensive markdown extension shortcuts system that integrates seamlessly with the enhanced document storage schema. This system transforms static markdown documents into dynamic, interactive content hubs with AI processing, resource embedding, and workflow integration.

## 🚀 Features

### Core Capabilities
- **Universal Shortcut Syntax**: Consistent `@[type:identifier:parameters]` pattern for all extensions
- **Schema Integration**: Full integration with enhanced document storage schema
- **Real-time Processing**: Automatic shortcut processing with visual status indicators
- **Interactive Hover System**: Rich tooltips with previews and actions
- **Status Management**: Visual feedback for pending, processing, ready, and error states
- **Extensible Architecture**: Plugin-based system for custom shortcut types

### Supported Shortcut Types

#### 📄 Document Shortcuts
- `@[doc:hash_id]` - Document references with live previews
- `@[collection:tag_name]` - Dynamic document collections
- `@[doc:hash_id:section=heading]` - Deep links to document sections

#### 🖼️ Resource Shortcuts
- `@[img:resource_id:width=300]` - Image embedding with parameters
- `@[gallery:resource_ids]` - Image galleries
- `@[chart:data_id:type=bar]` - Interactive charts and visualizations
- `@[table:csv_id:searchable=true]` - Data tables with features
- `@[video:resource_id:start=120]` - Video embedding with timestamps
- `@[pdf:document_id:page=3]` - PDF viewers

#### 🤖 AI Processing Shortcuts
- `@[ai:summarize:doc_id]` - Document summarization
- `@[ai:translate:text|lang=es]` - Text translation
- `@[ai:analyze:content|type=sentiment]` - Content analysis
- `@[ai:generate:topic|style=technical]` - Content generation

#### ⚡ Workflow Shortcuts
- `@[workflow:template_id]` - Workflow templates
- `@[workflow:status:workflow_id]` - Status monitoring
- `@[metrics:entity_id|timeframe=week]` - Performance metrics

#### 👤 User & Collaboration
- `@[user:user_id]` - User mentions and profiles
- `@[team:team_id]` - Team information
- `@[permission:resource_id]` - Permission management

## 📦 Installation

### Basic Setup
1. Include the required files in your project:
```html
<link rel="stylesheet" href="markdown-extension-shortcuts.css">
<script src="markdown-extension-shortcuts.js"></script>
<script src="markdown-extension-integration.js"></script>
```

2. Initialize the system:
```javascript
// Basic initialization
const shortcutManager = new MarkdownExtensionShortcuts({
    hoverDelay: 500,
    autoProcess: true,
    apiEndpoint: '/api/shortcuts'
});

// With markdown editor integration
const integration = new MarkdownExtensionIntegration(markdownEditor, {
    realTimeProcessing: true,
    processingDelay: 1000,
    autoSave: true
});
```

### Advanced Configuration
```javascript
const shortcutManager = new MarkdownExtensionShortcuts({
    // Appearance
    hoverDelay: 500,
    previewSize: 'medium', // small, medium, large
    
    // Processing
    autoProcess: true,
    processingTimeout: 30000,
    
    // API Configuration
    apiEndpoint: '/api/shortcuts',
    authToken: 'your-auth-token',
    
    // Features
    enableTooltips: true,
    enableKeyboardShortcuts: true,
    enableContextMenus: true,
    
    // User Preferences
    defaultPermissions: ['read'],
    favoriteShortcuts: ['ai:summarize', 'chart:create']
});
```

## 🎯 Usage Examples

### Basic Document Linking
```markdown
# Project Documentation

See the architecture overview in @[doc:arch_overview_hash] and 
implementation details in @[doc:impl_details_hash:section=api-design].

Recent project updates: @[collection:project_docs:recent:limit=5]
```

### Rich Media Content
```markdown
# Market Analysis Report

## Performance Dashboard
@[chart:sales_data:type=line|period=ytd|interactive=true]

## Regional Distribution
@[img:market_map:overlay=performance_data|width=600]

## Detailed Metrics
@[table:performance_metrics:sortable=true|exportable=csv]

## Presentation Recording
@[video:quarterly_review:chapters=true|start=300]
```

### AI-Powered Content
```markdown
# Research Summary

## Executive Summary
@[ai:summarize:research_data:style=executive|length=short]

## Key Insights
@[ai:extract:research_data|entities=insights,trends,recommendations]

## Competitive Analysis
@[ai:compare:our_product,competitor_a,competitor_b|format=table]

## Future Predictions
@[ai:predict:market_trends|timeframe=12months|confidence=high]
```

### Workflow Integration
```markdown
# Deployment Guide

## Current Status
@[workflow:status:deployment_pipeline]

## Deployment Steps
@[workflow:deployment_template:version=v2.1]

## Monitoring
@[metrics:deployment_health|alerts=enabled]

## Team Assignments
@[user:deploy_lead] @[user:qa_lead] @[team:devops]
```

## 🛠️ API Integration

### Shortcut Registration
```javascript
// Register shortcut in document schema
POST /api/shortcuts/register
{
    "shortcut": {
        "shortcut_id": "shortcut_abc123",
        "markdown_id": "document_hash_here",
        "shortcut_type": "ai",
        "shortcut_content": "@[ai:summarize:doc_id]",
        "status": "pending"
    }
}
```

### Processing Pipeline
```javascript
// Process shortcut
POST /api/shortcuts/process
{
    "shortcut_id": "shortcut_abc123",
    "parameters": {
        "timeout": 30000,
        "priority": "normal"
    }
}

// Response
{
    "status": "processing",
    "estimated_completion": "2024-01-15T10:30:00Z",
    "progress": 0.3
}
```

### Result Retrieval
```javascript
// Get shortcut result
GET /api/shortcuts/shortcut_abc123/result

// Response
{
    "status": "ready",
    "result": {
        "content": "Generated summary content...",
        "preview": "Summary of document...",
        "metadata": {
            "processing_time": 2.5,
            "confidence": 0.92
        }
    }
}
```

## 🎨 Customization

### Custom Shortcut Types
```javascript
// Define custom processor
class CustomProcessor extends ShortcutProcessor {
    async process(shortcut) {
        // Custom processing logic
        const result = await this.customProcessing(shortcut);
        return {
            preview: result.summary,
            content: result.data,
            actions: ['view', 'edit', 'export']
        };
    }
}

// Register custom processor
shortcutManager.processors.set('custom', new CustomProcessor());
```

### Custom Styling
```css
/* Custom shortcut styling */
.shortcut[data-shortcut-type="custom"] {
    --shortcut-color: #9b59b6;
    background: linear-gradient(135deg, #e8d5f0 0%, #f4e8f8 100%);
}

.shortcut[data-shortcut-type="custom"]:hover {
    border-color: var(--shortcut-color);
    box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
}
```

### Dialog Customization
```javascript
// Custom shortcut dialog
integration.addDialogType('custom-selector', {
    title: 'Select Custom Resource',
    template: customDialogHTML,
    validator: (data) => data.resourceId && data.parameters,
    processor: (data) => ({
        identifier: data.resourceId,
        parameters: data.parameters
    })
});
```

## 🔧 Development

### Project Structure
```
markdown-extension-shortcuts/
├── markdown-extension-shortcuts.js      # Core shortcut system
├── markdown-extension-shortcuts.css     # Styling and themes
├── markdown-extension-integration.js    # Editor integration
├── markdown-extension-shortcuts-demo.html # Live demo
├── notes/
│   └── markdown-extension-shortcuts.md  # Detailed specification
└── processors/
    ├── document-processor.js            # Document handling
    ├── ai-processor.js                   # AI processing
    ├── chart-processor.js                # Chart generation
    └── custom-processor.js               # Custom extensions
```

### Building and Testing
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Start development server
npm run dev

# Run linting
npm run lint
```

### Adding New Processors
1. Create processor class extending `ShortcutProcessor`
2. Implement the `process()` method
3. Register with shortcut manager
4. Add UI elements (toolbar buttons, dialogs)
5. Update CSS for custom styling

```javascript
// Example processor
class WeatherProcessor extends ShortcutProcessor {
    async process(shortcut) {
        const location = shortcut.identifier;
        const weather = await this.fetchWeather(location);
        
        return {
            preview: `${weather.temp}°F, ${weather.condition}`,
            content: weather,
            actions: ['refresh', 'details']
        };
    }
}

// Register
shortcutManager.processors.set('weather', new WeatherProcessor());
```

## 🏗️ Architecture

### Core Components

#### Shortcut Manager (`MarkdownExtensionShortcuts`)
- Parses and processes shortcuts
- Manages processor registry
- Handles status updates and caching
- Provides public API

#### Integration Layer (`MarkdownExtensionIntegration`)
- Connects with markdown editors
- Provides toolbar and keyboard shortcuts
- Manages real-time processing
- Handles document lifecycle

#### Processor System
- Modular processor architecture
- Base `ShortcutProcessor` class
- Built-in processors for common types
- Plugin system for extensions

#### UI Components
- Consistent hover tooltips
- Status indicators and animations
- Interactive dialogs
- Responsive design

### Data Flow
1. **Detection**: Shortcut patterns detected in markdown
2. **Registration**: Shortcuts registered in document schema
3. **Processing**: Appropriate processor handles shortcut
4. **Rendering**: Results rendered with status indicators
5. **Interaction**: User interactions trigger actions

### Schema Integration
```json
{
  "shortcut_node": {
    "shortcut_id": "64-character-hex-hash",
    "markdown_id": "parent-document-hash",
    "shortcut_type": "shortcut-type-name",
    "shortcut_content": "@[type:identifier:params]",
    "status": "pending|processing|ready|error",
    "prompt_ref": "prompt-node-hash",
    "result_resource_id": "result-resource-hash",
    "result_markdown_id": "result-document-hash",
    "created_at": "ISO-8601-timestamp",
    "updated_at": "ISO-8601-timestamp"
  }
}
```

## 🚦 Status System

### Status Indicators
- **🔄 Pending**: Created but not yet processed
- **⚡ Processing**: Currently being processed
- **✅ Ready**: Successfully processed and available
- **❌ Error**: Processing failed with error details

### Visual Feedback
- Color-coded shortcuts with consistent styling
- Animated processing indicators
- Hover tooltips with detailed status
- Click actions based on current status

## 🔐 Security & Permissions

### Permission System
- User-based access control
- Resource-level permissions
- Processing quotas and limits
- Audit logging

### Security Features
- Input validation and sanitization
- XSS prevention in generated content
- API authentication and authorization
- Rate limiting for processing requests

## 📱 Responsive Design

### Mobile Support
- Touch-friendly hover alternatives
- Responsive tooltip positioning
- Optimized button sizes
- Simplified interfaces for small screens

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences

## 🧪 Testing

### Test Coverage
- Unit tests for all processors
- Integration tests with editors
- UI interaction tests
- Performance benchmarks

### Demo and Examples
- Interactive demo page
- Comprehensive examples
- Performance testing
- Cross-browser compatibility

## 📖 Documentation

### API Reference
- Complete method documentation
- Configuration options
- Event system
- Extension points

### Guides
- Getting started guide
- Integration tutorials
- Custom processor development
- Troubleshooting guide

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

### Development Guidelines
- Follow existing code style
- Write comprehensive tests
- Update documentation
- Maintain backward compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Enhanced document storage schema architecture
- AI orchestration system integration
- Community feedback and contributions
- Open source markdown processing libraries