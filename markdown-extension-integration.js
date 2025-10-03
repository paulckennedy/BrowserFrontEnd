/**
 * Markdown Extension Shortcuts Integration
 * 
 * This module integrates the markdown extension shortcuts system with the
 * existing markdown editor and document system. It provides seamless
 * integration between the enhanced document storage schema and the editor UI.
 */

class MarkdownExtensionIntegration {
    constructor(markdownEditor, options = {}) {
        this.editor = markdownEditor;
        this.shortcutManager = new MarkdownExtensionShortcuts(options);
        this.documentId = null;
        this.isProcessing = false;
        
        this.options = {
            realTimeProcessing: options.realTimeProcessing !== false,
            processingDelay: options.processingDelay || 1000,
            autoSave: options.autoSave !== false,
            ...options
        };
        
        this.initializeIntegration();
    }

    /**
     * Initialize the integration between markdown editor and shortcuts
     */
    initializeIntegration() {
        this.bindEditorEvents();
        this.setupShortcutCommands();
        this.initializeToolbar();
        this.setupKeyboardShortcuts();
    }

    /**
     * Bind events from the markdown editor
     */
    bindEditorEvents() {
        // Listen for content changes
        this.editor.on('change', this.debounce(() => {
            if (this.options.realTimeProcessing) {
                this.processCurrentDocument();
            }
        }, this.options.processingDelay));

        // Listen for cursor position changes
        this.editor.on('cursorActivity', () => {
            this.updateShortcutContext();
        });

        // Listen for selection changes
        this.editor.on('beforeSelectionChange', () => {
            this.hideActiveTooltips();
        });

        // Listen for document load
        this.editor.on('documentLoad', (documentId) => {
            this.documentId = documentId;
            this.processCurrentDocument();
        });

        // Listen for save events
        this.editor.on('save', () => {
            this.processCurrentDocument();
        });
    }

    /**
     * Setup shortcut insertion commands
     */
    setupShortcutCommands() {
        // Document reference command
        this.editor.addCommand('insertDocReference', () => {
            this.insertShortcut('doc', {
                placeholder: 'document-id',
                dialog: 'document-selector'
            });
        });

        // AI processing command
        this.editor.addCommand('insertAIShortcut', () => {
            this.insertShortcut('ai', {
                placeholder: 'summarize:document-id',
                dialog: 'ai-command-selector'
            });
        });

        // Chart creation command
        this.editor.addCommand('insertChart', () => {
            this.insertShortcut('chart', {
                placeholder: 'create:type=bar',
                dialog: 'chart-builder'
            });
        });

        // Image embedding command
        this.editor.addCommand('insertImage', () => {
            this.insertShortcut('img', {
                placeholder: 'image-id',
                dialog: 'image-selector'
            });
        });

        // User mention command
        this.editor.addCommand('insertUserMention', () => {
            this.insertShortcut('user', {
                placeholder: 'username',
                dialog: 'user-selector'
            });
        });
    }

