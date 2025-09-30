/**
 * AI Integration Module for BrowserFrontEnd
 * Handles AI-powered features and prompt management
 */

class AIIntegration {
    constructor() {
        this.prompts = null;
        this.apiEndpoint = null;
        this.apiKey = null;
        this.isInitialized = false;
    }

    /**
     * Initialize AI integration with prompts and configuration
     */
    async init(config = {}) {
        try {
            // Load prompts from prompts.json
            this.prompts = await this.loadPrompts();
            
            // Set configuration
            this.apiEndpoint = config.apiEndpoint || null;
            this.apiKey = config.apiKey || null;
            
            this.isInitialized = true;
            console.log('AI Integration initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize AI Integration:', error);
            return false;
        }
    }

    /**
     * Load prompts from prompts.json file
     */
    async loadPrompts() {
        try {
            const response = await fetch('./prompts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading prompts:', error);
            throw error;
        }
    }

    /**
     * Get a specific prompt by category and type
     */
    getPrompt(category, type, variables = {}) {
        if (!this.isInitialized || !this.prompts) {
            console.warn('AI Integration not initialized');
            return null;
        }

        try {
            const prompt = this.prompts[category]?.[type];
            if (!prompt) {
                console.warn(`Prompt not found: ${category}.${type}`);
                return null;
            }

            // If prompt is a template, replace variables
            if (typeof prompt === 'string' && Object.keys(variables).length > 0) {
                return this.replaceVariables(prompt, variables);
            }

            return prompt;
        } catch (error) {
            console.error('Error getting prompt:', error);
            return null;
        }
    }

    /**
     * Replace variables in prompt templates
     */
    replaceVariables(template, variables) {
        let result = template;
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{${key}}`;
            result = result.replace(new RegExp(placeholder, 'g'), value);
        });
        return result;
    }

    /**
     * Generate content using AI (placeholder for actual AI API integration)
     */
    async generateContent(promptCategory, promptType, variables = {}, options = {}) {
        if (!this.isInitialized) {
            throw new Error('AI Integration not initialized');
        }

        const prompt = this.getPrompt(promptCategory, promptType, variables);
        if (!prompt) {
            throw new Error(`Prompt not found: ${promptCategory}.${promptType}`);
        }

        // Placeholder for actual AI API call
        // In a real implementation, this would call your AI service
        console.log('Generated prompt:', prompt);
        
        return {
            prompt: prompt,
            generated: `AI-generated content for: ${promptCategory}.${promptType}`,
            timestamp: new Date().toISOString(),
            variables: variables
        };
    }

    /**
     * Get system context prompt for maintaining consistency
     */
    getSystemContext() {
        return this.getPrompt('system', 'projectContext');
    }

    /**
     * Get all available prompt categories
     */
    getAvailableCategories() {
        if (!this.prompts) return [];
        return Object.keys(this.prompts).filter(key => key !== 'metadata');
    }

    /**
     * Get all prompt types within a category
     */
    getPromptTypes(category) {
        if (!this.prompts || !this.prompts[category]) return [];
        return Object.keys(this.prompts[category]);
    }

    /**
     * Update a specific prompt (useful for dynamic prompt management)
     */
    updatePrompt(category, type, newPrompt) {
        if (!this.prompts) {
            console.warn('Prompts not loaded');
            return false;
        }

        if (!this.prompts[category]) {
            this.prompts[category] = {};
        }

        this.prompts[category][type] = newPrompt;
        console.log(`Updated prompt: ${category}.${type}`);
        return true;
    }

    /**
     * Export current prompts (useful for saving changes)
     */
    exportPrompts() {
        return JSON.stringify(this.prompts, null, 2);
    }
}

// Global AI Integration instance
const aiIntegration = new AIIntegration();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        aiIntegration.init().then(success => {
            if (success) {
                // Trigger custom event to notify other parts of the app
                document.dispatchEvent(new CustomEvent('aiIntegrationReady', {
                    detail: { aiIntegration }
                }));
            }
        });
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIIntegration, aiIntegration };
}

// Global access
if (typeof window !== 'undefined') {
    window.AIIntegration = AIIntegration;
    window.aiIntegration = aiIntegration;
}