/**
 * Markdown Editor - Browser-in-Browser Editor with Live Editing
 * Features: Auto-save, Database integration, Live preview, AI assistance
 */

class MarkdownEditor {
    constructor() {
        this.editor = null;
        this.preview = null;
        this.currentDocument = {
            id: null,
            name: 'untitled.md',
            content: '',
            lastSaved: null,
            isDirty: false
        };
        this.autoSaveTimer = null;
        this.autoSaveDelay = 2000; // 2 seconds like Obsidian
        this.isInitialized = false;
        this.sqlAgent = null;
        this.shortcuts = new Map();
        this.plugins = new Map();
    }

    /**
     * Initialize the markdown editor
     */
    async init() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.initializeAutoSave();
            this.setupMarkdownRenderer();
            await this.initializeDatabaseConnection();
            await this.loadDocuments();
            
            this.isInitialized = true;
            console.log('Markdown Editor initialized successfully');
            
            // Initial render
            this.updatePreview();
            this.updateStats();
            this.updateStatus('Ready');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Markdown Editor:', error);
            this.updateStatus('Initialization failed', 'error');
            return false;
        }
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.editor = document.getElementById('markdown-editor');
        this.preview = document.getElementById('preview-content');
        this.wordCount = document.getElementById('word-count-display');
        this.charCount = document.getElementById('char-count-display');
        this.cursorPosition = document.getElementById('cursor-position');
        this.documentPath = document.getElementById('document-path');
        this.autoSaveStatus = document.getElementById('auto-save-status');
        this.lastSaved = document.getElementById('last-saved');
        this.fileTree = document.getElementById('file-tree');
        
        if (!this.editor) {
            throw new Error('Markdown editor element not found');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Editor events
        this.editor.addEventListener('input', (e) => this.handleInput(e));
        this.editor.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.editor.addEventListener('scroll', (e) => this.handleEditorScroll(e));
        
        // Menu events
        this.setupMenuEvents();
        
        // Toolbar events
        this.setupToolbarEvents();
        
        // Window events
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        window.addEventListener('resize', (e) => this.handleResize(e));
        
        // File explorer events
        this.setupFileExplorerEvents();
        
        // Update cursor position on selection change
        this.editor.addEventListener('keyup', () => this.updateCursorPosition());
        this.editor.addEventListener('mouseup', () => this.updateCursorPosition());
    }

    /**
     * Setup menu event listeners
     */
    setupMenuEvents() {
        // File menu
        document.getElementById('new-file')?.addEventListener('click', () => this.newFile());
        document.getElementById('open-file')?.addEventListener('click', () => this.openFile());
        document.getElementById('save-file')?.addEventListener('click', () => this.saveFile());
        document.getElementById('export-file')?.addEventListener('click', () => this.exportFile());
        
        // Edit menu
        document.getElementById('undo')?.addEventListener('click', () => this.undo());
        document.getElementById('redo')?.addEventListener('click', () => this.redo());
        document.getElementById('find-replace')?.addEventListener('click', () => this.showFindReplace());
        
        // View menu
        document.getElementById('toggle-preview')?.addEventListener('click', () => this.togglePreview());
        document.getElementById('split-view')?.addEventListener('click', () => this.toggleSplitView());
        document.getElementById('fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        
        // Tools menu
        document.getElementById('word-count')?.addEventListener('click', () => this.showWordCount());
        document.getElementById('outline')?.addEventListener('click', () => this.showOutline());
        document.getElementById('ai-assist')?.addEventListener('click', () => this.showAIAssist());
        
        // Menu toggle
        document.getElementById('menu-toggle')?.addEventListener('click', () => this.toggleMenu());
        
        // Explorer toggle
        document.getElementById('explorer-toggle')?.addEventListener('click', () => this.toggleExplorer());
    }

    /**
     * Setup toolbar event listeners
     */
    setupToolbarEvents() {
        const toolbarActions = {
            'bold-btn': () => this.formatText('**', '**'),
            'italic-btn': () => this.formatText('*', '*'),
            'code-btn': () => this.formatText('`', '`'),
            'h1-btn': () => this.formatHeading(1),
            'h2-btn': () => this.formatHeading(2),
            'h3-btn': () => this.formatHeading(3),
            'link-btn': () => this.insertLink(),
            'image-btn': () => this.insertImage(),
            'table-btn': () => this.insertTable(),
            'sync-scroll': () => this.toggleScrollSync()
        };
        
        Object.entries(toolbarActions).forEach(([id, action]) => {
            document.getElementById(id)?.addEventListener('click', action);
        });
    }

    /**
     * Setup file explorer events
     */
    setupFileExplorerEvents() {
        // File tree click handling will be added when files are loaded
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const shortcuts = {
            'Ctrl+S': () => this.saveFile(),
            'Ctrl+N': () => this.newFile(),
            'Ctrl+O': () => this.openFile(),
            'Ctrl+Z': () => this.undo(),
            'Ctrl+Y': () => this.redo(),
            'Ctrl+B': () => this.formatText('**', '**'),
            'Ctrl+I': () => this.formatText('*', '*'),
            'Ctrl+K': () => this.insertLink(),
            'Ctrl+/': () => this.toggleComment(),
            'F11': () => this.toggleFullscreen(),
            'Ctrl+P': () => this.showCommandPalette(),
            'Ctrl+Shift+P': () => this.togglePreview()
        };
        
        Object.entries(shortcuts).forEach(([key, action]) => {
            this.shortcuts.set(key, action);
        });
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(event) {
        const key = this.getShortcutKey(event);
        const action = this.shortcuts.get(key);
        
        if (action) {
            event.preventDefault();
            action();
            return;
        }
        
        // Handle tab key for indentation
        if (event.key === 'Tab') {
            event.preventDefault();
            this.insertAtCursor('    '); // 4 spaces
        }
    }

    /**
     * Get shortcut key string from event
     */
    getShortcutKey(event) {
        const parts = [];
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.shiftKey) parts.push('Shift');
        if (event.altKey) parts.push('Alt');
        if (event.metaKey) parts.push('Meta');
        
        if (event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt' && event.key !== 'Meta') {
            parts.push(event.key);
        }
        
        return parts.join('+');
    }

    /**
     * Handle editor input for auto-save
     */
    handleInput(event) {
        this.currentDocument.content = this.editor.value;
        this.currentDocument.isDirty = true;
        
        // Clear existing auto-save timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        // Set new auto-save timer
        this.autoSaveTimer = setTimeout(() => {
            this.autoSave();
        }, this.autoSaveDelay);
        
        // Update UI
        this.updatePreview();
        this.updateStats();
        this.updateAutoSaveStatus('typing');
    }

    /**
     * Initialize auto-save functionality
     */
    initializeAutoSave() {
        // Auto-save every 30 seconds as backup
        setInterval(() => {
            if (this.currentDocument.isDirty) {
                this.autoSave();
            }
        }, 30000);
    }

    /**
     * Auto-save current document
     */
    async autoSave() {
        if (!this.currentDocument.isDirty) return;
        
        try {
            this.updateAutoSaveStatus('saving');
            
            // Save to database via SQL agent
            await this.saveToDatabase();
            
            this.currentDocument.isDirty = false;
            this.currentDocument.lastSaved = new Date();
            
            this.updateAutoSaveStatus('saved');
            this.updateLastSavedTime();
            
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.updateAutoSaveStatus('error');
        }
    }

    /**
     * Initialize database connection
     */
    async initializeDatabaseConnection() {
        // Initialize SQL Database Agent
        this.sqlAgent = new SQLDatabaseAgent({
            host: 'localhost',
            database: 'markdown_editor',
            table: 'documents'
        });
        
        try {
            await this.sqlAgent.connect();
            console.log('Database connection established');
            this.updateConnectionStatus('connected');
        } catch (error) {
            console.error('Database connection failed:', error);
            this.updateConnectionStatus('disconnected');
            // Continue with local storage fallback
        }
    }

    /**
     * Save current document to database
     */
    async saveToDatabase() {
        if (!this.sqlAgent || !this.sqlAgent.isConnected) {
            // Fallback to localStorage
            this.saveToLocalStorage();
            return;
        }
        
        const documentData = {
            id: this.currentDocument.id,
            name: this.currentDocument.name,
            content: this.currentDocument.content,
            updated_at: new Date().toISOString()
        };
        
        if (this.currentDocument.id) {
            // Update existing document
            await this.sqlAgent.update(documentData);
        } else {
            // Create new document
            const result = await this.sqlAgent.insert(documentData);
            this.currentDocument.id = result.id;
        }
    }

    /**
     * Fallback save to localStorage
     */
    saveToLocalStorage() {
        const documents = JSON.parse(localStorage.getItem('markdown_documents') || '[]');
        const existingIndex = documents.findIndex(doc => doc.id === this.currentDocument.id);
        
        const documentData = {
            id: this.currentDocument.id || Date.now().toString(),
            name: this.currentDocument.name,
            content: this.currentDocument.content,
            updated_at: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            documents[existingIndex] = documentData;
        } else {
            documents.push(documentData);
            this.currentDocument.id = documentData.id;
        }
        
        localStorage.setItem('markdown_documents', JSON.stringify(documents));
    }

    /**
     * Load documents from database or localStorage
     */
    async loadDocuments() {
        try {
            let documents = [];
            
            if (this.sqlAgent && this.sqlAgent.isConnected) {
                documents = await this.sqlAgent.selectAll();
            } else {
                documents = JSON.parse(localStorage.getItem('markdown_documents') || '[]');
            }
            
            this.renderFileTree(documents);
            
        } catch (error) {
            console.error('Failed to load documents:', error);
            this.fileTree.innerHTML = '<div class="error-message">Failed to load documents</div>';
        }
    }

    /**
     * Render file tree in explorer
     */
    renderFileTree(documents) {
        if (documents.length === 0) {
            this.fileTree.innerHTML = '<div class="no-documents">No documents yet</div>';
            return;
        }
        
        const html = documents.map(doc => `
            <div class="file-item" data-id="${doc.id}">
                <span class="file-icon">📄</span>
                <span class="file-name">${doc.name}</span>
                <span class="file-date">${this.formatDate(doc.updated_at)}</span>
            </div>
        `).join('');
        
        this.fileTree.innerHTML = html;
        
        // Add click handlers
        this.fileTree.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const docId = item.dataset.id;
                this.loadDocument(docId);
            });
        });
    }

    /**
     * Load a specific document
     */
    async loadDocument(docId) {
        try {
            let document;
            
            if (this.sqlAgent && this.sqlAgent.isConnected) {
                document = await this.sqlAgent.selectById(docId);
            } else {
                const documents = JSON.parse(localStorage.getItem('markdown_documents') || '[]');
                document = documents.find(doc => doc.id === docId);
            }
            
            if (document) {
                this.currentDocument = {
                    id: document.id,
                    name: document.name,
                    content: document.content,
                    lastSaved: new Date(document.updated_at),
                    isDirty: false
                };
                
                this.editor.value = document.content;
                this.documentPath.value = document.name;
                this.updatePreview();
                this.updateStats();
                this.updateCursorPosition();
                this.updateStatus(`Loaded: ${document.name}`);
            }
            
        } catch (error) {
            console.error('Failed to load document:', error);
            this.updateStatus('Failed to load document', 'error');
        }
    }

    /**
     * Setup markdown renderer
     */
    setupMarkdownRenderer() {
        // Simple markdown parser - in production use marked.js or similar
        this.markdownRenderer = {
            render: (text) => {
                return text
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                    .replace(/`(.*?)`/gim, '<code>$1</code>')
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
                    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1">')
                    .replace(/^- (.*)$/gim, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                    .replace(/^\d+\. (.*)$/gim, '<li>$1</li>')
                    .replace(/\n\n/gim, '</p><p>')
                    .replace(/\n/gim, '<br>')
                    .replace(/^(.*)$/gim, '<p>$1</p>')
                    .replace(/<p><h([1-6])>/gim, '<h$1>')
                    .replace(/<\/h([1-6])><\/p>/gim, '</h$1>')
                    .replace(/<p><ul>/gim, '<ul>')
                    .replace(/<\/ul><\/p>/gim, '</ul>')
                    .replace(/<p><li>/gim, '<li>')
                    .replace(/<\/li><\/p>/gim, '</li>');
            }
        };
    }

    /**
     * Update live preview
     */
    updatePreview() {
        if (!this.preview) return;
        
        const html = this.markdownRenderer.render(this.editor.value);
        this.preview.innerHTML = html;
    }

    /**
     * Update editor statistics
     */
    updateStats() {
        const content = this.editor.value;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        
        if (this.wordCount) this.wordCount.textContent = `${words} words`;
        if (this.charCount) this.charCount.textContent = `${chars} characters`;
    }

    /**
     * Update cursor position
     */
    updateCursorPosition() {
        const pos = this.editor.selectionStart;
        const content = this.editor.value.substring(0, pos);
        const lines = content.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        
        if (this.cursorPosition) {
            this.cursorPosition.textContent = `Line ${line}, Col ${col}`;
        }
    }

    /**
     * Update auto-save status
     */
    updateAutoSaveStatus(state) {
        if (!this.autoSaveStatus) return;
        
        const statusText = this.autoSaveStatus.querySelector('.save-text');
        const statusIcon = this.autoSaveStatus.querySelector('.save-icon');
        
        switch (state) {
            case 'typing':
                statusText.textContent = 'Unsaved';
                statusIcon.textContent = '✏️';
                this.autoSaveStatus.className = 'auto-save-indicator typing';
                break;
            case 'saving':
                statusText.textContent = 'Saving';
                statusIcon.textContent = '💾';
                this.autoSaveStatus.className = 'auto-save-indicator saving';
                break;
            case 'saved':
                statusText.textContent = 'Saved';
                statusIcon.textContent = '✅';
                this.autoSaveStatus.className = 'auto-save-indicator saved';
                break;
            case 'error':
                statusText.textContent = 'Error';
                statusIcon.textContent = '❌';
                this.autoSaveStatus.className = 'auto-save-indicator error';
                break;
        }
    }

    /**
     * Update last saved time
     */
    updateLastSavedTime() {
        if (!this.lastSaved || !this.currentDocument.lastSaved) return;
        
        const now = new Date();
        const saved = this.currentDocument.lastSaved;
        const diff = Math.floor((now - saved) / 1000);
        
        let timeText;
        if (diff < 60) {
            timeText = 'just now';
        } else if (diff < 3600) {
            timeText = `${Math.floor(diff / 60)} minutes ago`;
        } else {
            timeText = saved.toLocaleTimeString();
        }
        
        this.lastSaved.textContent = `Saved ${timeText}`;
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;
        
        statusElement.className = `status-item ${status}`;
        
        switch (status) {
            case 'connected':
                statusElement.textContent = '🟢 Connected';
                break;
            case 'disconnected':
                statusElement.textContent = '🔴 Offline';
                break;
            case 'connecting':
                statusElement.textContent = '🟡 Connecting';
                break;
        }
    }

    /**
     * Update general status
     */
    updateStatus(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Could also show in a status bar or notification
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    formatText(before, after) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);
        const replacement = before + selectedText + after;
        
        this.editor.setRangeText(replacement, start, end, 'end');
        this.editor.focus();
        this.handleInput(); // Trigger auto-save
    }

    formatHeading(level) {
        const start = this.editor.selectionStart;
        const lineStart = this.editor.value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = this.editor.value.indexOf('\n', start);
        const line = this.editor.value.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
        
        const hashes = '#'.repeat(level) + ' ';
        const newLine = hashes + line.replace(/^#+\s*/, '');
        
        this.editor.setRangeText(newLine, lineStart, lineEnd === -1 ? undefined : lineEnd, 'end');
        this.editor.focus();
        this.handleInput();
    }

    insertAtCursor(text) {
        const start = this.editor.selectionStart;
        this.editor.setRangeText(text, start, start, 'end');
        this.editor.focus();
        this.handleInput();
    }

    // Menu Actions
    newFile() {
        if (this.currentDocument.isDirty) {
            if (!confirm('You have unsaved changes. Create new file anyway?')) {
                return;
            }
        }
        
        this.currentDocument = {
            id: null,
            name: 'untitled.md',
            content: '',
            lastSaved: null,
            isDirty: false
        };
        
        this.editor.value = '';
        this.documentPath.value = 'untitled.md';
        this.updatePreview();
        this.updateStats();
        this.updateCursorPosition();
        this.updateStatus('New file created');
    }

    async saveFile() {
        await this.autoSave();
        this.updateStatus('File saved manually');
    }

    openFile() {
        console.log('Open file dialog would appear here');
    }

    exportFile() {
        const content = this.editor.value;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentDocument.name;
        a.click();
        URL.revokeObjectURL(url);
    }

    toggleMenu() {
        const menuBar = document.getElementById('menu-bar');
        menuBar.classList.toggle('collapsed');
    }

    toggleExplorer() {
        const explorer = document.getElementById('file-explorer');
        explorer.classList.toggle('collapsed');
    }

    togglePreview() {
        const previewPane = document.getElementById('preview-pane');
        previewPane.style.display = previewPane.style.display === 'none' ? 'flex' : 'none';
    }

    // Additional methods
    undo() { document.execCommand('undo'); }
    redo() { document.execCommand('redo'); }
    showFindReplace() { console.log('Find & Replace dialog'); }
    toggleSplitView() { console.log('Toggle split view'); }
    toggleFullscreen() { 
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }
    showWordCount() { console.log('Word count details'); }
    showOutline() { console.log('Document outline'); }
    showAIAssist() { 
        if (window.aiIntegration && window.aiIntegration.isInitialized) {
            const prompt = window.aiIntegration.getPrompt('content', 'copywriting');
            console.log('AI Assistant activated with prompt:', prompt);
        } else {
            console.log('AI Assistant - AI Integration not available');
        }
    }
    insertLink() { 
        const url = prompt('Enter URL:');
        if (url) this.formatText('[Link Text](', url + ')');
    }
    insertImage() {
        const url = prompt('Enter image URL:');
        if (url) this.insertAtCursor(`![Alt text](${url})`);
    }
    insertTable() {
        const table = '\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n';
        this.insertAtCursor(table);
    }
    toggleComment() { console.log('Toggle comment'); }
    showCommandPalette() { console.log('Command palette'); }
    toggleScrollSync() { console.log('Toggle scroll sync'); }
    handleEditorScroll() { /* Sync scroll with preview */ }
    handleResize() { /* Handle window resize */ }
    handleBeforeUnload(e) {
        if (this.currentDocument.isDirty) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }
}