    /**
     * Initialize toolbar buttons for shortcuts
     */
    initializeToolbar() {
        const toolbar = this.editor.getToolbar();
        
        // Add shortcut button group
        const shortcutGroup = toolbar.addGroup('shortcuts', 'Shortcuts');
        
        // Document reference button
        shortcutGroup.addButton({
            name: 'doc-reference',
            icon: '📄',
            title: 'Insert Document Reference',
            action: () => this.editor.execCommand('insertDocReference')
        });

        // AI processing button
        shortcutGroup.addButton({
            name: 'ai-shortcut',
            icon: '🤖',
            title: 'Insert AI Processing',
            action: () => this.editor.execCommand('insertAIShortcut')
        });

        // Chart button
        shortcutGroup.addButton({
            name: 'chart',
            icon: '📊',
            title: 'Insert Chart',
            action: () => this.editor.execCommand('insertChart')
        });

        // Image button
        shortcutGroup.addButton({
            name: 'image',
            icon: '🖼️',
            title: 'Insert Image',
            action: () => this.editor.execCommand('insertImage')
        });

        // User mention button
        shortcutGroup.addButton({
            name: 'user-mention',
            icon: '👤',
            title: 'Insert User Mention',
            action: () => this.editor.execCommand('insertUserMention')
        });

        // Separator
        shortcutGroup.addSeparator();

        // Process shortcuts button
        shortcutGroup.addButton({
            name: 'process-shortcuts',
            icon: '⚡',
            title: 'Process All Shortcuts',
            action: () => this.processCurrentDocument()
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const keyMap = {
            'Ctrl-Shift-D': 'insertDocReference',
            'Ctrl-Shift-A': 'insertAIShortcut', 
            'Ctrl-Shift-C': 'insertChart',
            'Ctrl-Shift-I': 'insertImage',
            'Ctrl-Shift-U': 'insertUserMention',
            'Ctrl-Shift-P': () => this.processCurrentDocument()
        };

        this.editor.addKeyMap(keyMap);
    }

    /**
     * Insert a shortcut at the current cursor position
     */
    async insertShortcut(type, options = {}) {
        const cursor = this.editor.getCursor();
        let shortcutText;

        if (options.dialog) {
            // Show dialog to configure shortcut
            const config = await this.showShortcutDialog(type, options.dialog);
            if (!config) return; // User cancelled
            
            shortcutText = this.buildShortcutText(type, config.identifier, config.parameters);
        } else {
            // Use placeholder or prompt
            const identifier = options.placeholder || 'identifier';
            shortcutText = `@[${type}:${identifier}]`;
        }

        // Insert the shortcut text
        this.editor.replaceRange(shortcutText, cursor);
        
        // Position cursor after the shortcut
        const newCursor = {
            line: cursor.line,
            ch: cursor.ch + shortcutText.length
        };
        this.editor.setCursor(newCursor);

        // Process if real-time processing is enabled
        if (this.options.realTimeProcessing) {
            setTimeout(() => this.processCurrentDocument(), 100);
        }
    }

    /**
     * Build shortcut text from components
     */
    buildShortcutText(type, identifier, parameters = {}) {
        let shortcut = `@[${type}:${identifier}`;
        
        if (Object.keys(parameters).length > 0) {
            const paramStr = Object.entries(parameters)
                .map(([key, value]) => `${key}=${value}`)
                .join('|');
            shortcut += `:${paramStr}`;
        }
        
        return shortcut + ']';
    }

    /**
     * Show dialog for configuring shortcuts
     */
    async showShortcutDialog(type, dialogType) {
        return new Promise((resolve) => {
            const dialog = this.createShortcutDialog(type, dialogType, resolve);
            document.body.appendChild(dialog);
        });
    }

    /**
     * Create shortcut configuration dialog
     */
    createShortcutDialog(type, dialogType, callback) {
        const dialog = document.createElement('div');
        dialog.className = 'shortcut-dialog';
        
        switch (dialogType) {
            case 'document-selector':
                dialog.innerHTML = this.getDocumentSelectorHTML();
                break;
            case 'ai-command-selector':
                dialog.innerHTML = this.getAICommandSelectorHTML();
                break;
            case 'chart-builder':
                dialog.innerHTML = this.getChartBuilderHTML();
                break;
            case 'image-selector':
                dialog.innerHTML = this.getImageSelectorHTML();
                break;
            case 'user-selector':
                dialog.innerHTML = this.getUserSelectorHTML();
                break;
        }

        // Add event handlers
        this.bindDialogEvents(dialog, callback);
        
        return dialog;
    }

    /**
     * Process the current document for shortcuts
     */
    async processCurrentDocument() {
        if (this.isProcessing || !this.documentId) return;
        
        this.isProcessing = true;
        this.showProcessingIndicator();

        try {
            const markdown = this.editor.getValue();
            const processedMarkdown = await this.shortcutManager.processMarkdown(
                markdown, 
                this.documentId
            );

            // Update the editor's rendered view
            this.updateEditorPreview(processedMarkdown);
            
            // Save if auto-save is enabled
            if (this.options.autoSave) {
                await this.saveDocument();
            }

        } catch (error) {
            console.error('Error processing shortcuts:', error);
            this.showError('Failed to process shortcuts: ' + error.message);
        } finally {
            this.isProcessing = false;
            this.hideProcessingIndicator();
        }
    }

    /**
     * Update the editor's preview pane with processed content
     */
    updateEditorPreview(processedMarkdown) {
        const previewPane = this.editor.getPreviewPane();
        if (previewPane) {
            // Convert markdown to HTML and render
            const html = this.markdownToHTML(processedMarkdown);
            previewPane.innerHTML = html;
            
            // Re-bind shortcut event handlers
            this.bindShortcutEvents(previewPane);
        }
    }

    /**
     * Convert markdown to HTML
     */
    markdownToHTML(markdown) {
        // Use the existing markdown parser or a library like marked.js
        if (window.marked) {
            return window.marked(markdown);
        } else {
            // Simple fallback conversion
            return markdown
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*)\*/gim, '<em>$1</em>')
                .replace(/\n/gim, '<br>');
        }
    }

    /**
     * Bind shortcut events in the preview pane
     */
    bindShortcutEvents(container) {
        const shortcuts = container.querySelectorAll('.shortcut');
        shortcuts.forEach(shortcut => {
            // Add click handler for editing shortcuts
            shortcut.addEventListener('dblclick', (e) => {
                this.editShortcutInEditor(e.target);
            });
        });
    }

    /**
     * Edit a shortcut by jumping to its location in the editor
     */
    editShortcutInEditor(shortcutElement) {
        const shortcutId = shortcutElement.dataset.shortcutId;
        const shortcut = this.shortcutManager.activeShortcuts.get(shortcutId);
        
        if (shortcut) {
            // Find the shortcut in the editor content
            const content = this.editor.getValue();
            const index = content.indexOf(shortcut.original);
            
            if (index !== -1) {
                // Convert index to line/character position
                const pos = this.editor.posFromIndex(index);
                
                // Select the shortcut text
                const endPos = this.editor.posFromIndex(index + shortcut.original.length);
                this.editor.setSelection(pos, endPos);
                
                // Focus the editor
                this.editor.focus();
            }
        }
    }

