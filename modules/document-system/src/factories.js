/**
 * Factory Functions
 * Utility functions for creating common document system objects
 */

const { HashGenerator } = require('./HashGenerator');

const hashGenerator = new HashGenerator();

/**
 * Create a default user node with required fields
 */
function createDefaultUserNode(username, email, fullName, options = {}) {
    const userId = hashGenerator.generateUnique();
    
    return {
        user_id: userId,
        username: username,
        email: email,
        full_name: fullName,
        preferences: {
            theme: options.theme || 'light',
            language: options.language || 'en',
            notifications: options.notifications !== false,
            autosave: options.autosave !== false,
            ...options.preferences
        },
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
    };
}

/**
 * Create a markdown document node
 */
function createMarkdownDocument(content, ownerId, options = {}) {
    const documentId = hashGenerator.generateUnique();
    
    return {
        markdown_id: documentId,
        summary: options.summary || generateSummary(content),
        categories: options.categories || [],
        resources_array: options.resources || [],
        owner_user_id: ownerId,
        nested_prompts: [],
        prompt_source_id: options.promptSourceId || null,
        chunk_ids: [], // Will be populated when content is chunked
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

/**
 * Create a prompt node
 */
function createPromptNode(promptText, sourceDocumentId, options = {}) {
    const promptId = hashGenerator.generateUnique();
    
    return {
        prompt_id: promptId,
        prompt_text: promptText,
        source_document_id: sourceDocumentId,
        ai_model: options.aiModel || 'default',
        parameters: {
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
            ...options.parameters
        },
        status: 'pending',
        response_document_id: null, // Will be set when response is generated
        created_at: new Date().toISOString(),
        processed_at: null
    };
}

/**
 * Create a resource node
 */
function createResourceNode(url, type, options = {}) {
    const resourceId = hashGenerator.generateUnique();
    
    return {
        resource_id: resourceId,
        url: url,
        type: type, // 'image', 'file', 'link', 'reference'
        title: options.title || extractTitleFromUrl(url),
        description: options.description || '',
        metadata: {
            fileSize: options.fileSize || null,
            mimeType: options.mimeType || null,
            lastModified: options.lastModified || null,
            ...options.metadata
        },
        access_permissions: options.permissions || 'public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

/**
 * Create an AI agent communication request
 */
function createCommunicationRequest(type, content, options = {}) {
    const requestId = generateRequestId();
    
    return {
        id: requestId,
        type: type,
        timestamp: new Date().toISOString(),
        payload: {
            content: content,
            context: {
                selection: options.selection || null,
                documentType: options.documentType || 'markdown',
                language: options.language || 'en',
                ...options.context
            },
            options: options.operationOptions || {}
        }
    };
}

/**
 * Create a complete document system structure
 */
function createDocumentSystem() {
    return {
        users: [],
        markdown_documents: [],
        resources: []
    };
}

/**
 * Create a user workspace with initial documents
 */
function createUserWorkspace(userInfo, options = {}) {
    const user = createDefaultUserNode(
        userInfo.username,
        userInfo.email,
        userInfo.fullName,
        options.userOptions
    );

    const welcomeDoc = createMarkdownDocument(
        options.welcomeContent || '# Welcome to your workspace\n\nStart creating your documents here.',
        user.user_id,
        {
            summary: 'Welcome document for new user',
            categories: ['welcome', 'getting-started']
        }
    );

    return {
        user: user,
        documents: [welcomeDoc],
        resources: []
    };
}

/**
 * Helper function to generate summary from content
 */
function generateSummary(content, maxLength = 200) {
    if (!content || typeof content !== 'string') {
        return 'Empty document';
    }
    
    // Remove markdown formatting
    const cleaned = content.replace(/[#*_`\[\]]/g, '').trim();
    
    if (cleaned.length <= maxLength) {
        return cleaned;
    }
    
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
        ? truncated.substring(0, lastSpace) + '...'
        : truncated + '...';
}

/**
 * Helper function to extract title from URL
 */
function extractTitleFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const filename = path.split('/').pop();
        
        if (filename && filename.includes('.')) {
            return filename.split('.')[0].replace(/[_-]/g, ' ');
        }
        
        return urlObj.hostname || url;
    } catch {
        return 'Untitled Resource';
    }
}

/**
 * Helper function to generate request ID
 */
function generateRequestId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = {
    createDefaultUserNode,
    createMarkdownDocument,
    createPromptNode,
    createResourceNode,
    createCommunicationRequest,
    createDocumentSystem,
    createUserWorkspace,
    generateSummary,
    extractTitleFromUrl
};