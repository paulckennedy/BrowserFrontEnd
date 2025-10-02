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
    async sendStreamingRequest(type, content, options = {}) {
        const request = this.createRequest(type, content, options);
        
        try {
            const response = await fetch(`${this.baseUrl}/${type}/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return this.createStreamReader(response);

        } catch (error) {
            throw new Error(`AI Agent streaming failed: ${error.message}`);
        }
    }

    /**
     * Create a stream reader for server-sent events
     */
    createStreamReader(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        return {
            async *read() {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    yield data;
                                } catch (e) {
                                    console.warn('Invalid JSON in stream:', line);
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
            }
        };
    }

    /**
     * Process and validate response
     */
    processResponse(response) {
        if (response.status === 'error') {
            throw new Error(`AI Agent Error: ${response.error.message}`);
        }

        return {
            id: response.id,
            status: response.status,
            content: response.result?.processedContent,
            suggestions: response.result?.suggestions || [],
            metadata: response.result?.metadata || {}
        };
    }

    /**
     * Cancel a pending request
     */
    cancelRequest(requestId) {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            pending.controller.abort();
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(requestId);
        }
    }

    /**
     * Cancel all pending requests
     */
    cancelAllRequests() {
        for (const [id, pending] of this.pendingRequests) {
            pending.controller.abort();
            clearTimeout(pending.timeoutId);
        }
        this.pendingRequests.clear();
    }

    // Convenience methods for common operations

    async checkGrammar(content, options = {}) {
        return this.sendRequest('grammar_check', content, options);
    }

    async getSuggestions(content, options = {}) {
        return this.sendRequest('style_suggestion', content, options);
    }

    async generateContent(prompt, options = {}) {
        return this.sendRequest('content_generation', prompt, options);
    }

    async analyzeText(content, options = {}) {
        return this.sendRequest('text_analysis', content, options);
    }

    async translate(content, targetLanguage, options = {}) {
        options.operationOptions = { targetLanguage, ...options.operationOptions };
        return this.sendRequest('translation', content, options);
    }

    async summarize(content, options = {}) {
        return this.sendRequest('summarization', content, options);
    }

    async convertFormat(content, targetFormat, options = {}) {
        options.operationOptions = { targetFormat, ...options.operationOptions };
        return this.sendRequest('format_conversion', content, options);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAgentCommunicator;
} else if (typeof window !== 'undefined') {
    window.AIAgentCommunicator = AIAgentCommunicator;
}