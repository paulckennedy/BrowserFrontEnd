/**
 * Document System Editor Integration
 * Handles loading, saving, and syncing markdown documents with the backend
 */

class DocumentSystemIntegration {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || '/api/documents';
        this.vectorDbUrl = config.vectorDbUrl || '/api/vector';
        this.autosaveInterval = config.autosaveInterval || 5000; // 5 seconds
        this.batchSize = config.batchSize || 10;
        
        this.pendingUpdates = new Map();
        this.activeDocuments = new Map();
        this.userNode = null;
        
        this.setupAutosave();
    }

    /**
     * Load a markdown document into an editor tab
     */
    async loadDocument(markdownId) {
        try {
            // Fetch document node from backend
            const response = await fetch(`${this.baseUrl}/markdown/${markdownId}`);
            const docNode = await response.json();
            
            // Reconstruct content from chunks
            const content = await this.reconstructContent(docNode.chunk_ids);
            
            // Create editor context
            const editorContext = {
                documentId: docNode.markdown_id,
                summary: docNode.summary,
                categories: docNode.categories,
                resources: docNode.resources_array,
                owner: docNode.owner_user_id,
                promptHistory: docNode.nested_prompts,
                promptSourceId: docNode.prompt_source_id,
                createdAt: docNode.created_at,
                updatedAt: docNode.updated_at
            };
            
            // Store active document reference
            this.activeDocuments.set(markdownId, docNode);
            
            return {
                content,
                context: editorContext,
                node: docNode
            };
            
        } catch (error) {
            console.error('Failed to load document:', error);
            throw new Error(`Document loading failed: ${error.message}`);
        }
    }

    /**
     * Reconstruct content from chunk IDs
     */
    async reconstructContent(chunkIds) {
        const chunks = await Promise.all(
            chunkIds.map(async (chunkId) => {
                const response = await fetch(`${this.vectorDbUrl}/chunks/${chunkId}`);
                const chunk = await response.json();
                return chunk.content;
            })
        );
        
        return chunks.join('');
    }

    /**
     * Handle document content changes (called by editor)
     */
    onDocumentChange(documentId, content, metadata = {}) {
        const existingDoc = this.activeDocuments.get(documentId);
        if (!existingDoc) {
            console.warn('Document not found in active documents:', documentId);
            return;
        }

        // Update document node
        const updatedNode = {
            ...existingDoc,
            summary: metadata.summary || this.generateSummary(content),
            categories: metadata.categories || existingDoc.categories,
            updated_at: new Date().toISOString()
        };

        // Mark for batch update
        this.pendingUpdates.set(documentId, {
            node: updatedNode,
            content: content,
            needsChunking: true
        });

        // Update active document reference
        this.activeDocuments.set(documentId, updatedNode);
    }

    /**
     * Generate a simple summary from content
     */
    generateSummary(content, maxLength = 150) {
        const plainText = content.replace(/[#*`\[\]]/g, '').trim();
        return plainText.length > maxLength 
            ? plainText.substring(0, maxLength) + '...'
            : plainText;
    }

    /**
     * Setup autosave mechanism
     */
    setupAutosave() {
        setInterval(() => {
            if (this.pendingUpdates.size > 0) {
                this.performBatchUpdate();
            }
        }, this.autosaveInterval);
    }

    /**
     * Perform batch update of pending documents
     */
    async performBatchUpdate() {
        const updates = Array.from(this.pendingUpdates.entries());
        const batchData = {
            markdown_documents: [],
            resources: []
        };

        // Process updates in batches
        for (const [documentId, updateData] of updates) {
            try {
                // Chunk content if needed
                if (updateData.needsChunking) {
                    const chunkIds = await this.chunkContent(updateData.content);
                    updateData.node.chunk_ids = chunkIds;
                }

                batchData.markdown_documents.push(updateData.node);
                
            } catch (error) {
                console.error(`Failed to process update for ${documentId}:`, error);
                continue;
            }
        }

        // Send batch update to backend
        if (batchData.markdown_documents.length > 0) {
            try {
                await this.sendBatchUpdate(batchData);
                
                // Clear processed updates
                updates.forEach(([documentId]) => {
                    this.pendingUpdates.delete(documentId);
                });
                
                console.log(`Batch updated ${batchData.markdown_documents.length} documents`);
                
            } catch (error) {
                console.error('Batch update failed:', error);
                // Keep updates in queue for retry
            }
        }
    }

    /**
     * Chunk content for vector storage
     */
    async chunkContent(content) {
        const response = await fetch(`${this.vectorDbUrl}/chunk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        
        const result = await response.json();
        return result.chunk_ids;
    }

    /**
     * Send batch update to backend
     */
    async sendBatchUpdate(batchData) {
        const response = await fetch(`${this.baseUrl}/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: 'batch_update',
                timestamp: new Date().toISOString(),
                data: batchData
            })
        });

        if (!response.ok) {
            throw new Error(`Batch update failed: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Load user node for user tab
     */
    async loadUserNode(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}`);
            const userNode = await response.json();
            
            this.userNode = userNode;
            return userNode;
            
        } catch (error) {
            console.error('Failed to load user node:', error);
            throw new Error(`User loading failed: ${error.message}`);
        }
    }

    /**
     * Handle AI prompt creation
     */
    async createPrompt(sourceDocumentId, promptText, promptType = 'research') {
        const promptId = this.generateHashKey();
        
        const promptNode = {
            prompt_id: promptId,
            owner_user_id: this.userNode?.user_id,
            status: 'pending',
            source_markdown_id: sourceDocumentId,
            response_markdown_id: null, // Will be set when response is generated
            prompt_text: promptText,
            resources_array: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Add prompt to source document's nested_prompts
        const sourceDoc = this.activeDocuments.get(sourceDocumentId);
        if (sourceDoc) {
            sourceDoc.nested_prompts.push(promptNode);
            this.pendingUpdates.set(sourceDocumentId, {
                node: sourceDoc,
                needsChunking: false
            });
        }

        // Send prompt to AI orchestrator
        await this.sendPromptToAI(promptNode);
        
        return promptId;
    }

    /**
     * Send prompt to AI orchestrator
     */
    async sendPromptToAI(promptNode) {
        const response = await fetch('/api/ai/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promptNode)
        });

        return await response.json();
    }

    /**
     * Generate a mock hash key (in production, use proper hash generation)
     */
    generateHashKey() {
        return Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    /**
     * Get document collections for export/sync
     */
    getDocumentCollections() {
        const collections = {
            markdown_documents: Array.from(this.activeDocuments.values()),
            pending_updates: Array.from(this.pendingUpdates.entries()),
            user_node: this.userNode
        };
        
        return collections;
    }

    /**
     * Validate document node against schema
     */
    validateDocumentNode(node) {
        // Basic validation - in production, use proper JSON Schema validator
        const requiredFields = [
            'markdown_id', 'owner_user_id', 'summary', 'categories',
            'chunk_ids', 'nested_prompts', 'resources_array', 
            'created_at', 'updated_at'
        ];
        
        for (const field of requiredFields) {
            if (!(field in node)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentSystemIntegration;
} else if (typeof window !== 'undefined') {
    window.DocumentSystemIntegration = DocumentSystemIntegration;
}