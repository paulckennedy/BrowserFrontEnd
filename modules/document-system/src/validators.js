/**
 * Validation Functions
 * Convenience functions for validating documents and communication messages
 */

const { SchemaValidator } = require('./SchemaValidator');

// Load schemas
const documentSystemSchema = require('../schemas/document-system-schema.json');
const aiAgentCommunicationSchema = require('../schemas/ai-agent-communication.json');

// Create validator instance
const validator = new SchemaValidator({
    documentSystem: documentSystemSchema,
    aiAgentCommunication: aiAgentCommunicationSchema
});

/**
 * Validate a document node against the document system schema
 */
function validateDocument(documentNode) {
    try {
        const result = validator.validate('documentSystem', documentNode);
        return {
            valid: result.valid,
            errors: result.errors,
            node: documentNode
        };
    } catch (error) {
        return {
            valid: false,
            errors: [{ message: error.message, path: '', value: documentNode }],
            node: documentNode
        };
    }
}

/**
 * Validate a communication message against the AI agent communication schema
 */
function validateCommunication(message) {
    try {
        const result = validator.validate('aiAgentCommunication', message);
        return {
            valid: result.valid,
            errors: result.errors,
            message: message
        };
    } catch (error) {
        return {
            valid: false,
            errors: [{ message: error.message, path: '', value: message }],
            message: message
        };
    }
}

/**
 * Validate a markdown document node specifically
 */
function validateMarkdownDocument(markdownDoc) {
    const requiredFields = [
        'markdown_id', 'summary', 'categories', 'resources_array',
        'owner_user_id', 'nested_prompts', 'chunk_ids', 'created_at', 'updated_at'
    ];

    const errors = [];

    // Check required fields
    for (const field of requiredFields) {
        if (!(field in markdownDoc)) {
            errors.push({
                path: field,
                message: `Required field '${field}' is missing`,
                value: undefined
            });
        }
    }

    // Validate specific field types
    if (markdownDoc.markdown_id && typeof markdownDoc.markdown_id !== 'string') {
        errors.push({
            path: 'markdown_id',
            message: 'markdown_id must be a string',
            value: markdownDoc.markdown_id
        });
    }

    if (markdownDoc.categories && !Array.isArray(markdownDoc.categories)) {
        errors.push({
            path: 'categories',
            message: 'categories must be an array',
            value: markdownDoc.categories
        });
    }

    if (markdownDoc.chunk_ids && !Array.isArray(markdownDoc.chunk_ids)) {
        errors.push({
            path: 'chunk_ids',
            message: 'chunk_ids must be an array',
            value: markdownDoc.chunk_ids
        });
    }

    return {
        valid: errors.length === 0,
        errors: errors,
        document: markdownDoc
    };
}

/**
 * Validate a user node specifically
 */
function validateUserNode(userNode) {
    const requiredFields = [
        'user_id', 'username', 'email', 'full_name',
        'preferences', 'created_at', 'last_active'
    ];

    const errors = [];

    // Check required fields
    for (const field of requiredFields) {
        if (!(field in userNode)) {
            errors.push({
                path: field,
                message: `Required field '${field}' is missing`,
                value: undefined
            });
        }
    }

    // Validate email format
    if (userNode.email && typeof userNode.email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userNode.email)) {
            errors.push({
                path: 'email',
                message: 'Invalid email format',
                value: userNode.email
            });
        }
    }

    // Validate preferences is an object
    if (userNode.preferences && typeof userNode.preferences !== 'object') {
        errors.push({
            path: 'preferences',
            message: 'preferences must be an object',
            value: userNode.preferences
        });
    }

    return {
        valid: errors.length === 0,
        errors: errors,
        user: userNode
    };
}

/**
 * Validate hash ID format
 */
function validateHashId(hashId) {
    if (typeof hashId !== 'string') {
        return {
            valid: false,
            error: 'Hash ID must be a string'
        };
    }

    if (hashId.length !== 64) {
        return {
            valid: false,
            error: 'Hash ID must be exactly 64 characters long'
        };
    }

    if (!/^[0-9a-fA-F]{64}$/.test(hashId)) {
        return {
            valid: false,
            error: 'Hash ID must contain only hexadecimal characters (0-9, a-f, A-F)'
        };
    }

    return {
        valid: true,
        error: null
    };
}

/**
 * Validate a batch of documents
 */
function validateDocumentBatch(documents) {
    const results = [];
    
    for (let i = 0; i < documents.length; i++) {
        const result = validateDocument(documents[i]);
        results.push({
            index: i,
            ...result
        });
    }

    const validCount = results.filter(r => r.valid).length;
    
    return {
        totalCount: results.length,
        validCount: validCount,
        invalidCount: results.length - validCount,
        results: results,
        allValid: validCount === results.length
    };
}

module.exports = {
    validateDocument,
    validateCommunication,
    validateMarkdownDocument,
    validateUserNode,
    validateHashId,
    validateDocumentBatch
};