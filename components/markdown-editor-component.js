/**
 * Markdown Editor Web Component
 * A reusable, framework-agnostic markdown editor component
 * Based on the existing WYSIWYG and Markdown Editor classes
 */

class MarkdownEditorComponent extends HTMLElement {
    constructor() {
        super();
        
        // Create shadow DOM for encapsulation
        this.attachShadow({ mode: 'open' });
        
        // Default configuration
        this.config = {
            theme: 'default',
            mode: 'wysiwyg', // 'wysiwyg', 'markdown', 'split'
            height: '500px',
            width: '100%',
            autosave: true,
            autosaveDelay: 2000,
            showToolbar: true,
            showMenuBar: true,
            showStatusBar: true,
            features: {
                database: false,
                aiIntegration: false,
                fileExplorer: false,
                preview: true,
                markdownTooltips: true,
                autoConversion: false
            },
            toolbar: {
                bold: true,
                italic: true,
                heading: true,
                link: true,
                image: true,
                code: true,
                list: true,
                quote: true,
                table: true
            }
        };
        
        // Internal state
        this.editorInstance = null;
        this.isInitialized = false;
        this.content = '';
        
        // Bind methods
        this.handleContentChange = this.handleContentChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
    }
    
    // Define observed attributes
    static get observedAttributes() {
        return [
            'mode', 'theme', 'height', 'width', 'autosave', 'content',
            'show-toolbar', 'show-menubar', 'show-statusbar'
        ];
    }
    
