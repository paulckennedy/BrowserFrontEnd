/**
 * Integration Layer for Markdown Editor Component
 * Connects the web component with existing MarkdownEditor and WYSIWYGEditor classes
 */

class MarkdownEditorIntegration {
    constructor(component) {
        this.component = component;
        this.markdownEditor = null;
        this.wysiwygEditor = null;
        this.isInitialized = false;
    }
    
    /**
     * Initialize integration with existing editor classes
     */
    async initialize() {
        try {
            // Import existing editor classes if they exist
            if (typeof MarkdownEditor !== 'undefined') {
                await this.initializeMarkdownEditor();
            }
            
            if (typeof WYSIWYGEditor !== 'undefined') {
                await this.initializeWYSIWYGEditor();
            }
            
            this.setupEventBridging();
            this.isInitialized = true;
            
            console.log('Markdown Editor Integration initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize integration:', error);
            return false;
        }
    }
    
    /**
     * Initialize existing MarkdownEditor class integration
     */
    async initializeMarkdownEditor() {
        // Create a virtual DOM container for the existing editor
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        // Create required DOM elements for the existing editor
        const editorHTML = `
            <textarea id="markdown-editor-internal"></textarea>
            <div id="preview-content-internal"></div>
            <div id="word-count-display-internal"></div>
            <div id="char-count-display-internal"></div>
            <div id="cursor-position-internal"></div>
            <div id="document-path-internal"></div>
            <div id="auto-save-status-internal"></div>
            <div id="last-saved-internal"></div>
            <div id="file-tree-internal"></div>
        `;
        container.innerHTML = editorHTML;
        
        // Initialize the existing MarkdownEditor
        this.markdownEditor = new MarkdownEditor();
        this.markdownEditor.editor = container.querySelector('#markdown-editor-internal');
        this.markdownEditor.preview = container.querySelector('#preview-content-internal');
        this.markdownEditor.wordCount = container.querySelector('#word-count-display-internal');
        this.markdownEditor.charCount = container.querySelector('#char-count-display-internal');
        this.markdownEditor.cursorPosition = container.querySelector('#cursor-position-internal');
        this.markdownEditor.documentPath = container.querySelector('#document-path-internal');
        this.markdownEditor.autoSaveStatus = container.querySelector('#auto-save-status-internal');
        this.markdownEditor.lastSaved = container.querySelector('#last-saved-internal');
        this.markdownEditor.fileTree = container.querySelector('#file-tree-internal');
        
        // Initialize without full setup to avoid conflicts
        this.markdownEditor.isInitialized = true;
        
        return true;
    }
    
    /**
     * Initialize existing WYSIWYGEditor class integration
     */
    async initializeWYSIWYGEditor() {
        // Create a virtual DOM container for the existing editor
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        // Create required DOM elements for the existing editor
        const editorHTML = `
            <div id="wysiwyg-editor-internal" contenteditable="true"></div>
            <textarea id="markdown-source-editor-internal"></textarea>
            <div id="word-count-display-internal-wysiwyg"></div>
            <div id="char-count-display-internal-wysiwyg"></div>
            <div id="cursor-position-internal-wysiwyg"></div>
            <div id="document-path-internal-wysiwyg"></div>
            <div id="auto-save-status-internal-wysiwyg"></div>
            <div id="view-mode-internal"></div>
            <div id="file-tree-internal-wysiwyg"></div>
        `;
        container.innerHTML = editorHTML;
        
        // Initialize the existing WYSIWYGEditor
        this.wysiwygEditor = new WYSIWYGEditor();
        this.wysiwygEditor.wysiwygEditor = container.querySelector('#wysiwyg-editor-internal');
        this.wysiwygEditor.sourceEditor = container.querySelector('#markdown-source-editor-internal');
        this.wysiwygEditor.wordCount = container.querySelector('#word-count-display-internal-wysiwyg');
        this.wysiwygEditor.charCount = container.querySelector('#char-count-display-internal-wysiwyg');
        this.wysiwygEditor.cursorPosition = container.querySelector('#cursor-position-internal-wysiwyg');
        this.wysiwygEditor.documentPath = container.querySelector('#document-path-internal-wysiwyg');
        this.wysiwygEditor.autoSaveStatus = container.querySelector('#auto-save-status-internal-wysiwyg');
        this.wysiwygEditor.viewMode = container.querySelector('#view-mode-internal');
        this.wysiwygEditor.fileTree = container.querySelector('#file-tree-internal-wysiwyg');
        
        return true;
    }
    
    /**
     * Setup event bridging between component and existing editors
     */
    setupEventBridging() {
        // Bridge content changes
        this.component.addEventListener('content-change', (e) => {
            this.syncContentToEditors(e.detail.content);
        });
        
        // Bridge save events
        this.component.addEventListener('save', (e) => {
            this.handleSave(e.detail.content);
        });
    }
    