    /**
     * Update shortcut context based on cursor position
     */
    updateShortcutContext() {
        const cursor = this.editor.getCursor();
        const line = this.editor.getLine(cursor.line);
        
        // Check if cursor is within a shortcut
        const shortcutMatch = line.match(this.shortcutManager.SHORTCUT_PATTERN);
        if (shortcutMatch) {
            this.showShortcutHelp(shortcutMatch[0]);
        }
    }

    /**
     * Show contextual help for shortcuts
     */
    showShortcutHelp(shortcutText) {
        // Implementation for contextual help
        console.log('Shortcut help for:', shortcutText);
    }

    /**
     * Show processing indicator
     */
    showProcessingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'shortcut-processing-indicator';
        indicator.innerHTML = '⚡ Processing shortcuts...';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
    }

    /**
     * Hide processing indicator
     */
    hideProcessingIndicator() {
        const indicator = document.getElementById('shortcut-processing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const error = document.createElement('div');
        error.innerHTML = `❌ ${message}`;
        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 1000;
        `;
        
        document.body.appendChild(error);
        
        setTimeout(() => error.remove(), 5000);
    }

    /**
     * Hide active tooltips
     */
    hideActiveTooltips() {
        this.shortcutManager.hideTooltip();
    }

    /**
     * Save the current document
     */
    async saveDocument() {
        if (this.editor.save && typeof this.editor.save === 'function') {
            await this.editor.save();
        }
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Dialog HTML templates
    getDocumentSelectorHTML() {
        return `
            <div class="dialog-content">
                <h3>Select Document</h3>
                <input type="text" id="doc-search" placeholder="Search documents...">
                <div id="doc-list" class="dialog-list">
                    <!-- Document list will be populated dynamically -->
                </div>
                <div class="dialog-actions">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-ok">Insert</button>
                </div>
            </div>
        `;
    }

    getAICommandSelectorHTML() {
        return `
            <div class="dialog-content">
                <h3>AI Processing Command</h3>
                <select id="ai-command">
                    <option value="summarize">Summarize</option>
                    <option value="translate">Translate</option>
                    <option value="analyze">Analyze</option>
                    <option value="expand">Expand</option>
                    <option value="rewrite">Rewrite</option>
                </select>
                <input type="text" id="ai-params" placeholder="Additional parameters...">
                <div class="dialog-actions">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-ok">Insert</button>
                </div>
            </div>
        `;
    }

    getChartBuilderHTML() {
        return `
            <div class="dialog-content">
                <h3>Create Chart</h3>
                <label>Chart Type:</label>
                <select id="chart-type">
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="scatter">Scatter Plot</option>
                </select>
                <label>Data Source:</label>
                <input type="text" id="chart-data" placeholder="Data source ID...">
                <div class="dialog-actions">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-ok">Create Chart</button>
                </div>
            </div>
        `;
    }

    getImageSelectorHTML() {
        return `
            <div class="dialog-content">
                <h3>Select Image</h3>
                <input type="text" id="img-search" placeholder="Search images...">
                <div id="img-gallery" class="dialog-gallery">
                    <!-- Image gallery will be populated dynamically -->
                </div>
                <div class="dialog-actions">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-ok">Insert</button>
                </div>
            </div>
        `;
    }

    getUserSelectorHTML() {
        return `
            <div class="dialog-content">
                <h3>Select User</h3>
                <input type="text" id="user-search" placeholder="Search users...">
                <div id="user-list" class="dialog-list">
                    <!-- User list will be populated dynamically -->
                </div>
                <div class="dialog-actions">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-ok">Insert</button>
                </div>
            </div>
        `;
    }

    /**
     * Bind dialog events
     */
    bindDialogEvents(dialog, callback) {
        const cancelBtn = dialog.querySelector('.btn-cancel');
        const okBtn = dialog.querySelector('.btn-ok');

        cancelBtn.addEventListener('click', () => {
            dialog.remove();
            callback(null);
        });

        okBtn.addEventListener('click', () => {
            // Extract configuration from dialog
            const config = this.extractDialogConfig(dialog);
            dialog.remove();
            callback(config);
        });

        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dialog.remove();
                callback(null);
            }
        });
    }

    /**
     * Extract configuration from dialog
     */
    extractDialogConfig(dialog) {
        // Implementation depends on dialog type
        // This is a simplified example
        return {
            identifier: 'example-id',
            parameters: {}
        };
    }
}

// Export for use
window.MarkdownExtensionIntegration = MarkdownExtensionIntegration;

// Auto-initialize if markdown editor is available
document.addEventListener('DOMContentLoaded', function() {
    if (window.markdownEditor) {
        window.shortcutIntegration = new MarkdownExtensionIntegration(window.markdownEditor);
    }
});