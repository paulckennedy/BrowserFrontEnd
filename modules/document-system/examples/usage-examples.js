/**
 * Document System Module - Usage Examples
 * Demonstrates how to use the document system module in different scenarios
 */

// Import the module
const {
    DocumentSystemIntegration,
    AIAgentCommunicator,
    validateDocument,
    validateCommunication,
    createDefaultUserNode,
    createMarkdownDocument,
    HashGenerator
} = require('../index.js');

// Example 1: Basic Document Management
async function basicDocumentExample() {
    console.log('=== Basic Document Management Example ===');

    // Initialize the document system
    const docSystem = new DocumentSystemIntegration({
        baseUrl: 'http://localhost:3000/api/documents',
        vectorDbUrl: 'http://localhost:3000/api/vector',
        autosaveInterval: 3000
    });

    // Create a user
    const user = createDefaultUserNode(
        'johndoe',
        'john@example.com',
        'John Doe',
        { theme: 'dark', language: 'en' }
    );

    docSystem.setUserNode(user);

    // Create a new document
    const content = `# My Project Notes

## Overview
This document contains important project information.

## Features
- Document management
- AI integration
- Schema validation

## Next Steps
- [ ] Implement backend API
- [ ] Add user authentication
- [ ] Deploy to production
`;

    const document = await docSystem.createDocument(content, {
        summary: 'Project notes and planning document',
        categories: ['project', 'planning', 'notes']
    });

    console.log('Created document:', document.markdown_id);
    console.log('Document summary:', document.summary);

    // Simulate document changes
    const updatedContent = content + '\n\n## Update\nAdded new requirements.';
    docSystem.onDocumentChange(document.markdown_id, updatedContent, {
        summary: 'Updated project notes with new requirements'
    });

    console.log('Document updated, pending autosave...');

    // Force save
    await docSystem.forceSave();
    console.log('Document saved successfully');
}

// Example 2: AI Agent Communication
async function aiCommunicationExample() {
    console.log('\n=== AI Agent Communication Example ===');

    // Initialize AI communicator
    const aiComm = new AIAgentCommunicator({
        baseUrl: 'http://localhost:3000/api/ai',
        timeout: 10000
    });

    try {
        // Generate text
        const generateResult = await aiComm.generateText(
            'Write a brief introduction about document management systems',
            {
                maxTokens: 200,
                temperature: 0.7,
                documentType: 'markdown'
            }
        );

        console.log('Generated text:', generateResult.content);

        // Summarize text
        const longText = `
        Document management systems are essential tools for modern organizations.
        They help organize, store, and retrieve documents efficiently.
        Features include version control, collaboration tools, search capabilities,
        and integration with other business systems.
        `;

        const summaryResult = await aiComm.summarizeText(longText, {
            length: 'short',
            style: 'bullet-points'
        });

        console.log('Summary:', summaryResult.content);

        // Batch operations
        const batchRequests = [
            { type: 'generate', content: 'Hello world', options: {} },
            { type: 'explain', content: 'Machine learning', options: {} }
        ];

        const batchResults = await aiComm.sendBatchRequests(batchRequests);
        console.log('Batch results:', batchResults.length, 'operations completed');

    } catch (error) {
        console.error('AI communication error:', error.message);
    }
}

// Example 3: Schema Validation
function schemaValidationExample() {
    console.log('\n=== Schema Validation Example ===');

    // Create a sample document
    const sampleDoc = {
        markdown_id: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        summary: 'Sample document for testing',
        categories: ['test', 'example'],
        resources_array: [],
        owner_user_id: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        nested_prompts: [],
        prompt_source_id: null,
        chunk_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Validate the document
    const validation = validateDocument({ markdown_documents: [sampleDoc] });
    
    if (validation.valid) {
        console.log('✓ Document is valid');
    } else {
        console.log('✗ Document validation failed:');
        validation.errors.forEach(error => {
            console.log(`  - ${error.path}: ${error.message}`);
        });
    }

    // Create a communication message
    const message = {
        id: 'req-123-456-789',
        type: 'generate',
        timestamp: new Date().toISOString(),
        payload: {
            content: 'Test message',
            context: {
                selection: null,
                documentType: 'markdown',
                language: 'en'
            },
            options: {}
        }
    };

    // Validate the message
    const commValidation = validateCommunication(message);
    
    if (commValidation.valid) {
        console.log('✓ Communication message is valid');
    } else {
        console.log('✗ Communication validation failed:');
        commValidation.errors.forEach(error => {
            console.log(`  - ${error.path}: ${error.message}`);
        });
    }
}

// Example 4: Hash Generation
function hashGenerationExample() {
    console.log('\n=== Hash Generation Example ===');

    const hashGen = new HashGenerator();

    // Generate random hashes
    const hash1 = hashGen.generate();
    const hash2 = hashGen.generateUnique();
    
    console.log('Random hash 1:', hash1);
    console.log('Unique hash 2:', hash2);
    console.log('Hash 1 valid:', HashGenerator.validate(hash1));
    console.log('Hash 2 valid:', HashGenerator.validate(hash2));

    // Generate deterministic hash from content
    hashGen.generateFromContent('Hello, World!').then(contentHash => {
        console.log('Content-based hash:', contentHash);
    });

    console.log('Used hash count:', hashGen.getUsedHashCount());
}

// Example 5: Complete Workflow
async function completeWorkflowExample() {
    console.log('\n=== Complete Workflow Example ===');

    // 1. Initialize systems
    const docSystem = new DocumentSystemIntegration({
        baseUrl: 'http://localhost:3000/api/documents'
    });

    const aiComm = new AIAgentCommunicator({
        baseUrl: 'http://localhost:3000/api/ai'
    });

    // 2. Create user and document
    const user = createDefaultUserNode('alice', 'alice@example.com', 'Alice Johnson');
    docSystem.setUserNode(user);

    const initialContent = '# Research Notes\n\nStarting my research project.';
    const doc = await docSystem.createDocument(initialContent, {
        categories: ['research', 'draft']
    });

    console.log('Created document:', doc.markdown_id);

    // 3. Use AI to enhance content
    try {
        const improvedContent = await aiComm.improveText(initialContent, 
            'Make it more detailed and add structure', 
            { focus: 'structure' }
        );

        // 4. Update document with AI improvements
        docSystem.onDocumentChange(doc.markdown_id, improvedContent.content, {
            summary: 'Enhanced research notes with AI assistance'
        });

        console.log('Document enhanced with AI');

        // 5. Force save and validate
        await docSystem.forceSave();
        
        const finalDoc = docSystem.getDocument(doc.markdown_id);
        const validation = validateDocument({ markdown_documents: [finalDoc] });
        
        console.log('Final document valid:', validation.valid);

    } catch (error) {
        console.error('Workflow error:', error.message);
    }
}

// Run examples
async function runAllExamples() {
    try {
        await basicDocumentExample();
        await aiCommunicationExample();
        schemaValidationExample();
        hashGenerationExample();
        await completeWorkflowExample();
    } catch (error) {
        console.error('Example execution error:', error);
    }
}

// Export examples for individual testing
module.exports = {
    basicDocumentExample,
    aiCommunicationExample,
    schemaValidationExample,
    hashGenerationExample,
    completeWorkflowExample,
    runAllExamples
};

// Run if called directly
if (require.main === module) {
    runAllExamples();
}