    /**
     * Sync content to existing editor instances
     */
    syncContentToEditors(content) {
        if (this.markdownEditor && this.markdownEditor.editor) {
            this.markdownEditor.editor.value = content;
            if (this.markdownEditor.updatePreview) {
                this.markdownEditor.updatePreview();
            }
        }
        
        if (this.wysiwygEditor && this.wysiwygEditor.wysiwygEditor) {
            if (this.wysiwygEditor.markdownToHTML) {
                this.wysiwygEditor.wysiwygEditor.innerHTML = this.wysiwygEditor.markdownToHTML(content);
            }
        }
    }
    
    /**
     * Handle save operations with existing editor logic
     */
    async handleSave(content) {
        try {
            // Use existing save logic if available
            if (this.markdownEditor && this.markdownEditor.saveFile) {
                await this.markdownEditor.saveFile();
            }
            
            if (this.wysiwygEditor && this.wysiwygEditor.saveDocument) {
                await this.wysiwygEditor.saveDocument();
            }
            
            // Dispatch save complete event
            this.component.dispatchEvent(new CustomEvent('save-complete', {
                detail: { content, timestamp: new Date() }
            }));
            
        } catch (error) {
            console.error('Save failed:', error);
            this.component.dispatchEvent(new CustomEvent('save-error', {
                detail: { error }
            }));
        }
    }
    
    /**
     * Convert HTML to Markdown using existing converter
     */
    htmlToMarkdown(html) {
        if (this.wysiwygEditor && this.wysiwygEditor.htmlToMarkdown) {
            return this.wysiwygEditor.htmlToMarkdown(html);
        }
        
        // Fallback to basic conversion
        return this.component.htmlToMarkdown(html);
    }
    
    /**
     * Convert Markdown to HTML using existing converter
     */
    markdownToHTML(markdown) {
        if (this.wysiwygEditor && this.wysiwygEditor.markdownToHTML) {
            return this.wysiwygEditor.markdownToHTML(markdown);
        }
        
        if (this.markdownEditor && this.markdownEditor.parseMarkdown) {
            return this.markdownEditor.parseMarkdown(markdown);
        }
        
        // Fallback to basic conversion
        return this.component.markdownToHTML(markdown);
    }
    
