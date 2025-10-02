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
     * Create a new markdown document
     */
    async createDocument(content, metadata = {}) {
        const documentId = this.generateHashId();
        const ownerId = this.userNode?.user_id || 'anonymous';
        
        const docNode = {
            markdown_id: documentId,
            summary: metadata.summary || this.generateSummary(content),
            categories: metadata.categories || [],
            resources_array: [],
            owner_user_id: ownerId,
            nested_prompts: [],
            prompt_source_id: null,
            chunk_ids: [], // Will be populated after chunking
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Mark for creation
        this.pendingUpdates.set(documentId, {
            node: docNode,
            content: content,
            needsChunking: true,
            isNew: true
        });

        // Store as active document
        this.activeDocuments.set(documentId, docNode);
        
        return docNode;
    }

    /**
     * Setup automatic saving
     */
    setupAutosave() {
        setInterval(() => {
            this.processBatchUpdates();
        }, this.autosaveInterval);
    }

    /**
     * Process all pending updates in batches
     */
    async processBatchUpdates() {
        if (this.pendingUpdates.size === 0) return;

        const updates = Array.from(this.pendingUpdates.entries());
        const batches = this.createBatches(updates, this.batchSize);

        for (const batch of batches) {
            await this.processBatch(batch);
        }

        this.pendingUpdates.clear();
    }

    /**
     * Process a single batch of updates
     */
    async processBatch(batch) {
        const chunkingPromises = batch
            .filter(([_, update]) => update.needsChunking)
            .map(([documentId, update]) => this.chunkContent(documentId, update.content));

        // Wait for all chunking to complete
        const chunkResults = await Promise.all(chunkingPromises);
        
        // Update nodes with chunk IDs
        let chunkIndex = 0;
        for (const [documentId, update] of batch) {
            if (update.needsChunking) {
                update.node.chunk_ids = chunkResults[chunkIndex++];
            }
        }

        // Send batch update to backend
        const batchPayload = {
            updates: batch.map(([documentId, update]) => ({
                document_id: documentId,
                node: update.node,
                is_new: update.isNew || false
            }))
        };

        try {
            const response = await fetch(`${this.baseUrl}/batch-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchPayload)
            });

            if (!response.ok) {
                throw new Error(`Batch update failed: ${response.statusText}`);
            }

            console.log(`Successfully processed batch of ${batch.length} documents`);
        } catch (error) {
            console.error('Batch update failed:', error);
            // Re-queue failed updates
            batch.forEach(([documentId, update]) => {
                this.pendingUpdates.set(documentId, update);
            });
        }
    }

    /**
     * Chunk content and store in vector database
     */
    async chunkContent(documentId, content) {
        const chunks = this.splitIntoChunks(content);
        const chunkIds = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunkId = this.generateHashId();
            const chunkData = {
                chunk_id: chunkId,
                document_id: documentId,
                content: chunks[i],
                order: i,
                created_at: new Date().toISOString()
            };

            try {
                const response = await fetch(`${this.vectorDbUrl}/chunks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(chunkData)
                });

                if (response.ok) {
                    chunkIds.push(chunkId);
                } else {
                    console.error(`Failed to store chunk ${i} for document ${documentId}`);
                }
            } catch (error) {
                console.error(`Error storing chunk ${i}:`, error);
            }
        }

        return chunkIds;
    }

    /**
     * Split content into chunks for vector storage
     */
    splitIntoChunks(content, chunkSize = 1000) {
        const chunks = [];
        let current = 0;

        while (current < content.length) {
            let end = Math.min(current + chunkSize, content.length);
            
            // Try to break at word boundaries
            if (end < content.length) {
                const lastSpace = content.lastIndexOf(' ', end);
                if (lastSpace > current) {
                    end = lastSpace;
                }
            }

            chunks.push(content.slice(current, end));
            current = end;
        }

        return chunks;
    }

    /**
     * Generate a simple summary from content
     */
    generateSummary(content, maxLength = 200) {
        const cleaned = content.replace(/[#*_`\[\]]/g, '').trim();
        if (cleaned.length <= maxLength) return cleaned;
        
        const truncated = cleaned.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    }

    /**
     * Generate 64-character hash ID
     */
    generateHashId() {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
    }

    /**
     * Create batches from array
     */
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Set the current user context
     */
    setUserNode(userNode) {
        this.userNode = userNode;
    }

    /**
     * Get document by ID
     */
    getDocument(documentId) {
        return this.activeDocuments.get(documentId);
    }

    /**
     * Force save all pending changes
     */
    async forceSave() {
        await this.processBatchUpdates();
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.pendingUpdates.clear();
        this.activeDocuments.clear();
    }
}

module.exports = { DocumentSystemIntegration };