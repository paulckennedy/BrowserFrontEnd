# Document System Module

A comprehensive document management system with AI integration, schema validation, and multi-project deployment support.

## Features

- **Document Management**: Full CRUD operations for markdown documents with automatic chunking and vector storage
- **AI Integration**: Standardized communication protocol with AI agents for text generation, summarization, and improvement
- **Schema Validation**: JSON Schema-based validation for all system components
- **Hash-based Identifiers**: Secure 256-bit hash keys for all entities
- **Vector Database Integration**: Automatic content chunking and reassembly
- **Batch Operations**: Efficient batch processing for document updates
- **Cross-Project Compatibility**: Designed for deployment across multiple project types

## Installation

```bash
npm install @browserfrontend/document-system
```

## Quick Start

```javascript
const {
    DocumentSystemIntegration,
    AIAgentCommunicator,
    createDefaultUserNode,
    createMarkdownDocument
} = require('@browserfrontend/document-system');

// Initialize document system
const docSystem = new DocumentSystemIntegration({
    baseUrl: 'http://localhost:3000/api/documents',
    vectorDbUrl: 'http://localhost:3000/api/vector'
});

// Create a user
const user = createDefaultUserNode('john', 'john@example.com', 'John Doe');
docSystem.setUserNode(user);

// Create and manage documents
const doc = await docSystem.createDocument('# My Document\n\nContent here...');
console.log('Created document:', doc.markdown_id);
```

## Core Components

### DocumentSystemIntegration

Handles loading, saving, and syncing markdown documents with automatic chunking and batch operations.

```javascript
const docSystem = new DocumentSystemIntegration({
    baseUrl: '/api/documents',
    vectorDbUrl: '/api/vector',
    autosaveInterval: 5000,  // 5 seconds
    batchSize: 10
});

// Load a document
const { content, context, node } = await docSystem.loadDocument(documentId);

// Create a new document
const newDoc = await docSystem.createDocument(content, {
    summary: 'Document summary',
    categories: ['tag1', 'tag2']
});

// Handle content changes (triggers autosave)
docSystem.onDocumentChange(documentId, newContent, metadata);

// Force immediate save
await docSystem.forceSave();
```

### AIAgentCommunicator

Standardized communication with AI agents for various text operations.

```javascript
const aiComm = new AIAgentCommunicator({
    baseUrl: '/api/ai',
    timeout: 30000
});

// Text generation
const result = await aiComm.generateText('Write about...', {
    maxTokens: 500,
    temperature: 0.7
});

// Text improvement
const improved = await aiComm.improveText(text, 'Make it clearer', {
    focus: 'clarity'
});

// Streaming responses
await aiComm.sendStreamingRequest('generate', prompt, options, (chunk) => {
    console.log('Received chunk:', chunk);
});

// Batch operations
const results = await aiComm.sendBatchRequests([
    { type: 'summarize', content: text1, options: {} },
    { type: 'explain', content: text2, options: {} }
]);
```

## Schema Validation

The module includes comprehensive JSON schemas for validation:

```javascript
const { validateDocument, validateCommunication } = require('@browserfrontend/document-system');

// Validate a document node
const docValidation = validateDocument(documentNode);
if (!docValidation.valid) {
    console.log('Validation errors:', docValidation.errors);
}

// Validate AI communication message
const commValidation = validateCommunication(message);
```

## Factory Functions

Utility functions for creating common objects:

```javascript
const {
    createDefaultUserNode,
    createMarkdownDocument,
    createPromptNode,
    createResourceNode
} = require('@browserfrontend/document-system');

// Create a user
const user = createDefaultUserNode('username', 'email@domain.com', 'Full Name', {
    theme: 'dark',
    language: 'en'
});

// Create a document
const doc = createMarkdownDocument(content, userId, {
    categories: ['project', 'notes'],
    summary: 'Custom summary'
});
```

## Hash Generation

Secure 64-character hexadecimal hash generation:

```javascript
const { HashGenerator } = require('@browserfrontend/document-system');

const hashGen = new HashGenerator();

// Generate random hash
const hash = hashGen.generate();

// Generate unique hash (checks against previously generated)
const uniqueHash = hashGen.generateUnique();

// Generate deterministic hash from content
const contentHash = await hashGen.generateFromContent('text content');

// Validate hash format
const isValid = HashGenerator.validate(hash);
```

## Schemas

The module includes two main schemas:

### Document System Schema
Defines the structure for users, markdown documents, prompts, and resources with hash-based identifiers and comprehensive metadata.

### AI Agent Communication Schema
Standardizes request/response format for AI agent interactions with proper error handling and streaming support.

## Configuration

### Document System Options
- `baseUrl`: API endpoint for document operations
- `vectorDbUrl`: Vector database endpoint for chunk storage
- `autosaveInterval`: Milliseconds between autosave operations (default: 5000)
- `batchSize`: Number of documents to process in each batch (default: 10)

### AI Communicator Options
- `baseUrl`: AI agent API endpoint
- `timeout`: Request timeout in milliseconds (default: 30000)

## Error Handling

The module provides comprehensive error handling:

```javascript
try {
    const result = await docSystem.loadDocument(documentId);
} catch (error) {
    console.error('Document loading failed:', error.message);
}

// Validation errors
const validation = validateDocument(doc);
if (!validation.valid) {
    validation.errors.forEach(error => {
        console.log(`${error.path}: ${error.message}`);
    });
}
```

## Multi-Project Deployment

This module is designed for use across different project types:

### AI Agent Projects
```javascript
// Configure for AI agent integration
const docSystem = new DocumentSystemIntegration({
    baseUrl: 'http://ai-backend:3000/api/documents',
    vectorDbUrl: 'http://vector-db:5000/api/vector'
});
```

### E-commerce Projects
```javascript
// Configure for product documentation
const docSystem = new DocumentSystemIntegration({
    baseUrl: 'http://ecommerce-api:3000/api/docs',
    autosaveInterval: 10000  // Less frequent saves for product docs
});
```

### Content Management Systems
```javascript
// Configure for content management
const docSystem = new DocumentSystemIntegration({
    baseUrl: 'http://cms-api:3000/api/content',
    batchSize: 20  // Larger batches for bulk content operations
});
```

## Examples

See the `examples/` directory for complete usage examples:

- `usage-examples.js`: Comprehensive examples covering all features
- Individual example functions for specific use cases

## API Reference

### Classes
- `DocumentSystemIntegration`: Main document management class
- `AIAgentCommunicator`: AI agent communication handler
- `SchemaValidator`: JSON schema validation utility
- `HashGenerator`: Secure hash generation utility

### Functions
- `validateDocument(doc)`: Validate document against schema
- `validateCommunication(msg)`: Validate AI communication message
- `createDefaultUserNode(...)`: Create user node with defaults
- `createMarkdownDocument(...)`: Create markdown document node
- `createPromptNode(...)`: Create AI prompt node
- `createResourceNode(...)`: Create resource reference node

### Schemas
- `schemas.documentSystem`: Document system JSON schema
- `schemas.aiAgentCommunication`: AI communication JSON schema

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Validate schemas
npm run validate

# Build documentation
npm run build:docs

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: https://github.com/paulckennedy/BrowserFrontEnd/issues
- Documentation: See `docs/` directory for detailed API documentation