    /**
     * Get advanced statistics using existing editor logic
     */
    getAdvancedStats(content) {
        const stats = {
            words: 0,
            characters: 0,
            paragraphs: 0,
            headings: 0,
            links: 0,
            images: 0,
            codeBlocks: 0
        };
        
        if (this.markdownEditor && this.markdownEditor.getStats) {
            return this.markdownEditor.getStats(content);
        }
        
        // Basic statistics calculation
        stats.words = content.trim() ? content.trim().split(/\s+/).length : 0;
        stats.characters = content.length;
        stats.paragraphs = content.split(/\n\s*\n/).length;
        stats.headings = (content.match(/^#+\s/gm) || []).length;
        stats.links = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
        stats.images = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
        stats.codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
        
        return stats;
    }
    
    /**
     * Handle AI integration if available
     */
    async handleAIAssist(context) {
        if (window.aiIntegration && window.aiIntegration.isInitialized) {
            try {
                const prompt = window.aiIntegration.getPrompt('content', 'copywriting');
                // Process AI assistance
                return await this.processAIRequest(context, prompt);
            } catch (error) {
                console.error('AI assistance failed:', error);
                return null;
            }
        }
        
        return null;
    }
    
    /**
     * Process AI assistance request
     */
    async processAIRequest(context, prompt) {
        // This would integrate with your existing AI functionality
        // Return suggested content or improvements
        return {
            suggestions: [],
            improvements: [],
            alternatives: []
        };
    }
    
    /**
     * Handle database operations if available
     */
    async handleDatabaseOperation(operation, data) {
        if (this.markdownEditor && this.markdownEditor.sqlAgent) {
            try {
                switch (operation) {
                    case 'save':
                        return await this.markdownEditor.sqlAgent.saveDocument(data);
                    case 'load':
                        return await this.markdownEditor.sqlAgent.loadDocument(data.id);
                    case 'list':
                        return await this.markdownEditor.sqlAgent.listDocuments();
                    case 'delete':
                        return await this.markdownEditor.sqlAgent.deleteDocument(data.id);
                }
            } catch (error) {
                console.error('Database operation failed:', error);
                throw error;
            }
        }
        
        throw new Error('Database functionality not available');
    }
    
    /**
     * Export editor functionality for component use
     */
    exportFunctionality() {
        return {
            htmlToMarkdown: this.htmlToMarkdown.bind(this),
            markdownToHTML: this.markdownToHTML.bind(this),
            getAdvancedStats: this.getAdvancedStats.bind(this),
            handleAIAssist: this.handleAIAssist.bind(this),
            handleDatabaseOperation: this.handleDatabaseOperation.bind(this)
        };
    }
}

/**
 * Enhanced Markdown Editor Component with Integration
 * Extends the base component with existing editor functionality
 */
class EnhancedMarkdownEditorComponent extends MarkdownEditorComponent {
    constructor() {
        super();
        this.integration = new MarkdownEditorIntegration(this);
    }
    
    async initialize() {
        // Initialize base component
        await super.initialize();
        
        // Initialize integration
        await this.integration.initialize();
        
        // Override methods with enhanced functionality
        this.htmlToMarkdown = this.integration.htmlToMarkdown.bind(this.integration);
        this.markdownToHTML = this.integration.markdownToHTML.bind(this.integration);
        
        // Add advanced features
        this.setupAdvancedFeatures();
    }
    
    setupAdvancedFeatures() {
        // Add AI assistance button if available
        if (window.aiIntegration) {
            this.addAIAssistanceButton();
        }
        
        // Add database features if available
        if (this.integration.markdownEditor && this.integration.markdownEditor.sqlAgent) {
            this.addDatabaseFeatures();
        }
        
        // Enhanced statistics
        this.setupAdvancedStatistics();
    }
    
    addAIAssistanceButton() {
        const toolbar = this.shadowRoot.querySelector('.toolbar');
        if (toolbar) {
            const aiButton = document.createElement('button');
            aiButton.className = 'toolbar-button';
            aiButton.innerHTML = '🤖 AI';
            aiButton.title = 'AI Writing Assistant';
            aiButton.addEventListener('click', async () => {
                const content = this.getContent();
                const assistance = await this.integration.handleAIAssist({ content });
                if (assistance) {
                    this.showAIAssistancePanel(assistance);
                }
            });
            toolbar.appendChild(aiButton);
        }
    }
    
    addDatabaseFeatures() {
        const toolbar = this.shadowRoot.querySelector('.toolbar');
        if (toolbar) {
            const loadButton = document.createElement('button');
            loadButton.className = 'toolbar-button';
            loadButton.innerHTML = '📂 Load';
            loadButton.title = 'Load from Database';
            loadButton.addEventListener('click', () => this.showLoadDialog());
            toolbar.appendChild(loadButton);
            
            const saveButton = document.createElement('button');
            saveButton.className = 'toolbar-button';
            saveButton.innerHTML = '💾 Save';
            saveButton.title = 'Save to Database';
            saveButton.addEventListener('click', () => this.saveToDatabase());
            toolbar.appendChild(saveButton);
        }
    }
    
    setupAdvancedStatistics() {
        // Override updateStats with advanced functionality
        const originalUpdateStats = this.updateStats.bind(this);
        this.updateStats = () => {
            originalUpdateStats();
            
            const content = this.getContent();
            const advancedStats = this.integration.getAdvancedStats(content);
            
            // Update status bar with advanced stats
            const statusBar = this.shadowRoot.querySelector('.status-left');
            if (statusBar) {
                statusBar.innerHTML = `
                    <span>${advancedStats.words} words</span>
                    <span>${advancedStats.characters} characters</span>
                    <span>${advancedStats.paragraphs} paragraphs</span>
                    <span>${advancedStats.headings} headings</span>
                `;
            }
        };
    }
    
    showAIAssistancePanel(assistance) {
        // Create and show AI assistance modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; max-height: 400px; overflow-y: auto;">
                <h3>AI Writing Assistant</h3>
                <div>AI suggestions would appear here...</div>
                <button onclick="this.closest('div').parentElement.remove()">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    showLoadDialog() {
        // Show document selection dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px;">
                <h3>Load Document</h3>
                <div>Document list would appear here...</div>
                <button onclick="this.closest('div').parentElement.remove()">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async saveToDatabase() {
        try {
            const content = this.getContent();
            const result = await this.integration.handleDatabaseOperation('save', {
                content,
                name: 'Untitled Document',
                timestamp: new Date()
            });
            
            console.log('Document saved:', result);
            
            // Update save status
            const saveStatus = this.shadowRoot.getElementById('save-status');
            if (saveStatus) {
                saveStatus.textContent = 'Saved to Database';
            }
            
        } catch (error) {
            console.error('Failed to save to database:', error);
        }
    }
}

// Register the enhanced component
customElements.define('enhanced-markdown-editor', EnhancedMarkdownEditorComponent);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        MarkdownEditorIntegration, 
        EnhancedMarkdownEditorComponent 
    };
}

// Global access
if (typeof window !== 'undefined') {
    window.MarkdownEditorIntegration = MarkdownEditorIntegration;
    window.EnhancedMarkdownEditorComponent = EnhancedMarkdownEditorComponent;
}