    // Handle attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateConfig(name, newValue);
            if (this.isInitialized) {
                this.updateEditor();
            }
        }
    }
    
    // Called when element is added to DOM
    connectedCallback() {
        this.render();
        this.initialize();
    }
    
    // Called when element is removed from DOM
    disconnectedCallback() {
        this.cleanup();
    }
    
    // Update configuration from attributes
    updateConfig(attribute, value) {
        switch (attribute) {
            case 'mode':
                this.config.mode = value || 'wysiwyg';
                break;
            case 'theme':
                this.config.theme = value || 'default';
                break;
            case 'height':
                this.config.height = value || '500px';
                break;
            case 'width':
                this.config.width = value || '100%';
                break;
            case 'autosave':
                this.config.autosave = value !== 'false';
                break;
            case 'content':
                this.content = value || '';
                break;
            case 'show-toolbar':
                this.config.showToolbar = value !== 'false';
                break;
            case 'show-menubar':
                this.config.showMenuBar = value !== 'false';
                break;
            case 'show-statusbar':
                this.config.showStatusBar = value !== 'false';
                break;
        }
    }
    
    // Render the component HTML
    render() {
        const styles = this.getStyles();
        const html = this.getHTML();
        
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            ${html}
        `;
    }
    
    // Get component styles
    getStyles() {
        return `
            :host {
                display: block;
                width: ${this.config.width};
                height: ${this.config.height};
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --primary-color: #007acc;
                --secondary-color: #f6f8fa;
                --text-color: #24292e;
                --border-color: #e1e5e9;
                --background-color: #ffffff;
            }
            
            .editor-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--background-color);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .menu-bar {
                display: ${this.config.showMenuBar ? 'flex' : 'none'};
                background: var(--secondary-color);
                border-bottom: 1px solid var(--border-color);
                padding: 8px 12px;
                gap: 12px;
                font-size: 14px;
            }
            
            .toolbar {
                display: ${this.config.showToolbar ? 'flex' : 'none'};
                background: var(--secondary-color);
                border-bottom: 1px solid var(--border-color);
                padding: 8px 12px;
                gap: 4px;
                flex-wrap: wrap;
            }
            
            .toolbar-button {
                background: transparent;
                border: 1px solid transparent;
                border-radius: 4px;
                padding: 6px 8px;
                cursor: pointer;
                font-size: 14px;
                color: var(--text-color);
                transition: all 0.2s ease;
            }
            
            .toolbar-button:hover {
                background: #e1e5e9;
                border-color: #d0d7de;
            }
            
            .toolbar-button.active {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }
            
            .editor-content {
                flex: 1;
                display: flex;
                overflow: hidden;
            }
            
            .editor-pane {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .wysiwyg-editor, .markdown-editor {
                flex: 1;
                padding: 16px;
                border: none;
                outline: none;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.6;
                color: var(--text-color);
                background: var(--background-color);
                resize: none;
            }
            
            .wysiwyg-editor {
                min-height: 100%;
                box-sizing: border-box;
            }
            
            .wysiwyg-editor:empty:before {
                content: attr(data-placeholder);
                color: #8c959f;
                font-style: italic;
            }
            
            .preview-pane {
                flex: 1;
                border-left: 1px solid var(--border-color);
                background: var(--background-color);
                overflow-y: auto;
                padding: 16px;
            }
            
            .status-bar {
                display: ${this.config.showStatusBar ? 'flex' : 'none'};
                background: var(--secondary-color);
                border-top: 1px solid var(--border-color);
                padding: 6px 12px;
                font-size: 12px;
                color: #656d76;
                justify-content: space-between;
                align-items: center;
            }
            
            .status-left, .status-right {
                display: flex;
                gap: 12px;
                align-items: center;
            }
            
            /* Theme variations */
            :host([theme="dark"]) {
                --primary-color: #58a6ff;
                --secondary-color: #21262d;
                --text-color: #f0f6fc;
                --border-color: #30363d;
                --background-color: #0d1117;
            }
            
            :host([theme="minimal"]) {
                --secondary-color: transparent;
                --border-color: #f0f0f0;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .editor-content {
                    flex-direction: column;
                }
                
                .preview-pane {
                    border-left: none;
                    border-top: 1px solid var(--border-color);
                }
                
                .toolbar {
                    font-size: 12px;
                }
                
                .toolbar-button {
                    padding: 4px 6px;
                }
            }
        `;
    }
    
    // Get component HTML structure
    getHTML() {
        return `
            <div class="editor-container">
                ${this.config.showMenuBar ? this.getMenuBarHTML() : ''}
                ${this.config.showToolbar ? this.getToolbarHTML() : ''}
                
                <div class="editor-content">
                    <div class="editor-pane">
                        ${this.config.mode === 'wysiwyg' || this.config.mode === 'split' ? 
                            `<div class="wysiwyg-editor" 
                                  contenteditable="true" 
                                  data-placeholder="Start writing your markdown document..."
                                  id="wysiwyg-editor"></div>` : ''}
                        
                        ${this.config.mode === 'markdown' || this.config.mode === 'split' ? 
                            `<textarea class="markdown-editor" 
                                      placeholder="# Start writing markdown..."
                                      id="markdown-editor"></textarea>` : ''}
                    </div>
                    
                    ${this.config.features.preview && (this.config.mode === 'markdown' || this.config.mode === 'split') ? 
                        `<div class="preview-pane" id="preview-pane">
                            <div id="preview-content"></div>
                        </div>` : ''}
                </div>
                
                ${this.config.showStatusBar ? this.getStatusBarHTML() : ''}
            </div>
        `;
    }
    
    // Get menu bar HTML
    getMenuBarHTML() {
        return `
            <div class="menu-bar">
                <span class="menu-item">File</span>
                <span class="menu-item">Edit</span>
                <span class="menu-item">View</span>
                <span class="menu-item">Tools</span>
            </div>
        `;
    }
    
    // Get toolbar HTML
    getToolbarHTML() {
        const buttons = [];
        
        if (this.config.toolbar.bold) buttons.push('<button class="toolbar-button" data-action="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>');
        if (this.config.toolbar.italic) buttons.push('<button class="toolbar-button" data-action="italic" title="Italic (Ctrl+I)"><em>I</em></button>');
        if (this.config.toolbar.heading) buttons.push('<button class="toolbar-button" data-action="heading" title="Heading">H</button>');
        if (this.config.toolbar.link) buttons.push('<button class="toolbar-button" data-action="link" title="Link">🔗</button>');
        if (this.config.toolbar.image) buttons.push('<button class="toolbar-button" data-action="image" title="Image">🖼️</button>');
        if (this.config.toolbar.code) buttons.push('<button class="toolbar-button" data-action="code" title="Code">&lt;/&gt;</button>');
        if (this.config.toolbar.list) buttons.push('<button class="toolbar-button" data-action="list" title="List">• List</button>');
        if (this.config.toolbar.quote) buttons.push('<button class="toolbar-button" data-action="quote" title="Quote">" Quote</button>');
        if (this.config.toolbar.table) buttons.push('<button class="toolbar-button" data-action="table" title="Table">⊞ Table</button>');
        
        return `
            <div class="toolbar">
                ${buttons.join('')}
                <div style="margin-left: auto;">
                    <button class="toolbar-button" data-action="toggle-mode" title="Toggle Mode">⚙️</button>
                </div>
            </div>
        `;
    }
    
    // Get status bar HTML
    getStatusBarHTML() {
        return `
            <div class="status-bar">
                <div class="status-left">
                    <span id="word-count">0 words</span>
                    <span id="char-count">0 characters</span>
                    <span id="cursor-position">Ln 1, Col 1</span>
                </div>
                <div class="status-right">
                    <span id="save-status">Saved</span>
                    <span id="mode-indicator">${this.config.mode}</span>
                </div>
            </div>
        `;
    }
    
    // Initialize the editor
    async initialize() {
        try {
            this.setupEventListeners();
            this.setupToolbarHandlers();
            
            if (this.config.mode === 'wysiwyg' || this.config.mode === 'split') {
                await this.initializeWYSIWYG();
            }
            
            if (this.config.mode === 'markdown' || this.config.mode === 'split') {
                await this.initializeMarkdown();
            }
            
            this.setContent(this.content);
            this.isInitialized = true;
            
            // Dispatch ready event
            this.dispatchEvent(new CustomEvent('editor-ready', {
                detail: { editor: this }
            }));
            
        } catch (error) {
            console.error('Failed to initialize markdown editor component:', error);
            this.dispatchEvent(new CustomEvent('editor-error', {
                detail: { error }
            }));
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        const wysiwygEditor = this.shadowRoot.getElementById('wysiwyg-editor');
        const markdownEditor = this.shadowRoot.getElementById('markdown-editor');
        
        if (wysiwygEditor) {
            wysiwygEditor.addEventListener('input', this.handleContentChange);
            wysiwygEditor.addEventListener('keydown', this.handleKeydown.bind(this));
        }
        
        if (markdownEditor) {
            markdownEditor.addEventListener('input', this.handleContentChange);
            markdownEditor.addEventListener('keydown', this.handleKeydown.bind(this));
        }
    }
    
    // Setup toolbar handlers
    setupToolbarHandlers() {
        const toolbar = this.shadowRoot.querySelector('.toolbar');
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                if (e.target.classList.contains('toolbar-button')) {
                    const action = e.target.dataset.action;
                    this.executeToolbarAction(action);
                }
            });
        }
    }
    
    // Initialize WYSIWYG mode
    async initializeWYSIWYG() {
        // This would integrate with the existing WYSIWYGEditor class
        // For now, basic contenteditable functionality
        const editor = this.shadowRoot.getElementById('wysiwyg-editor');
        if (editor) {
            editor.addEventListener('paste', this.handlePaste.bind(this));
        }
    }
    
    // Initialize Markdown mode
    async initializeMarkdown() {
        // This would integrate with the existing MarkdownEditor class
        const editor = this.shadowRoot.getElementById('markdown-editor');
        const preview = this.shadowRoot.getElementById('preview-content');
        
        if (editor && preview) {
            // Setup preview updates
            editor.addEventListener('input', () => {
                this.updatePreview();
            });
        }
    }
    
    // Handle content changes
    handleContentChange(e) {
        this.content = this.getContent();
        this.updateStats();
        
        if (this.config.autosave) {
            this.scheduleAutoSave();
        }
        
        // Dispatch content change event
        this.dispatchEvent(new CustomEvent('content-change', {
            detail: { content: this.content }
        }));
    }
    
    // Handle keyboard shortcuts
    handleKeydown(e) {
        // Implement keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.executeToolbarAction('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.executeToolbarAction('italic');
                    break;
                case 's':
                    e.preventDefault();
                    this.save();
                    break;
            }
        }
    }
    
    // Handle paste events
    handlePaste(e) {
        // Custom paste handling for rich content
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }
    
    // Execute toolbar actions
    executeToolbarAction(action) {
        const wysiwygEditor = this.shadowRoot.getElementById('wysiwyg-editor');
        
        switch (action) {
            case 'bold':
                document.execCommand('bold');
                break;
            case 'italic':
                document.execCommand('italic');
                break;
            case 'heading':
                this.insertHeading();
                break;
            case 'link':
                this.insertLink();
                break;
            case 'image':
                this.insertImage();
                break;
            case 'code':
                this.insertCode();
                break;
            case 'list':
                document.execCommand('insertUnorderedList');
                break;
            case 'quote':
                this.insertQuote();
                break;
            case 'table':
                this.insertTable();
                break;
            case 'toggle-mode':
                this.toggleMode();
                break;
        }
        
        wysiwygEditor?.focus();
    }
    
    // Insert heading
    insertHeading() {
        const level = prompt('Heading level (1-6):', '1');
        if (level && level >= 1 && level <= 6) {
            document.execCommand('formatBlock', false, `h${level}`);
        }
    }
    
    // Insert link
    insertLink() {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    }
    
    // Insert image
    insertImage() {
        const url = prompt('Enter image URL:');
        if (url) {
            document.execCommand('insertImage', false, url);
        }
    }
    
    // Insert code
    insertCode() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const code = document.createElement('code');
            code.textContent = range.toString() || 'code';
            range.deleteContents();
            range.insertNode(code);
        }
    }
    
    // Insert quote
    insertQuote() {
        document.execCommand('formatBlock', false, 'blockquote');
    }
    
    // Insert table
    insertTable() {
        const rows = prompt('Number of rows:', '3');
        const cols = prompt('Number of columns:', '3');
        
        if (rows && cols) {
            let tableHTML = '<table><tbody>';
            for (let i = 0; i < rows; i++) {
                tableHTML += '<tr>';
                for (let j = 0; j < cols; j++) {
                    tableHTML += '<td>Cell</td>';
                }
                tableHTML += '</tr>';
            }
            tableHTML += '</tbody></table>';
            
            document.execCommand('insertHTML', false, tableHTML);
        }
    }
    
    // Toggle editor mode
    toggleMode() {
        const modes = ['wysiwyg', 'markdown', 'split'];
        const currentIndex = modes.indexOf(this.config.mode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        this.setAttribute('mode', modes[nextIndex]);
    }
    
    // Update preview for markdown mode
    updatePreview() {
        const editor = this.shadowRoot.getElementById('markdown-editor');
        const preview = this.shadowRoot.getElementById('preview-content');
        
        if (editor && preview) {
            // Basic markdown parsing - would integrate with existing parser
            const markdown = editor.value;
            const html = this.parseMarkdown(markdown);
            preview.innerHTML = html;
        }
    }
    
    // Basic markdown parser (simplified)
    parseMarkdown(markdown) {
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            .replace(/\n/gim, '<br>');
    }
    
    // Update editor stats
    updateStats() {
        const content = this.getContent();
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        
        const wordCountEl = this.shadowRoot.getElementById('word-count');
        const charCountEl = this.shadowRoot.getElementById('char-count');
        
        if (wordCountEl) wordCountEl.textContent = `${words} words`;
        if (charCountEl) charCountEl.textContent = `${chars} characters`;
    }
    
    // Schedule auto-save
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.save();
        }, this.config.autosaveDelay);
    }
    
    // Update editor configuration
    updateEditor() {
        this.render();
        this.initialize();
    }
    
    // Clean up resources
    cleanup() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
    }
    
    // Public API methods
    
    // Get current content
    getContent() {
        if (this.config.mode === 'wysiwyg') {
            const editor = this.shadowRoot.getElementById('wysiwyg-editor');
            return editor ? this.htmlToMarkdown(editor.innerHTML) : '';
        } else {
            const editor = this.shadowRoot.getElementById('markdown-editor');
            return editor ? editor.value : '';
        }
    }
    
    // Set content
    setContent(content) {
        this.content = content;
        
        if (this.config.mode === 'wysiwyg') {
            const editor = this.shadowRoot.getElementById('wysiwyg-editor');
            if (editor) {
                editor.innerHTML = this.markdownToHTML(content);
            }
        } else {
            const editor = this.shadowRoot.getElementById('markdown-editor');
            if (editor) {
                editor.value = content;
            }
        }
        
        this.updatePreview();
        this.updateStats();
    }
    
    // Basic HTML to Markdown conversion
    htmlToMarkdown(html) {
        // Simplified - would use the existing converter
        return html
            .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
            .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
            .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
            .replace(/<em>(.*?)<\/em>/g, '*$1*')
            .replace(/<code>(.*?)<\/code>/g, '`$1`')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
    }
    
    // Basic Markdown to HTML conversion
    markdownToHTML(markdown) {
        return this.parseMarkdown(markdown);
    }
    
    // Save content
    save() {
        const content = this.getContent();
        
        // Update save status
        const saveStatus = this.shadowRoot.getElementById('save-status');
        if (saveStatus) {
            saveStatus.textContent = 'Saving...';
        }
        
        // Dispatch save event
        this.dispatchEvent(new CustomEvent('save', {
            detail: { content }
        }));
        
        // Simulate save completion
        setTimeout(() => {
            if (saveStatus) {
                saveStatus.textContent = 'Saved ' + new Date().toLocaleTimeString();
            }
        }, 500);
        
        return content;
    }
    
    // Configure the editor
    configure(options) {
        this.config = { ...this.config, ...options };
        if (this.isInitialized) {
            this.updateEditor();
        }
    }
    
    // Get current configuration
    getConfiguration() {
        return { ...this.config };
    }
    
    // Focus the editor
    focus() {
        const editor = this.shadowRoot.getElementById('wysiwyg-editor') || 
                      this.shadowRoot.getElementById('markdown-editor');
        if (editor) {
            editor.focus();
        }
    }
    
    // Insert text at cursor
    insertText(text) {
        if (this.config.mode === 'wysiwyg') {
            document.execCommand('insertText', false, text);
        } else {
            const editor = this.shadowRoot.getElementById('markdown-editor');
            if (editor) {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                const value = editor.value;
                editor.value = value.substring(0, start) + text + value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + text.length;
            }
        }
    }
}

// Register the custom element
customElements.define('markdown-editor', MarkdownEditorComponent);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownEditorComponent;
}

// Global access
if (typeof window !== 'undefined') {
    window.MarkdownEditorComponent = MarkdownEditorComponent;
}