/**
 * AI Agent Communication Utility
 * Handles message formatting, validation, and communication with backend AI agents
 */

class AIAgentCommunicator {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || '/api/ai';
        this.timeout = config.timeout || 30000;
        this.schema = null;
        this.pendingRequests = new Map();
        
        this.loadSchema();
    }

    /**
     * Load and cache the JSON schema for validation
     */
    async loadSchema() {
        try {
            const response = await fetch('/schemas/ai-agent-communication.json');
            this.schema = await response.json();
        } catch (error) {
            console.warn('Could not load AI communication schema:', error);
        }
    }

    /**
     * Generate a unique request ID
     */
    generateRequestId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Create a standardized request message
     */
    createRequest(type, content, options = {}) {
        const request = {
            id: this.generateRequestId(),
            type: type,
            timestamp: new Date().toISOString(),
            payload: {
                content: content,
                context: {
                    selection: options.selection || null,
                    documentType: options.documentType || 'markdown',
                    language: options.language || 'en'
                },
                options: options.operationOptions || {}
            }
        };

        return request;
    }

    /**
     * Send a request to the AI agent
     */
    async sendRequest(type, content, options = {}) {
        const request = this.createRequest(type, content, options);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            this.pendingRequests.set(request.id, { controller, timeoutId });

            const response = await fetch(`${this.baseUrl}/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            this.pendingRequests.delete(request.id);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return this.processResponse(result);

        } catch (error) {
            this.pendingRequests.delete(request.id);
            throw new Error(`AI Agent communication failed: ${error.message}`);
        }
    }

    /**
     * Send a streaming request to the AI agent
     */
    async sendStreamingRequest(type, content, options = {}, onChunk = null) {
        const request = this.createRequest(type, content, options);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            this.pendingRequests.set(request.id, { controller, timeoutId });

            const response = await fetch(`${this.baseUrl}/${type}/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let result = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                result += chunk;
                
                if (onChunk) {
                    onChunk(chunk);
                }
            }

            clearTimeout(timeoutId);
            this.pendingRequests.delete(request.id);

            return this.processResponse(JSON.parse(result));

        } catch (error) {
            this.pendingRequests.delete(request.id);
            throw new Error(`AI Agent streaming communication failed: ${error.message}`);
        }
    }

    /**
     * Process and validate response from AI agent
     */
    processResponse(response) {
        // Basic validation
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid response format');
        }

        if (response.status === 'error') {
            throw new Error(`AI Agent error: ${response.message || 'Unknown error'}`);
        }

        return {
            id: response.id,
            type: response.type,
            status: response.status,
            content: response.content,
            metadata: response.metadata || {},
            timestamp: response.timestamp,
            model: response.model || 'unknown',
            processingTime: response.processingTime || 0
        };
    }

    /**
     * High-level methods for common AI operations
     */

    async generateText(prompt, options = {}) {
        return this.sendRequest('generate', prompt, {
            ...options,
            operationOptions: {
                maxTokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7,
                model: options.model || 'default'
            }
        });
    }

    async summarizeText(text, options = {}) {
        return this.sendRequest('summarize', text, {
            ...options,
            operationOptions: {
                length: options.length || 'medium',
                style: options.style || 'bullet-points'
            }
        });
    }

    async improveText(text, instructions = '', options = {}) {
        return this.sendRequest('improve', text, {
            ...options,
            operationOptions: {
                instructions: instructions,
                focus: options.focus || 'clarity'
            }
        });
    }

    async explainText(text, options = {}) {
        return this.sendRequest('explain', text, {
            ...options,
            operationOptions: {
                level: options.level || 'intermediate',
                format: options.format || 'conversational'
            }
        });
    }

    async translateText(text, targetLanguage, options = {}) {
        return this.sendRequest('translate', text, {
            ...options,
            operationOptions: {
                targetLanguage: targetLanguage,
                preserveFormatting: options.preserveFormatting !== false
            }
        });
    }

    async answerQuestion(question, context = '', options = {}) {
        return this.sendRequest('answer', question, {
            ...options,
            operationOptions: {
                context: context,
                style: options.style || 'detailed'
            }
        });
    }

    /**
     * Batch operations
     */
    async sendBatchRequests(requests) {
        const promises = requests.map(({ type, content, options }) => 
            this.sendRequest(type, content, options)
        );

        try {
            const results = await Promise.allSettled(promises);
            return results.map((result, index) => ({
                index,
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason.message : null
            }));
        } catch (error) {
            throw new Error(`Batch request failed: ${error.message}`);
        }
    }

    /**
     * Cancel all pending requests
     */
    cancelAllRequests() {
        for (const [requestId, { controller, timeoutId }] of this.pendingRequests) {
            controller.abort();
            clearTimeout(timeoutId);
        }
        this.pendingRequests.clear();
    }

    /**
     * Cancel a specific request
     */
    cancelRequest(requestId) {
        const request = this.pendingRequests.get(requestId);
        if (request) {
            request.controller.abort();
            clearTimeout(request.timeoutId);
            this.pendingRequests.delete(requestId);
            return true;
        }
        return false;
    }

    /**
     * Get status of all pending requests
     */
    getPendingRequests() {
        return Array.from(this.pendingRequests.keys());
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        Object.assign(this, newConfig);
    }
}

module.exports = { AIAgentCommunicator };