/**
 * SQL Database Agent for PostgreSQL integration
 */
class SQLDatabaseAgent {
    constructor(config) {
        this.config = config;
        this.isConnected = false;
    }

    async connect() {
        try {
            // In a real implementation, this would connect to PostgreSQL
            console.log('Connecting to PostgreSQL database...');
            
            // Simulate connection delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.isConnected = true;
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async selectAll() {
        if (!this.isConnected) throw new Error('Database not connected');
        
        console.log('SELECT * FROM documents ORDER BY updated_at DESC');
        
        // Return mock data for now
        return [
            {
                id: '1',
                name: 'welcome.md',
                content: '# Welcome\n\nThis is a sample document.',
                updated_at: new Date().toISOString()
            }
        ];
    }

    async selectById(id) {
        if (!this.isConnected) throw new Error('Database not connected');
        
        console.log(`SELECT * FROM documents WHERE id = ${id}`);
        
        return {
            id: id,
            name: 'document.md',
            content: '# Document\n\nContent here...',
            updated_at: new Date().toISOString()
        };
    }

    async insert(data) {
        if (!this.isConnected) throw new Error('Database not connected');
        
        console.log('INSERT INTO documents', data);
        
        return { id: Date.now().toString() };
    }

    async update(data) {
        if (!this.isConnected) throw new Error('Database not connected');
        
        console.log('UPDATE documents SET', data);
        
        return { success: true };
    }

    async delete(id) {
        if (!this.isConnected) throw new Error('Database not connected');
        
        console.log(`DELETE FROM documents WHERE id = ${id}`);
        
        return { success: true };
    }
}

// Global instance
const markdownEditor = new MarkdownEditor();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        markdownEditor.init().then(success => {
            if (success) {
                console.log('Markdown Editor ready!');
                
                // Trigger custom event
                document.dispatchEvent(new CustomEvent('markdownEditorReady', {
                    detail: { markdownEditor }
                }));
            }
        });
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MarkdownEditor, SQLDatabaseAgent, markdownEditor };
}

// Global access
if (typeof window !== 'undefined') {
    window.MarkdownEditor = MarkdownEditor;
    window.SQLDatabaseAgent = SQLDatabaseAgent;
    window.markdownEditor = markdownEditor;
}