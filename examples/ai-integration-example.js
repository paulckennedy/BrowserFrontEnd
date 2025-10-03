/**
 * AI Integration Example for WYSIWYG Editor
 * Demonstrates how to integrate AI agent communication with the editor
 */

class EditorAIIntegration {
    constructor(editorElement, aiCommunicator) {
        this.editor = editorElement;
        this.ai = aiCommunicator;
        this.isProcessing = false;
        
        this.initializeUI();
        this.bindEvents();
    }

    /**
     * Initialize AI-related UI elements
     */
    initializeUI() {
        // Create AI toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'ai-toolbar';
        toolbar.innerHTML = `
            <div class="ai-tools">
                <button class="ai-btn" data-action="grammar_check" title="Check Grammar">
                    <span class="icon">✓</span> Grammar
                </button>
                <button class="ai-btn" data-action="style_suggestion" title="Style Suggestions">
                    <span class="icon">✨</span> Style
                </button>
                <button class="ai-btn" data-action="summarize" title="Summarize">
                    <span class="icon">📋</span> Summary
                </button>
                <button class="ai-btn" data-action="translate" title="Translate">
                    <span class="icon">🌐</span> Translate
                </button>
                <div class="ai-status">
                    <span class="status-indicator"></span>
                    <span class="status-text">Ready</span>
                </div>
            </div>
        `;

        // Insert toolbar before editor
        this.editor.parentNode.insertBefore(toolbar, this.editor);
        this.toolbar = toolbar;

        // Create suggestions panel
        const suggestionsPanel = document.createElement('div');
        suggestionsPanel.className = 'ai-suggestions-panel hidden';
        suggestionsPanel.innerHTML = `
            <div class="suggestions-header">
                <h3>AI Suggestions</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="suggestions-content"></div>
        `;

        this.editor.parentNode.appendChild(suggestionsPanel);
        this.suggestionsPanel = suggestionsPanel;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // AI toolbar buttons
        this.toolbar.addEventListener('click', (e) => {
            const button = e.target.closest('.ai-btn');
            if (button && !this.isProcessing) {
                const action = button.dataset.action;
                this.handleAIAction(action);
            }
        });

        // Close suggestions panel
        this.suggestionsPanel.querySelector('.close-btn').addEventListener('click', () => {
            this.hideSuggestions();
        });

        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'g':
                        e.preventDefault();
                        this.handleAIAction('grammar_check');
                        break;
                    case 't':
                        e.preventDefault();
                        this.handleAIAction('translate');
                        break;
                }
            }
        });
    }

    /**
     * Handle AI action requests
     */
    async handleAIAction(action) {
        const selectedText = this.getSelectedText();
        const content = selectedText || this.editor.textContent;

        if (!content.trim()) {
            this.showMessage('No content to process', 'warning');
            return;
        }

        try {
            this.setProcessingState(true);
            const selection = selectedText ? this.getSelectionRange() : null;
            
            let result;
            switch (action) {
                case 'grammar_check':
                    result = await this.ai.checkGrammar(content, { selection });
                    break;
                case 'style_suggestion':
                    result = await this.ai.getSuggestions(content, { selection });
                    break;
                case 'summarize':
                    result = await this.ai.summarize(content, { selection });
                    break;
                case 'translate':
                    const targetLang = await this.promptForLanguage();
                    if (targetLang) {
                        result = await this.ai.translate(content, targetLang, { selection });
                    }
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            if (result) {
                this.displayResults(result, action);
            }

        } catch (error) {
            this.showMessage(`AI processing failed: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * Get selected text from editor
     */
    getSelectedText() {
        const selection = window.getSelection();
        return selection.toString();
    }

    /**
     * Get selection range
     */
    getSelectionRange() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        const textContent = this.editor.textContent;
        
        // Calculate character positions
        const walker = document.createTreeWalker(
            this.editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let start = 0;
        let node;
        
        while (node = walker.nextNode()) {
            if (node === range.startContainer) {
                start += range.startOffset;
                break;
            }
            start += node.textContent.length;
        }

        const end = start + selection.toString().length;
        return { start, end };
    }

    /**
     * Display AI processing results
     */
    displayResults(result, action) {
        const contentDiv = this.suggestionsPanel.querySelector('.suggestions-content');
        
        let html = '';
        
        if (result.content && action !== 'style_suggestion' && action !== 'grammar_check') {
            html += `
                <div class="result-section">
                    <h4>Result</h4>
                    <div class="result-content">${this.escapeHtml(result.content)}</div>
                    <button class="apply-btn" onclick="this.applyContent('${result.content}')">Apply</button>
                </div>
            `;
        }

        if (result.suggestions && result.suggestions.length > 0) {
            html += `
                <div class="suggestions-section">
                    <h4>Suggestions</h4>
                    <div class="suggestions-list">
            `;

            result.suggestions.forEach((suggestion, index) => {
                const confidence = Math.round(suggestion.confidence * 100);
                html += `
                    <div class="suggestion-item" data-index="${index}">
                        <div class="suggestion-header">
                            <span class="confidence">${confidence}%</span>
                            <span class="type">${suggestion.type}</span>
                        </div>
                        <div class="suggestion-change">
                            <span class="original">${this.escapeHtml(suggestion.original)}</span>
                            <span class="arrow">→</span>
                            <span class="suggested">${this.escapeHtml(suggestion.suggested)}</span>
                        </div>
                        <div class="suggestion-reason">${this.escapeHtml(suggestion.reason)}</div>
                        <button class="apply-suggestion-btn" data-index="${index}">Apply</button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        if (result.metadata) {
            html += `
                <div class="metadata-section">
                    <small>
                        Processing time: ${result.metadata.processingTime}s | 
                        Model: ${result.metadata.model} | 
                        Confidence: ${Math.round(result.metadata.confidence * 100)}%
                    </small>
                </div>
            `;
        }

        contentDiv.innerHTML = html;
        this.showSuggestions();

        // Bind apply buttons
        this.bindApplyButtons(result);
    }

    /**
     * Bind apply button events
     */
    bindApplyButtons(result) {
        const applyButtons = this.suggestionsPanel.querySelectorAll('.apply-suggestion-btn');
        applyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const suggestion = result.suggestions[index];
                this.applySuggestion(suggestion);
            });
        });
    }

    /**
     * Apply a suggestion to the editor
     */
    applySuggestion(suggestion) {
        const content = this.editor.textContent;
        const before = content.substring(0, suggestion.position.start);
        const after = content.substring(suggestion.position.end);
        const newContent = before + suggestion.suggested + after;
        
        this.editor.textContent = newContent;
        this.showMessage('Suggestion applied', 'success');
    }

    /**
     * Show/hide processing state
     */
    setProcessingState(processing) {
        this.isProcessing = processing;
        const indicator = this.toolbar.querySelector('.status-indicator');
        const text = this.toolbar.querySelector('.status-text');
        const buttons = this.toolbar.querySelectorAll('.ai-btn');

        if (processing) {
            indicator.className = 'status-indicator processing';
            text.textContent = 'Processing...';
            buttons.forEach(btn => btn.disabled = true);
        } else {
            indicator.className = 'status-indicator ready';
            text.textContent = 'Ready';
            buttons.forEach(btn => btn.disabled = false);
        }
    }

    /**
     * Show suggestions panel
     */
    showSuggestions() {
        this.suggestionsPanel.classList.remove('hidden');
    }

    /**
     * Hide suggestions panel
     */
    hideSuggestions() {
        this.suggestionsPanel.classList.add('hidden');
    }

    /**
     * Show status message
     */
    showMessage(message, type = 'info') {
        // Create temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ${type}`;
        messageEl.textContent = message;
        
        this.toolbar.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    /**
     * Prompt user for target language
     */
    async promptForLanguage() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'language-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Select Target Language</h3>
                    <select class="language-select">
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                    </select>
                    <div class="modal-buttons">
                        <button class="cancel-btn">Cancel</button>
                        <button class="ok-btn">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('.ok-btn').addEventListener('click', () => {
                const selected = modal.querySelector('.language-select').value;
                modal.remove();
                resolve(selected);
            });

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });
        });
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorAIIntegration;
} else if (typeof window !== 'undefined') {
    window.EditorAIIntegration = EditorAIIntegration;
}