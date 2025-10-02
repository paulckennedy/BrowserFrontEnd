# Implementation Guide

This guide provides detailed instructions for implementing the Document System Module in various project types.

## Project Types

### AI Agent Integration

For AI agent projects, the document system provides seamless integration with agent communication protocols.

#### Configuration

```javascript
const { DocumentSystemIntegration, AIAgentCommunicator } = require('@browserfrontend/document-system');

const config = {
    documents: {
        baseUrl: 'http://ai-backend:3000/api/documents',
        vectorDbUrl: 'http://vector-db:5000/api/vector',
        autosaveInterval: 3000,  // Frequent saves for AI interactions
        batchSize: 5             // Smaller batches for real-time processing
    },
    ai: {
        baseUrl: 'http://ai-agent:8000/api/ai',
        timeout: 60000           // Longer timeout for AI processing
    }
};

const docSystem = new DocumentSystemIntegration(config.documents);
const aiComm = new AIAgentCommunicator(config.ai);
```

#### Workflow Implementation

```javascript
class AIAgentWorkflow {
    constructor(docSystem, aiComm) {
        this.docSystem = docSystem;
        this.aiComm = aiComm;
        this.activePrompts = new Map();
    }

    async processUserInput(input, documentId) {
        // Load current document
        const doc = await this.docSystem.loadDocument(documentId);
        
        // Send to AI agent
        const response = await this.aiComm.generateText(input, {
            context: doc.context,
            documentType: 'markdown'
        });

        // Update document with AI response
        const updatedContent = doc.content + '\n\n## AI Response\n' + response.content;
        this.docSystem.onDocumentChange(documentId, updatedContent);

        return response;
    }
}
```

### E-commerce Platform

For e-commerce projects, use the system for product documentation, user guides, and content management.

#### Configuration

```javascript
const config = {
    documents: {
        baseUrl: 'http://ecommerce-api:3000/api/docs',
        vectorDbUrl: 'http://search-engine:9200/api/vector',
        autosaveInterval: 10000,  // Less frequent saves
        batchSize: 20            // Larger batches for bulk operations
    }
};

const docSystem = new DocumentSystemIntegration(config.documents);
```

#### Product Documentation Management

```javascript
class ProductDocumentationManager {
    constructor(docSystem) {
        this.docSystem = docSystem;
    }

    async createProductGuide(productId, specifications, features) {
        const content = this.generateProductContent(specifications, features);
        
        const doc = await this.docSystem.createDocument(content, {
            summary: `Product guide for ${productId}`,
            categories: ['product', 'guide', productId],
            resources: specifications.images || []
        });

        return doc;
    }

    generateProductContent(specs, features) {
        return `# Product Guide

## Specifications
${specs.map(spec => `- **${spec.name}**: ${spec.value}`).join('\n')}

## Features
${features.map(feature => `- ${feature}`).join('\n')}

## Usage Instructions
[Content to be added]
`;
    }
}
```

### Content Management System

For CMS projects, the system handles article creation, editing, and publishing workflows.

#### Configuration

```javascript
const config = {
    documents: {
        baseUrl: 'http://cms-api:3000/api/content',
        vectorDbUrl: 'http://elasticsearch:9200/api/vector',
        autosaveInterval: 5000,
        batchSize: 15
    },
    ai: {
        baseUrl: 'http://content-ai:8000/api/ai',
        timeout: 45000
    }
};
```

#### Content Workflow

```javascript
class ContentManagementWorkflow {
    constructor(docSystem, aiComm) {
        this.docSystem = docSystem;
        this.aiComm = aiComm;
    }

    async createArticleDraft(title, outline, authorId) {
        // Generate initial content using AI
        const prompt = `Create an article outline for "${title}" with the following sections: ${outline.join(', ')}`;
        const aiResponse = await this.aiComm.generateText(prompt);

        // Create document
        const doc = await this.docSystem.createDocument(aiResponse.content, {
            summary: `Draft article: ${title}`,
            categories: ['article', 'draft'],
            owner: authorId
        });

        return doc;
    }

    async enhanceContent(documentId, instructions) {
        const doc = await this.docSystem.loadDocument(documentId);
        const improved = await this.aiComm.improveText(doc.content, instructions);
        
        this.docSystem.onDocumentChange(documentId, improved.content, {
            summary: doc.context.summary + ' (AI enhanced)'
        });

        return improved;
    }
}
```

## Backend Integration

### API Endpoints

The module expects specific API endpoints to be available:

#### Document API (`/api/documents`)

```javascript
// GET /api/documents/markdown/:id - Load document
// POST /api/documents/batch-update - Batch update documents
// POST /api/documents - Create new document
// PUT /api/documents/:id - Update document
// DELETE /api/documents/:id - Delete document
```

#### Vector Database API (`/api/vector`)

```javascript
// GET /api/vector/chunks/:id - Get chunk content
// POST /api/vector/chunks - Store chunk
// DELETE /api/vector/chunks/:id - Delete chunk
// POST /api/vector/search - Search chunks
```

#### AI Agent API (`/api/ai`)

```javascript
// POST /api/ai/generate - Text generation
// POST /api/ai/summarize - Text summarization
// POST /api/ai/improve - Text improvement
// POST /api/ai/explain - Text explanation
// POST /api/ai/translate - Text translation
// POST /api/ai/answer - Question answering
// POST /api/ai/*/stream - Streaming versions
```

### Database Schema

#### Document Storage

```sql
CREATE TABLE documents (
    id VARCHAR(64) PRIMARY KEY,
    summary TEXT,
    categories JSON,
    resources JSON,
    owner_id VARCHAR(64),
    prompts JSON,
    chunk_ids JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    preferences JSON,
    created_at TIMESTAMP,
    last_active TIMESTAMP
);
```

#### Vector Storage

```sql
CREATE TABLE chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64),
    content TEXT,
    order_index INTEGER,
    embedding VECTOR,
    created_at TIMESTAMP
);
```

## Error Handling Patterns

### Document System Errors

```javascript
try {
    const doc = await docSystem.loadDocument(documentId);
} catch (error) {
    if (error.message.includes('Document loading failed')) {
        // Handle document not found or network issues
        console.error('Document unavailable:', error.message);
        // Show fallback UI or cached version
    } else {
        // Handle other errors
        throw error;
    }
}
```

### AI Communication Errors

```javascript
try {
    const result = await aiComm.generateText(prompt);
} catch (error) {
    if (error.message.includes('timeout')) {
        // Handle timeout - maybe retry with shorter content
        console.warn('AI request timed out, retrying...');
        return await aiComm.generateText(prompt, { timeout: 10000 });
    } else if (error.message.includes('HTTP error! status: 429')) {
        // Handle rate limiting
        console.warn('Rate limited, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await aiComm.generateText(prompt);
    } else {
        throw error;
    }
}
```

### Validation Errors

```javascript
const validation = validateDocument(document);
if (!validation.valid) {
    // Handle validation errors gracefully
    const criticalErrors = validation.errors.filter(e => 
        e.path.includes('required') || e.path.includes('id')
    );
    
    if (criticalErrors.length > 0) {
        throw new Error('Critical validation errors found');
    } else {
        // Log warnings but continue
        console.warn('Document validation warnings:', validation.errors);
    }
}
```

## Performance Optimization

### Batch Processing

```javascript
// Process documents in batches
const documentIds = [...]; // Large array of document IDs
const batchSize = 10;

for (let i = 0; i < documentIds.length; i += batchSize) {
    const batch = documentIds.slice(i, i + batchSize);
    const promises = batch.map(id => docSystem.loadDocument(id));
    
    try {
        const results = await Promise.allSettled(promises);
        // Process results
    } catch (error) {
        console.error('Batch processing error:', error);
    }
}
```

### Caching Strategy

```javascript
class CachedDocumentSystem {
    constructor(docSystem) {
        this.docSystem = docSystem;
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    async loadDocument(documentId) {
        const cached = this.cache.get(documentId);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const doc = await this.docSystem.loadDocument(documentId);
        this.cache.set(documentId, {
            data: doc,
            timestamp: Date.now()
        });

        return doc;
    }
}
```

### Memory Management

```javascript
// Clean up resources periodically
setInterval(() => {
    docSystem.activeDocuments.forEach((doc, id) => {
        // Remove inactive documents from memory
        if (Date.now() - doc.lastAccessed > 600000) { // 10 minutes
            docSystem.activeDocuments.delete(id);
        }
    });
}, 300000); // Every 5 minutes
```

## Testing

### Unit Tests

```javascript
const { validateDocument, createMarkdownDocument } = require('@browserfrontend/document-system');

describe('Document Validation', () => {
    test('should validate correct document structure', () => {
        const doc = createMarkdownDocument('# Test', 'user123');
        const validation = validateDocument({ markdown_documents: [doc] });
        expect(validation.valid).toBe(true);
    });

    test('should reject invalid document', () => {
        const invalidDoc = { invalid: 'structure' };
        const validation = validateDocument(invalidDoc);
        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
    });
});
```

### Integration Tests

```javascript
describe('Document System Integration', () => {
    let docSystem;

    beforeEach(() => {
        docSystem = new DocumentSystemIntegration({
            baseUrl: 'http://test-api:3000/api/documents'
        });
    });

    test('should create and retrieve document', async () => {
        const content = '# Test Document';
        const doc = await docSystem.createDocument(content);
        
        expect(doc.markdown_id).toBeDefined();
        expect(doc.summary).toContain('Test Document');
        
        const retrieved = await docSystem.loadDocument(doc.markdown_id);
        expect(retrieved.content).toBe(content);
    });
});
```

## Deployment Considerations

### Environment Variables

```bash
# Document System Configuration
DOCUMENT_API_URL=http://api:3000/api/documents
VECTOR_DB_URL=http://vectordb:5000/api/vector
AUTOSAVE_INTERVAL=5000
BATCH_SIZE=10

# AI Configuration
AI_API_URL=http://ai:8000/api/ai
AI_TIMEOUT=30000

# Security
API_KEY=your-api-key
ENCRYPTION_KEY=your-encryption-key
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV DOCUMENT_API_URL=http://api:3000/api/documents
ENV VECTOR_DB_URL=http://vectordb:5000/api/vector

EXPOSE 3000

CMD ["node", "server.js"]
```

### Monitoring

```javascript
// Add monitoring to document operations
const originalLoadDocument = docSystem.loadDocument;
docSystem.loadDocument = async function(documentId) {
    const startTime = Date.now();
    try {
        const result = await originalLoadDocument.call(this, documentId);
        console.log(`Document loaded in ${Date.now() - startTime}ms`);
        return result;
    } catch (error) {
        console.error(`Document load failed after ${Date.now() - startTime}ms:`, error);
        throw error;
    }
};
```

This implementation guide provides the foundation for integrating the Document System Module into various project types with proper error handling, performance optimization, and deployment strategies.