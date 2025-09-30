/**
 * WYSIWYG Markdown Editor - Obsidian-style rich text editing
 * Features: ContentEditable interface, markdown conversion, toolbar formatting
 */

class WYSIWYGEditor {
    constructor() {
        this.wysiwygEditor = null;
        this.sourceEditor = null;
        this.isSourceMode = false;
        this.currentDocument = {
            id: null,
            name: 'untitled.md',
            content: '',
            lastSaved: null,
            isDirty: false
        };
        this.autoSaveTimer = null;
        this.autoSaveDelay = 3000; // Default delay when not editing (increased for performance)
        this.editingDelay = 8000; // Longer delay while actively editing (increased for performance)
        this.pauseTimer = null; // Timer to detect when editing has paused
        this.pauseDelay = 2000; // Time to wait before considering editing paused (increased)
        this.isActivelyEditing = false;
        this.autoSaveEnabled = true;
        this.linkAutoComplete = {
            isActive: false,
            startPos: 0,
            textNode: null,
            suggestions: []
        };
        this.cursorPosition = {
            saved: false,
            node: null,
            offset: 0,
            xpath: null
        };
        this.markdownTooltip = {
            element: null,
            timeout: null,
            isVisible: false,
            enabled: true
        };
        this.markdownEditing = {
            isActive: false,
            element: null,
            originalText: '',
            shortcuts: ['#', '*', '**', '`', '>', '-', '1.', '[', '![']
        };
        this.autoConversion = {
            enabled: false, // Disabled by default
            manualTrigger: false
        };
        this.sqlAgent = null;
        this.shortcuts = new Map();
        this.toolbarButtons = new Map();
        this.externalLinksEnabled = true;
        
        // Performance optimization: throttle expensive operations
        this.throttledUpdateStats = this.throttle(() => this.updateStats(), 300);
        this.throttledMarkdownShortcuts = this.throttle((e) => this.handleMarkdownShortcuts(e), 100);
    }

    /**
     * Throttle function to limit how often a function can be called
     */
    throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        }
    }

    /**
     * Initialize the WYSIWYG editor
     */
    async init() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.setupToolbarButtons();
            this.initializeAutoSave();
            this.initializeMenuFunctionality();
            await this.initializeDatabaseConnection();
            await this.loadDocuments();
            
            console.log('WYSIWYG Editor initialized successfully');
            this.updateStats();
            this.updateStatus('Ready');
            this.initializeExplorerState();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize WYSIWYG Editor:', error);
            this.updateStatus('Initialization failed', 'error');
            return false;
        }
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.wysiwygEditor = document.getElementById('wysiwyg-editor');
        this.sourceEditor = document.getElementById('markdown-source-editor');
        this.wordCount = document.getElementById('word-count-display');
        this.charCount = document.getElementById('char-count-display');
        this.cursorPosition = document.getElementById('cursor-position');
        this.documentPath = document.getElementById('document-path');
        this.autoSaveStatus = document.getElementById('auto-save-status');
        this.viewMode = document.getElementById('view-mode');
        this.fileTree = document.getElementById('file-tree');
        
        if (!this.wysiwygEditor) {
            throw new Error('WYSIWYG editor element not found');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // WYSIWYG editor events
        this.wysiwygEditor.addEventListener('input', (e) => this.handleWYSIWYGInput(e));
        this.wysiwygEditor.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.wysiwygEditor.addEventListener('paste', (e) => this.handlePaste(e));
        this.wysiwygEditor.addEventListener('focus', () => this.updateCursorPosition());
        this.wysiwygEditor.addEventListener('blur', () => this.updateCursorPosition());
        this.wysiwygEditor.addEventListener('click', (e) => this.handleLinkClick(e));
        this.wysiwygEditor.addEventListener('mouseover', (e) => this.handleMouseOver(e));
        this.wysiwygEditor.addEventListener('mouseout', (e) => this.handleMouseOut(e));
        this.wysiwygEditor.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Add cursor position tracking for markdown editing
        this.wysiwygEditor.addEventListener('keyup', (e) => this.handleCursorPosition(e));
        this.wysiwygEditor.addEventListener('click', (e) => this.handleCursorPosition(e));
        
        // Source editor events
        this.sourceEditor.addEventListener('input', (e) => this.handleSourceInput(e));
        
        // Selection change events
        document.addEventListener('selectionchange', () => this.handleSelectionChange());
        
        // Window events
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        
        // Menu toggle
        document.getElementById('menu-toggle')?.addEventListener('click', () => this.toggleMenu());
        
        // Explorer pin/unpin
        document.getElementById('explorer-toggle')?.addEventListener('click', (e) => {
            console.log('Explorer toggle button clicked');
            e.stopPropagation();
            this.toggleExplorerPinFixed();
        });
        
        // External link button
        document.getElementById('external-link-btn')?.addEventListener('click', () => this.toggleExternalLinks());
        
        // File explorer events
        this.setupFileExplorerEvents();
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        // Bold
        this.shortcuts.set('ctrl+b', () => this.formatText('bold'));
        this.shortcuts.set('cmd+b', () => this.formatText('bold'));
        
        // Italic
        this.shortcuts.set('ctrl+i', () => this.formatText('italic'));
        this.shortcuts.set('cmd+i', () => this.formatText('italic'));
        
        // Link
        this.shortcuts.set('ctrl+k', () => this.insertLink());
        this.shortcuts.set('cmd+k', () => this.insertLink());
        
        // Save
        this.shortcuts.set('ctrl+s', (e) => { e.preventDefault(); this.saveDocument(); });
        this.shortcuts.set('cmd+s', (e) => { e.preventDefault(); this.saveDocument(); });
        
        // Source toggle
        this.shortcuts.set('ctrl+shift+m', () => this.toggleSourceMode());
        this.shortcuts.set('cmd+shift+m', () => this.toggleSourceMode());
    }

    /**
     * Setup toolbar buttons
     */
    setupToolbarButtons() {
        // Text formatting
        this.setupToolbarButton('bold-btn', () => this.formatText('bold'));
        this.setupToolbarButton('italic-btn', () => this.formatText('italic'));
        this.setupToolbarButton('strikethrough-btn', () => this.formatText('strikethrough'));
        this.setupToolbarButton('code-btn', () => this.formatText('code'));
        
        // Headings
        this.setupToolbarButton('h1-btn', () => this.formatHeading(1));
        this.setupToolbarButton('h2-btn', () => this.formatHeading(2));
        this.setupToolbarButton('h3-btn', () => this.formatHeading(3));
        this.setupToolbarButton('quote-btn', () => this.formatText('blockquote'));
        
        // Lists
        this.setupToolbarButton('ul-btn', () => this.formatList('ul'));
        this.setupToolbarButton('ol-btn', () => this.formatList('ol'));
        this.setupToolbarButton('checklist-btn', () => this.insertChecklistItem());
        
        // Insertions
        this.setupToolbarButton('link-btn', () => this.insertLink());
        this.setupToolbarButton('image-btn', () => this.insertImage());
        this.setupToolbarButton('table-btn', () => this.insertTable());
        this.setupToolbarButton('codeblock-btn', () => this.insertCodeBlock());
        
        // View controls
        this.setupToolbarButton('source-btn', () => this.toggleSourceMode());
        this.setupToolbarButton('fullscreen-btn', () => this.toggleFullscreen());
    }

    /**
     * Setup individual toolbar button
     */
    setupToolbarButton(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                handler();
                this.wysiwygEditor.focus();
            });
            this.toolbarButtons.set(buttonId, button);
        }
    }

    /**
     * Handle WYSIWYG input
     */
    handleWYSIWYGInput(e) {
        this.markDocumentDirty();
        this.handleEditingState();
        
        // Throttle expensive operations for better performance
        this.throttledUpdateStats();
        
        // Handle special markdown-like input patterns (throttled)
        this.throttledMarkdownShortcuts(e);
    }

    /**
     * Handle source input
     */
    handleSourceInput(e) {
        this.markDocumentDirty();
        this.handleEditingState();
        this.updateStats();
    }

    /**
     * Handle markdown shortcuts (like typing ## for headings)
     */
    handleMarkdownShortcuts(e) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        
        if (textNode.nodeType !== Node.TEXT_NODE) return;
        
        const textContent = textNode.textContent;
        const cursorPosition = range.startOffset;
        
        // Always handle link auto-completion as it's part of the link creation workflow
        this.handleLinkAutoCompletion(textNode, textContent, cursorPosition);
        
        // Only auto-convert markdown if enabled
        if (this.autoConversion.enabled || this.autoConversion.manualTrigger) {
            // Check for heading shortcuts
            const lineStart = textContent.lastIndexOf('\n', cursorPosition - 1) + 1;
            const lineText = textContent.substring(lineStart, cursorPosition);
            
            if (lineText.match(/^#{1,6}\s$/)) {
                const level = lineText.trim().length;
                this.convertToHeading(level, textNode, lineStart, cursorPosition);
            }
            
            // Reset manual trigger
            this.autoConversion.manualTrigger = false;
        }
    }

    /**
     * Handle markdown link auto-completion
     */
    handleLinkAutoCompletion(textNode, textContent, cursorPosition) {
        const charBeforeCursor = textContent.charAt(cursorPosition - 1);
        
        // Detect start of link syntax
        if (charBeforeCursor === '[') {
            this.startLinkAutoCompletion(textNode, cursorPosition - 1);
        }
        // Detect end of link text
        else if (charBeforeCursor === ']' && this.linkAutoComplete.isActive) {
            this.completeLinkText(textNode, cursorPosition);
        }
        // Detect end of link URL
        else if (charBeforeCursor === ')' && this.linkAutoComplete.isActive) {
            this.finalizeLinkCompletion();
        }
        // Cancel if user moves away from link
        else if (this.linkAutoComplete.isActive && !this.isWithinLinkSyntax(textContent, cursorPosition)) {
            this.cancelLinkAutoCompletion();
        }
    }
    
    /**
     * Start link auto-completion when [ is typed
     */
    startLinkAutoCompletion(textNode, startPos) {
        this.linkAutoComplete = {
            isActive: true,
            startPos: startPos,
            textNode: textNode,
            phase: 'text' // 'text' or 'url'
        };
        
        this.showLinkTooltip('Type link text, then press ] to continue...');
    }
    
    /**
     * Complete the link text part and start URL input
     */
    completeLinkText(textNode, cursorPosition) {
        // Insert the opening parenthesis for URL
        const range = document.createRange();
        range.setStart(textNode, cursorPosition);
        range.setEnd(textNode, cursorPosition);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Insert ()
        document.execCommand('insertText', false, '()');
        
        // Move cursor inside parentheses
        const newRange = document.createRange();
        newRange.setStart(textNode, cursorPosition + 1);
        newRange.setEnd(textNode, cursorPosition + 1);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        this.linkAutoComplete.phase = 'url';
        this.showLinkTooltip('Type or paste URL, then press ) to complete...');
    }
    
    /**
     * Finalize link completion and convert to HTML link
     */
    finalizeLinkCompletion() {
        const textNode = this.linkAutoComplete.textNode;
        const startPos = this.linkAutoComplete.startPos;
        const textContent = textNode.textContent;
        
        // Find the complete link syntax
        const linkMatch = textContent.substring(startPos).match(/^\[([^\]]*)\]\(([^\)]*)\)/);
        
        if (linkMatch) {
            const [fullMatch, linkText, linkUrl] = linkMatch;
            const endPos = startPos + fullMatch.length;
            
            // Create the HTML link element
            const link = document.createElement('a');
            link.href = linkUrl || '#';
            link.textContent = linkText || 'Link';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            
            // Replace the markdown syntax with HTML link
            const range = document.createRange();
            range.setStart(textNode, startPos);
            range.setEnd(textNode, endPos);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            range.deleteContents();
            range.insertNode(link);
            
            // Position cursor after the link
            const newRange = document.createRange();
            newRange.setStartAfter(link);
            newRange.setEndAfter(link);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
        
        this.cancelLinkAutoCompletion();
        this.markDocumentDirty();
        this.handleEditingState();
    }
    
    /**
     * Check if cursor is within link syntax
     */
    isWithinLinkSyntax(textContent, cursorPosition) {
        const beforeCursor = textContent.substring(0, cursorPosition);
        const afterCursor = textContent.substring(cursorPosition);
        
        // Check if we're within [text](url) pattern
        const openBracket = beforeCursor.lastIndexOf('[');
        const closeBracket = beforeCursor.lastIndexOf(']');
        const openParen = beforeCursor.lastIndexOf('(');
        const closeParen = afterCursor.indexOf(')');
        
        return openBracket > closeBracket && (closeParen !== -1 || openParen > closeBracket);
    }
    
    /**
     * Show link completion tooltip
     */
    showLinkTooltip(message) {
        this.updateStatus(message, 'info');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (this.linkAutoComplete.isActive) {
                this.updateStatus('Ready', 'success');
            }
        }, 3000);
    }
    
    /**
     * Cancel link auto-completion
     */
    /**
     * Quick insert link with Ctrl+K
     */
    async quickInsertLink() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Try to get URL from clipboard
        let clipboardUrl = '';
        try {
            clipboardUrl = await navigator.clipboard.readText();
            // Validate if clipboard contains a URL
            if (!this.isValidUrl(clipboardUrl)) {
                clipboardUrl = '';
            }
        } catch (error) {
            // Clipboard access denied, continue without it
        }
        
        if (selectedText) {
            // Text is selected, just add link syntax around it
            const linkUrl = clipboardUrl || prompt('Enter URL:', 'https://');
            if (linkUrl) {
                this.wrapSelectionWithLink(selectedText, linkUrl);
            }
        } else {
            // No text selected, insert complete link syntax
            const linkText = prompt('Enter link text:', 'Link');
            if (linkText) {
                const linkUrl = clipboardUrl || prompt('Enter URL:', 'https://');
                if (linkUrl) {
                    this.insertLinkAtCursor(linkText, linkUrl);
                }
            }
        }
    }
    
    /**
     * Wrap selection with link
     */
    wrapSelectionWithLink(text, url) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = text;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(link);
            
            // Position cursor after the link
            const newRange = document.createRange();
            newRange.setStartAfter(link);
            newRange.setEndAfter(link);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
        
        this.markDocumentDirty();
        this.handleEditingState();
    }
    
    /**
     * Insert link at cursor position
     */
    insertLinkAtCursor(text, url) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = text;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(link);
            
            // Position cursor after the link
            const newRange = document.createRange();
            newRange.setStartAfter(link);
            newRange.setEndAfter(link);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
        
        this.markDocumentDirty();
        this.handleEditingState();
    }
    
    /**
     * Validate if string is a valid URL
     */
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'ftp:';
        } catch (_) {
            return false;
        }
    }
    
    /**
     * Save current cursor position
     */
    saveCursorPosition() {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            this.cursorPosition.saved = false;
            return;
        }
        
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;
        
        // Create XPath to the node for reliable restoration
        const xpath = this.getXPathForNode(startContainer);
        
        this.cursorPosition = {
            saved: true,
            node: startContainer,
            offset: startOffset,
            xpath: xpath,
            isCollapsed: range.collapsed,
            endContainer: range.endContainer,
            endOffset: range.endOffset
        };
        
        console.log('📍 Cursor position saved for auto-save');
    }
    
    /**
     * Restore previously saved cursor position
     */
    restoreCursorPosition() {
        if (!this.cursorPosition.saved) return;
        
        try {
            let targetNode = this.cursorPosition.node;
            
            // If the original node reference is invalid, try to find it by XPath
            if (!targetNode || !document.contains(targetNode)) {
                targetNode = this.getNodeByXPath(this.cursorPosition.xpath);
            }
            
            if (targetNode) {
                const range = document.createRange();
                const selection = window.getSelection();
                
                // Ensure offset doesn't exceed node length
                const maxOffset = targetNode.nodeType === Node.TEXT_NODE 
                    ? targetNode.textContent.length 
                    : targetNode.childNodes.length;
                
                const safeOffset = Math.min(this.cursorPosition.offset, maxOffset);
                
                range.setStart(targetNode, safeOffset);
                
                if (this.cursorPosition.isCollapsed) {
                    range.setEnd(targetNode, safeOffset);
                } else {
                    // Handle selection range
                    let endNode = this.cursorPosition.endContainer;
                    if (!endNode || !document.contains(endNode)) {
                        endNode = targetNode;
                    }
                    const endMaxOffset = endNode.nodeType === Node.TEXT_NODE 
                        ? endNode.textContent.length 
                        : endNode.childNodes.length;
                    const safeEndOffset = Math.min(this.cursorPosition.endOffset, endMaxOffset);
                    range.setEnd(endNode, safeEndOffset);
                }
                
                selection.removeAllRanges();
                selection.addRange(range);
                
                console.log('✅ Cursor position restored after auto-save');
            } else {
                console.warn('Could not restore cursor position - target node not found');
            }
        } catch (error) {
            console.warn('Error restoring cursor position:', error);
        }
        
        // Clear saved position
        this.cursorPosition.saved = false;
    }
    
    /**
     * Generate XPath for a node
     */
    getXPathForNode(node) {
        if (!node) return null;
        
        const parts = [];
        let currentNode = node;
        
        while (currentNode && currentNode !== this.wysiwygEditor) {
            let index = 0;
            let sibling = currentNode.previousSibling;
            
            while (sibling) {
                if (sibling.nodeType === currentNode.nodeType && 
                    sibling.nodeName === currentNode.nodeName) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }
            
            const tagName = currentNode.nodeType === Node.TEXT_NODE 
                ? 'text()' 
                : currentNode.nodeName.toLowerCase();
            
            parts.unshift(`${tagName}[${index + 1}]`);
            currentNode = currentNode.parentNode;
        }
        
        return parts.join('/');
    }
    
    /**
     * Get node by XPath
     */
    getNodeByXPath(xpath) {
        if (!xpath) return null;
        
        try {
            const parts = xpath.split('/');
            let currentNode = this.wysiwygEditor;
            
            for (const part of parts) {
                if (!part) continue;
                
                const match = part.match(/^(.+)\[(\d+)\]$/);
                if (!match) continue;
                
                const [, tagName, indexStr] = match;
                const index = parseInt(indexStr) - 1;
                
                if (tagName === 'text()') {
                    // Find text node
                    const textNodes = Array.from(currentNode.childNodes)
                        .filter(n => n.nodeType === Node.TEXT_NODE);
                    currentNode = textNodes[index];
                } else {
                    // Find element node
                    const elements = Array.from(currentNode.childNodes)
                        .filter(n => n.nodeType === Node.ELEMENT_NODE && 
                                   n.nodeName.toLowerCase() === tagName);
                    currentNode = elements[index];
                }
                
                if (!currentNode) break;
            }
            
            return currentNode;
        } catch (error) {
            console.warn('Error parsing XPath:', error);
            return null;
        }
    }
    
    /**
     * Toggle markdown tooltips on/off
     */
    toggleMarkdownTooltips() {
        this.markdownTooltip.enabled = !this.markdownTooltip.enabled;
        
        if (!this.markdownTooltip.enabled) {
            // Hide any currently visible tooltip
            this.hideMarkdownTooltip();
            this.updateStatus('📝 Markdown tooltips disabled', 'info');
        } else {
            this.updateStatus('📝 Markdown tooltips enabled - hover over elements to see markdown', 'info');
        }
        
        // Auto-hide status message
        setTimeout(() => {
            this.updateStatus('Ready', 'success');
        }, 3000);
    }
    
    /**
     * Handle mouse over for markdown tooltips
     */
    handleMouseOver(e) {
        // Don't show tooltips if disabled or while actively editing
        if (!this.markdownTooltip.enabled || this.isActivelyEditing) return;
        
        const target = e.target;
        
        // Skip if hovering over the editor container itself
        if (target === this.wysiwygEditor) return;
        
        // Skip if hovering over plain text nodes or whitespace
        if (this.isPlainTextOrWhitespace(target)) return;
        
        // Skip if hovering over paragraph with only text content (no formatting)
        if (target.tagName === 'P' && this.isPlainParagraph(target)) return;
        
        // Clear any existing timeout
        if (this.markdownTooltip.timeout) {
            clearTimeout(this.markdownTooltip.timeout);
        }
        
        // Set delay before showing tooltip
        this.markdownTooltip.timeout = setTimeout(() => {
            this.showMarkdownTooltip(target, e);
        }, 500); // 500ms delay
    }
    
    /**
     * Handle mouse out to hide tooltips
     */
    handleMouseOut(e) {
        // Clear timeout
        if (this.markdownTooltip.timeout) {
            clearTimeout(this.markdownTooltip.timeout);
            this.markdownTooltip.timeout = null;
        }
        
        // Hide tooltip after short delay
        setTimeout(() => {
            this.hideMarkdownTooltip();
        }, 200);
    }
    
    /**
     * Handle mouse move to update tooltip position
     */
    handleMouseMove(e) {
        if (this.markdownTooltip.isVisible && this.markdownTooltip.element) {
            this.updateTooltipPosition(e);
        }
    }
    
    /**
     * Show markdown tooltip for an element
     */
    showMarkdownTooltip(element, mouseEvent) {
        // Don't show if already visible or if we're editing
        if (this.markdownTooltip.isVisible || this.isActivelyEditing) return;
        
        const markdown = this.getMarkdownForElement(element);
        if (!markdown || markdown.trim() === '') return;
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'markdown-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">Markdown:</div>
            <code class="tooltip-content">${this.escapeHtml(markdown)}</code>
        `;
        
        // Position tooltip
        document.body.appendChild(tooltip);
        this.updateTooltipPosition(mouseEvent, tooltip);
        
        // Store reference
        this.markdownTooltip.element = tooltip;
        this.markdownTooltip.isVisible = true;
        
        // Add fade in animation
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
    }
    
    /**
     * Hide markdown tooltip
     */
    hideMarkdownTooltip() {
        if (!this.markdownTooltip.isVisible || !this.markdownTooltip.element) return;
        
        const tooltip = this.markdownTooltip.element;
        tooltip.classList.remove('visible');
        
        setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
            this.markdownTooltip.element = null;
            this.markdownTooltip.isVisible = false;
        }, 200);
    }
    
    /**
     * Update tooltip position based on mouse coordinates
     */
    updateTooltipPosition(mouseEvent, tooltip = null) {
        const tooltipElement = tooltip || this.markdownTooltip.element;
        if (!tooltipElement) return;
        
        const x = mouseEvent.clientX;
        const y = mouseEvent.clientY;
        const offset = 15;
        
        // Get tooltip dimensions
        const rect = tooltipElement.getBoundingClientRect();
        const tooltipWidth = rect.width;
        const tooltipHeight = rect.height;
        
        // Calculate position (try to keep tooltip in viewport)
        let left = x + offset;
        let top = y + offset;
        
        // Adjust if tooltip would go off screen
        if (left + tooltipWidth > window.innerWidth) {
            left = x - tooltipWidth - offset;
        }
        if (top + tooltipHeight > window.innerHeight) {
            top = y - tooltipHeight - offset;
        }
        
        // Ensure tooltip doesn't go off the left or top edge
        left = Math.max(10, left);
        top = Math.max(10, top);
        
        tooltipElement.style.left = left + 'px';
        tooltipElement.style.top = top + 'px';
    }
    
    /**
     * Get markdown representation for a specific element
     */
    getMarkdownForElement(element) {
        // Clone element to avoid modifying original
        const clone = element.cloneNode(true);
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(clone);
        
        // Convert to markdown using existing converter
        const markdown = this.htmlToMarkdown(tempContainer.innerHTML).trim();
        const tagName = element.tagName.toLowerCase();
        const description = this.getElementDescription(tagName);
        
        return { markdown, description };
    }
    
    /**
     * Get description for element type
     */
    getElementDescription(tagName) {
        const descriptions = {
            'h1': 'Heading 1',
            'h2': 'Heading 2', 
            'h3': 'Heading 3',
            'h4': 'Heading 4',
            'h5': 'Heading 5',
            'h6': 'Heading 6',
            'p': 'Paragraph',
            'strong': 'Bold text',
            'b': 'Bold text',
            'em': 'Italic text',
            'i': 'Italic text',
            'code': 'Code',
            'a': 'Link',
            'blockquote': 'Blockquote',
            'li': 'List item',
            'ul': 'Unordered list',
            'ol': 'Ordered list'
        };
        
        return descriptions[tagName] || `${tagName.toUpperCase()} element`;
    }
    
    /**
     * Check if element is plain text or whitespace
     */
    isPlainTextOrWhitespace(element) {
        // If it's a text node
        if (element.nodeType === Node.TEXT_NODE) {
            return true;
        }
        
        // If it's whitespace or empty
        if (!element.textContent || element.textContent.trim() === '') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if paragraph contains only plain text (no formatting)
     */
    isPlainParagraph(element) {
        if (element.tagName !== 'P') return false;
        
        // Check if paragraph contains only text nodes or BR elements
        const children = Array.from(element.childNodes);
        return children.every(child => 
            child.nodeType === Node.TEXT_NODE || 
            child.tagName === 'BR'
        );
    }
    
    /**
     * Handle cursor position for markdown editing detection
     */
    handleCursorPosition(e) {
        if (!this.markdownTooltip.enabled) return;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const textContent = this.getTextAroundCursor(range);
        
        this.checkForMarkdownShortcuts(textContent, range, e);
    }
    
    /**
     * Get text around cursor position
     */
    getTextAroundCursor(range) {
        const textNode = range.startContainer;
        if (textNode.nodeType !== Node.TEXT_NODE) return '';
        
        const text = textNode.textContent;
        const cursorPos = range.startOffset;
        
        // Get text before cursor (up to 10 characters)
        const beforeCursor = text.substring(Math.max(0, cursorPos - 10), cursorPos);
        // Get text after cursor (up to 5 characters)
        const afterCursor = text.substring(cursorPos, Math.min(text.length, cursorPos + 5));
        
        return {
            before: beforeCursor,
            after: afterCursor,
            cursorPos: cursorPos,
            fullText: text
        };
    }
    
    /**
     * Check for markdown shortcuts near cursor
     */
    checkForMarkdownShortcuts(textContent, range, mouseEvent) {
        if (!textContent.before) return;
        
        const shortcuts = this.markdownEditing.shortcuts;
        let foundShortcut = null;
        
        // Check if cursor is right after a markdown shortcut
        for (const shortcut of shortcuts) {
            if (textContent.before.endsWith(shortcut)) {
                foundShortcut = shortcut;
                break;
            }
            // Also check if cursor is within the shortcut
            if (textContent.before.includes(shortcut) && 
                textContent.before.length - textContent.before.lastIndexOf(shortcut) <= shortcut.length + 2) {
                foundShortcut = shortcut;
                break;
            }
        }
        
        if (foundShortcut) {
            this.showMarkdownEditingHint(foundShortcut, range, mouseEvent);
        } else {
            this.hideMarkdownEditingHint();
        }
    }
    
    /**
     * Show markdown editing hint
     */
    showMarkdownEditingHint(shortcut, range, mouseEvent) {
        if (this.markdownTooltip.isVisible) return;
        
        const hint = this.getMarkdownHint(shortcut);
        if (!hint) return;
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'markdown-tooltip editing-hint';
        tooltip.innerHTML = `
            <div class="tooltip-header">Markdown Shortcut:</div>
            <code class="tooltip-content">${this.escapeHtml(hint)}</code>
        `;
        
        // Position tooltip near cursor
        document.body.appendChild(tooltip);
        this.positionTooltipNearCursor(range, tooltip);
        
        // Store reference
        this.markdownTooltip.element = tooltip;
        this.markdownTooltip.isVisible = true;
        
        // Add fade in animation
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
        
        // Auto-hide after a few seconds
        setTimeout(() => {
            this.hideMarkdownEditingHint();
        }, 3000);
    }
    
    /**
     * Hide markdown editing hint
     */
    hideMarkdownEditingHint() {
        if (this.markdownTooltip.isVisible && 
            this.markdownTooltip.element && 
            this.markdownTooltip.element.classList.contains('editing-hint')) {
            this.hideMarkdownTooltip();
        }
    }
    
    /**
     * Get markdown hint for shortcut
     */
    getMarkdownHint(shortcut) {
        const hints = {
            '#': '# Heading 1',
            '##': '## Heading 2',
            '###': '### Heading 3',
            '*': '*italic* or **bold**',
            '**': '**bold text**',
            '`': '`inline code`',
            '>': '> blockquote',
            '-': '- list item',
            '1.': '1. numbered item',
            '[': '[link text](url)',
            '![': '![alt text](image-url)'
        };
        
        return hints[shortcut] || null;
    }
    
    /**
     * Position tooltip near cursor
     */
    positionTooltipNearCursor(range, tooltip) {
        try {
            const rect = range.getBoundingClientRect();
            const x = rect.left;
            const y = rect.bottom + 5; // Position below cursor
            
            // Get tooltip dimensions
            const tooltipRect = tooltip.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width;
            const tooltipHeight = tooltipRect.height;
            
            // Calculate position (try to keep tooltip in viewport)
            let left = x;
            let top = y;
            
            // Adjust if tooltip would go off screen
            if (left + tooltipWidth > window.innerWidth) {
                left = window.innerWidth - tooltipWidth - 10;
            }
            if (top + tooltipHeight > window.innerHeight) {
                top = rect.top - tooltipHeight - 5; // Position above cursor
            }
            
            // Ensure tooltip doesn't go off the left or top edge
            left = Math.max(10, left);
            top = Math.max(10, top);
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        } catch (error) {
            // Fallback positioning
            tooltip.style.left = '50px';
            tooltip.style.top = '50px';
        }
    }
    
    /**
     * Toggle automatic markdown conversion
     */
    toggleAutoConversion() {
        this.autoConversion.enabled = !this.autoConversion.enabled;
        
        // Update visual indicator
        this.updateConversionModeIndicator();
        
        if (this.autoConversion.enabled) {
            this.updateStatus('🔄 Auto-conversion enabled - markdown converts as you type', 'info');
        } else {
            this.updateStatus('⏸️ Auto-conversion disabled - use Ctrl+Enter to convert manually', 'info');
        }
        
        // Auto-hide status message
        setTimeout(() => {
            this.updateStatus('Ready', 'success');
        }, 4000);
    }
    
    /**
     * Update the conversion mode indicator
     */
    updateConversionModeIndicator() {
        // Use the global function from index.html if available
        if (window.updateConversionMode) {
            window.updateConversionMode(this.autoConversion.enabled);
            return;
        }
        
        // Fallback: Find or create the conversion mode indicator
        let indicator = document.getElementById('conversion-mode-indicator');
        if (!indicator) {
            indicator = document.createElement('span');
            indicator.id = 'conversion-mode-indicator';
            indicator.className = 'conversion-mode-indicator';
            
            // Add to status bar
            const statusBar = document.querySelector('.status-bar .status-right');
            if (statusBar) {
                statusBar.appendChild(indicator);
            }
        }
        
        if (this.autoConversion.enabled) {
            indicator.textContent = 'AUTO';
            indicator.className = 'conversion-mode-indicator auto';
            indicator.title = 'Auto-conversion enabled - markdown converts as you type';
        } else {
            indicator.textContent = 'MANUAL';
            indicator.className = 'conversion-mode-indicator';
            indicator.title = 'Manual conversion - use Ctrl+Enter to convert markdown';
        }
    }
    
    /**
     * Manually trigger markdown conversion for current line or selection
     */
    manualConvertMarkdown() {
        // Set manual trigger flag
        this.autoConversion.manualTrigger = true;
        
        // Get current selection
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        
        // Trigger markdown shortcuts processing
        this.handleMarkdownShortcuts({ target: this.wysiwygEditor });
        
        // Also trigger a broader conversion for the current paragraph
        this.convertCurrentParagraph(range);
        
        this.updateStatus('✨ Markdown converted', 'success');
    }
    
    /**
     * Convert markdown in current paragraph
     */
    convertCurrentParagraph(range) {
        const startContainer = range.startContainer;
        let paragraph = startContainer;
        
        // Find the containing paragraph
        while (paragraph && paragraph.tagName !== 'P' && paragraph !== this.wysiwygEditor) {
            paragraph = paragraph.parentElement;
        }
        
        if (paragraph && paragraph.tagName === 'P') {
            const text = paragraph.textContent;
            
            // Check for various markdown patterns and convert them
            this.convertMarkdownPatterns(paragraph, text);
        }
    }
    
    /**
     * Convert markdown patterns in a paragraph
     */
    convertMarkdownPatterns(paragraph, text) {
        let converted = false;
        
        // Convert **bold** text
        if (text.includes('**')) {
            const boldRegex = /\*\*([^*]+)\*\*/g;
            if (boldRegex.test(text)) {
                paragraph.innerHTML = paragraph.innerHTML.replace(boldRegex, '<strong>$1</strong>');
                converted = true;
            }
        }
        
        // Convert *italic* text
        if (text.includes('*') && !text.includes('**')) {
            const italicRegex = /\*([^*]+)\*/g;
            if (italicRegex.test(text)) {
                paragraph.innerHTML = paragraph.innerHTML.replace(italicRegex, '<em>$1</em>');
                converted = true;
            }
        }
        
        // Convert `code` text
        if (text.includes('`') && !text.includes('```')) {
            const codeRegex = /`([^`]+)`/g;
            if (codeRegex.test(text)) {
                paragraph.innerHTML = paragraph.innerHTML.replace(codeRegex, '<code>$1</code>');
                converted = true;
            }
        }
        
        if (converted) {
            this.markDocumentDirty();
            this.handleEditingState();
        }
    }
    
    /**
     * Escape HTML for safe display in tooltips
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    cancelLinkAutoCompletion() {
        this.linkAutoComplete = {
            isActive: false,
            startPos: 0,
            textNode: null,
            suggestions: []
        };
    }
    
    /**
     * Convert text to heading
     */
    convertToHeading(level, textNode, lineStart, cursorPosition) {
        const range = document.createRange();
        range.setStart(textNode, lineStart);
        range.setEnd(textNode, cursorPosition);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Remove the markdown syntax
        range.deleteContents();
        
        // Apply heading format
        document.execCommand('formatBlock', false, `h${level}`);
    }

    /**
     * Format selected text
     */
    formatText(format) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        switch (format) {
            case 'bold':
                document.execCommand('bold', false, null);
                break;
            case 'italic':
                document.execCommand('italic', false, null);
                break;
            case 'strikethrough':
                document.execCommand('strikeThrough', false, null);
                break;
            case 'code':
                this.wrapSelection('<code>', '</code>');
                break;
            case 'blockquote':
                document.execCommand('formatBlock', false, 'blockquote');
                break;
        }
        
        this.markDocumentDirty();
        this.scheduleAutoSave();
    }

    /**
     * Format as heading
     */
    formatHeading(level) {
        document.execCommand('formatBlock', false, `h${level}`);
        this.markDocumentDirty();
        this.scheduleAutoSave();
    }

    /**
     * Format as list
     */
    formatList(listType) {
        if (listType === 'ul') {
            document.execCommand('insertUnorderedList', false, null);
        } else if (listType === 'ol') {
            document.execCommand('insertOrderedList', false, null);
        }
        this.markDocumentDirty();
        this.scheduleAutoSave();
    }

    /**
     * Insert link
     */
    insertLink() {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        const url = prompt('Enter URL:', 'https://');
        if (url) {
            const linkText = selectedText || prompt('Enter link text:', 'Link');
            if (linkText) {
                const link = document.createElement('a');
                link.href = url;
                link.textContent = linkText;
                
                if (selectedText) {
                    // Replace selection
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(link);
                } else {
                    // Insert at cursor
                    document.execCommand('insertHTML', false, link.outerHTML);
                }
                
                this.markDocumentDirty();
                this.scheduleAutoSave();
            }
        }
    }

    /**
     * Insert image
     */
    insertImage() {
        const url = prompt('Enter image URL:', 'https://');
        if (url) {
            const alt = prompt('Enter alt text:', 'Image');
            const img = document.createElement('img');
            img.src = url;
            img.alt = alt;
            img.style.maxWidth = '100%';
            
            document.execCommand('insertHTML', false, img.outerHTML);
            this.markDocumentDirty();
            this.scheduleAutoSave();
        }
    }

    /**
     * Insert table
     */
    insertTable() {
        const rows = parseInt(prompt('Number of rows:', '3')) || 3;
        const cols = parseInt(prompt('Number of columns:', '3')) || 3;
        
        let tableHTML = '<table><thead><tr>';
        for (let i = 0; i < cols; i++) {
            tableHTML += '<th>Header</th>';
        }
        tableHTML += '</tr></thead><tbody>';
        
        for (let i = 0; i < rows - 1; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHTML += '<td>Cell</td>';
            }
            tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody></table>';
        
        document.execCommand('insertHTML', false, tableHTML);
        this.markDocumentDirty();
        this.scheduleAutoSave();
    }

    /**
     * Insert code block
     */
    insertCodeBlock() {
        const language = prompt('Programming language (optional):', '');
        const codeHTML = `<pre><code class="language-${language}">${language ? `// ${language} code` : 'Code here'}</code></pre>`;
        
        document.execCommand('insertHTML', false, codeHTML);
        this.markDocumentDirty();
        this.scheduleAutoSave();
    }

    /**
     * Insert checklist item
     */
    insertChecklistItem() {
        const checkboxHTML = '<p>☐ <span contenteditable="true">Task item</span></p>';
        document.execCommand('insertHTML', false, checkboxHTML);
        this.markDocumentDirty();
        this.scheduleAutoSave();
    }

    /**
     * Toggle between WYSIWYG and source mode
     */
    toggleSourceMode() {
        if (this.isSourceMode) {
            // Switch to WYSIWYG mode
            const markdownContent = this.sourceEditor.value;
            this.wysiwygEditor.innerHTML = this.markdownToHTML(markdownContent);
            this.wysiwygEditor.classList.remove('hidden');
            this.sourceEditor.classList.add('hidden');
            this.viewMode.textContent = 'WYSIWYG Mode';
            this.isSourceMode = false;
        } else {
            // Switch to source mode
            const htmlContent = this.wysiwygEditor.innerHTML;
            this.sourceEditor.value = this.htmlToMarkdown(htmlContent);
            this.wysiwygEditor.classList.add('hidden');
            this.sourceEditor.classList.remove('hidden');
            this.viewMode.textContent = 'Source Mode';
            this.isSourceMode = true;
            this.sourceEditor.focus();
        }
        
        // Update toolbar button state
        const sourceBtn = this.toolbarButtons.get('source-btn');
        if (sourceBtn) {
            sourceBtn.classList.toggle('active', this.isSourceMode);
        }
    }

    /**
     * Convert HTML to Markdown (improved)
     */
    htmlToMarkdown(html) {
        // Create a temporary div to work with DOM
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        return this.convertElementToMarkdown(tempDiv).trim();
    }
    
    /**
     * Recursively convert DOM elements to markdown
     */
    convertElementToMarkdown(element) {
        let markdown = '';
        
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                markdown += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                const textContent = node.textContent || '';
                
                switch (tagName) {
                    case 'h1':
                        markdown += `# ${textContent}\n\n`;
                        break;
                    case 'h2':
                        markdown += `## ${textContent}\n\n`;
                        break;
                    case 'h3':
                        markdown += `### ${textContent}\n\n`;
                        break;
                    case 'h4':
                        markdown += `#### ${textContent}\n\n`;
                        break;
                    case 'h5':
                        markdown += `##### ${textContent}\n\n`;
                        break;
                    case 'h6':
                        markdown += `###### ${textContent}\n\n`;
                        break;
                    case 'p':
                        const pContent = this.convertElementToMarkdown(node);
                        if (pContent.trim()) {
                            markdown += `${pContent}\n\n`;
                        }
                        break;
                    case 'strong':
                    case 'b':
                        markdown += `**${textContent}**`;
                        break;
                    case 'em':
                    case 'i':
                        markdown += `*${textContent}*`;
                        break;
                    case 'code':
                        markdown += `\`${textContent}\``;
                        break;
                    case 'pre':
                        const codeElement = node.querySelector('code');
                        const codeContent = codeElement ? codeElement.textContent : textContent;
                        markdown += `\`\`\`\n${codeContent}\n\`\`\`\n\n`;
                        break;
                    case 'blockquote':
                        const quoteContent = this.convertElementToMarkdown(node);
                        markdown += `> ${quoteContent.replace(/\n/g, '\n> ')}\n\n`;
                        break;
                    case 'ul':
                        for (const li of node.querySelectorAll('li')) {
                            markdown += `- ${li.textContent}\n`;
                        }
                        markdown += '\n';
                        break;
                    case 'ol':
                        const listItems = node.querySelectorAll('li');
                        listItems.forEach((li, index) => {
                            markdown += `${index + 1}. ${li.textContent}\n`;
                        });
                        markdown += '\n';
                        break;
                    case 'a':
                        const href = node.getAttribute('href') || '';
                        const linkText = textContent || href;
                        markdown += `[${linkText}](${href})`;
                        break;
                    case 'img':
                        const src = node.getAttribute('src') || '';
                        const alt = node.getAttribute('alt') || '';
                        markdown += `![${alt}](${src})`;
                        break;
                    case 'hr':
                        markdown += '---\n\n';
                        break;
                    case 'br':
                        markdown += '\n';
                        break;
                    default:
                        // For other elements, just get their text content
                        markdown += this.convertElementToMarkdown(node);
                        break;
                }
            }
        }
        
        return markdown;
    }

    /**
     * Convert Markdown to HTML (improved)
     */
    markdownToHTML(markdown) {
        let html = markdown
            // Code blocks (handle first to avoid conflicts)
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
            .replace(/```\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Headings
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            // Horizontal rules
            .replace(/^---$/gim, '<hr>')
            // Blockquotes
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            // Lists - unordered
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            // Lists - ordered
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            // Bold and italic (handle nested)
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Strikethrough
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            // Images
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Convert line breaks to paragraphs
            .split('\n\n')
            .map(paragraph => {
                paragraph = paragraph.trim();
                if (!paragraph) return '';
                
                // Skip if already wrapped in block elements
                if (paragraph.match(/^<(h[1-6]|blockquote|pre|hr|ul|ol)/)) {
                    return paragraph;
                }
                
                // Handle lists
                if (paragraph.includes('<li>')) {
                    if (paragraph.match(/^\d+\./m)) {
                        return `<ol>${paragraph}</ol>`;
                    } else {
                        return `<ul>${paragraph}</ul>`;
                    }
                }
                
                // Wrap in paragraph tags
                return `<p>${paragraph}</p>`;
            })
            .join('\n');
            
        return html;
    }

    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        const modifier = e.ctrlKey || e.metaKey ? (e.ctrlKey ? 'ctrl+' : 'cmd+') : '';
        const shiftModifier = e.shiftKey ? 'shift+' : '';
        const fullKey = modifier + shiftModifier + key;
        
        if (this.shortcuts.has(fullKey)) {
            e.preventDefault();
            this.shortcuts.get(fullKey)(e);
        }
        
        // Handle Enter key for list continuation
        if (e.key === 'Enter' && !e.shiftKey) {
            this.handleEnterKey(e);
        }
    }

    /**
     * Handle Enter key for smart list continuation
     */
    handleEnterKey(e) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const currentElement = range.startContainer.parentElement;
        
        // Continue lists
        if (currentElement.tagName === 'LI') {
            // Let default behavior handle list continuation
            return;
        }
    }

    /**
     * Handle paste events
     */
    handlePaste(e) {
        e.preventDefault();
        
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        
        // Clean the pasted content
        const cleanedPaste = paste
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
        
        // Insert as plain text and let the editor handle formatting
        document.execCommand('insertText', false, cleanedPaste);
        
        this.markDocumentDirty();
        this.scheduleAutoSave();
    }

    /**
     * Handle link clicks to open in browser
     */
    handleLinkClick(e) {
        if (e.target.tagName === 'A' && e.target.href && this.externalLinksEnabled) {
            e.preventDefault();
            
            // Update address bar
            if (this.documentPath) {
                this.documentPath.value = e.target.href;
            }
            
            // Open link in new tab/window
            window.open(e.target.href, '_blank', 'noopener,noreferrer');
            
            // Show notification
            this.updateStatus(`Opening: ${e.target.href}`, 'info');
            
            // Reset status after 3 seconds
            setTimeout(() => {
                this.updateStatus('Ready', 'success');
                if (this.documentPath) {
                    this.documentPath.value = this.currentDocument.name;
                }
            }, 3000);
        }
    }

    /**
     * Handle selection change for toolbar updates
     */
    handleSelectionChange() {
        this.updateToolbarState();
        this.updateCursorPosition();
    }

    /**
     * Update toolbar button states based on current selection
     */
    updateToolbarState() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        // Check formatting at cursor position
        const range = selection.getRangeAt(0);
        const element = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentNode
            : range.commonAncestorContainer;
        
        // Update button states
        this.updateButtonState('bold-btn', document.queryCommandState('bold'));
        this.updateButtonState('italic-btn', document.queryCommandState('italic'));
        this.updateButtonState('strikethrough-btn', document.queryCommandState('strikeThrough'));
    }

    /**
     * Update individual button state
     */
    updateButtonState(buttonId, isActive) {
        const button = this.toolbarButtons.get(buttonId);
        if (button) {
            button.classList.toggle('active', isActive);
        }
    }

    /**
     * Wrap selection with HTML tags
     */
    wrapSelection(startTag, endTag) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const selectedContent = range.extractContents();
        
        const wrapper = document.createElement('span');
        wrapper.innerHTML = startTag;
        wrapper.appendChild(selectedContent);
        wrapper.innerHTML += endTag;
        
        range.insertNode(wrapper);
        
        // Restore selection
        const newRange = document.createRange();
        newRange.selectNodeContents(wrapper);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }

    /**
     * Initialize auto-save functionality
     */
    initializeAutoSave() {
        // Initialize auto-save status display
        this.updateAutoSaveStatus('⚡ Auto-save ON');
        
        // Initialize conversion mode indicator
        this.updateConversionModeIndicator();
        
        // Show helpful tips on first load
        setTimeout(() => {
            this.updateStatus('💡 Tip: Type [ to start link creation, or use Ctrl+K for quick links', 'info');
        }, 2000);
        
        setTimeout(() => {
            this.updateStatus('🔍 Tip: Auto-conversion disabled. Use Ctrl+Enter to convert markdown, Ctrl+Shift+C to toggle', 'info');
        }, 8000);
        
        setTimeout(() => {
            this.updateStatus('💡 Tip: Hover over formatted elements to see markdown, type shortcuts like # for hints', 'info');
        }, 14000);
        
        // Add keyboard shortcut to toggle auto-save
        this.shortcuts.set('ctrl+alt+s', (e) => { 
            e.preventDefault(); 
            this.toggleAutoSave(); 
        });
        this.shortcuts.set('cmd+alt+s', (e) => { 
            e.preventDefault(); 
            this.toggleAutoSave(); 
        });
        
        // Add keyboard shortcuts for quick link creation
        this.shortcuts.set('ctrl+k', (e) => { 
            e.preventDefault(); 
            this.quickInsertLink(); 
        });
        this.shortcuts.set('cmd+k', (e) => { 
            e.preventDefault(); 
            this.quickInsertLink(); 
        });
        
        // Add keyboard shortcut to toggle markdown tooltips
        this.shortcuts.set('ctrl+shift+m', (e) => { 
            e.preventDefault(); 
            this.toggleMarkdownTooltips(); 
        });
        this.shortcuts.set('cmd+shift+m', (e) => { 
            e.preventDefault(); 
            this.toggleMarkdownTooltips(); 
        });
        
        // Add keyboard shortcuts for markdown conversion control
        this.shortcuts.set('ctrl+shift+c', (e) => { 
            e.preventDefault(); 
            this.toggleAutoConversion(); 
        });
        this.shortcuts.set('cmd+shift+c', (e) => { 
            e.preventDefault(); 
            this.toggleAutoConversion(); 
        });
        
        // Add keyboard shortcut for manual markdown conversion
        this.shortcuts.set('ctrl+enter', (e) => { 
            e.preventDefault(); 
            this.manualConvertMarkdown(); 
        });
        this.shortcuts.set('cmd+enter', (e) => { 
            e.preventDefault(); 
            this.manualConvertMarkdown(); 
        });
    }

    /**
     * Handle editing state and schedule auto-save appropriately
     */
    handleEditingState() {
        if (!this.autoSaveEnabled) return;
        
        // Mark as actively editing
        this.isActivelyEditing = true;
        this.updateAutoSaveStatusDisplay(true);
        
        // Clear existing timers
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        if (this.pauseTimer) {
            clearTimeout(this.pauseTimer);
        }
        
        // Set timer to detect when editing has paused
        this.pauseTimer = setTimeout(() => {
            this.isActivelyEditing = false;
            this.scheduleAutoSave();
            this.updateAutoSaveStatusDisplay(false);
        }, this.pauseDelay);
        
        // Schedule auto-save with longer delay while editing
        this.autoSaveTimer = setTimeout(() => {
            if (this.currentDocument.isDirty) {
                // Save cursor position before auto-save during editing
                this.saveCursorPosition();
                this.saveDocument();
            }
        }, this.editingDelay);
    }
    
    /**
     * Update auto-save status display
     */
    updateAutoSaveStatusDisplay(isPaused) {
        // Use global function if available
        if (window.updateAutoSaveStatus) {
            window.updateAutoSaveStatus(isPaused);
            return;
        }
        
        // Fallback to direct update
        this.updateAutoSaveStatus(isPaused ? '⏸️ Auto-save paused (editing...)' : '⚡ Auto-save ON');
    }
    
    /**
     * Schedule auto-save (used when not actively editing)
     */
    scheduleAutoSave() {
        if (!this.autoSaveEnabled) return;
        
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            if (this.currentDocument.isDirty) {
                this.saveDocument();
            }
        }, this.autoSaveDelay);
    }

    /**
     * Update auto-save status display
     */
    updateAutoSaveStatus(message) {
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
            syncStatus.textContent = message;
        }
    }
    
    /**
     * Toggle auto-save on/off
     */
    toggleAutoSave() {
        this.autoSaveEnabled = !this.autoSaveEnabled;
        
        if (this.autoSaveEnabled) {
            this.updateAutoSaveStatus('⚡ Auto-save ON');
            if (this.currentDocument.isDirty && !this.isActivelyEditing) {
                this.scheduleAutoSave();
            }
        } else {
            this.updateAutoSaveStatus('⏹️ Auto-save OFF');
            if (this.autoSaveTimer) {
                clearTimeout(this.autoSaveTimer);
            }
            if (this.pauseTimer) {
                clearTimeout(this.pauseTimer);
            }
        }
    }
    
    /**
     * Mark document as dirty
     */
    markDocumentDirty() {
        this.currentDocument.isDirty = true;
        this.updateStatus('Unsaved changes', 'warning');
    }

    /**
     * Save document
     */
    async saveDocument() {
        try {
            // Save cursor position before any DOM modifications
            this.saveCursorPosition();
            
            const content = this.isSourceMode 
                ? this.sourceEditor.value 
                : this.htmlToMarkdown(this.wysiwygEditor.innerHTML);
            
            this.currentDocument.content = content;
            this.currentDocument.lastSaved = new Date().toISOString();
            this.currentDocument.isDirty = false;
            
            // Save to database or localStorage
            if (this.sqlAgent) {
                await this.sqlAgent.saveDocument(this.currentDocument);
            } else {
                localStorage.setItem('markdown-editor-content', content);
                localStorage.setItem('markdown-editor-last-saved', this.currentDocument.lastSaved);
            }
            
            // Refresh WYSIWYG display to show updated markdown formatting
            await this.refreshWYSIWYGDisplay();
            
            this.updateStatus('Saved', 'success');
            
            // Update auto-save status
            if (this.autoSaveEnabled) {
                if (this.isActivelyEditing) {
                    this.updateAutoSaveStatus('⏸️ Auto-save paused (editing...)');
                } else {
                    this.updateAutoSaveStatus('⚡ Auto-save ON');
                }
            }
            
            // Update last saved time display
            const lastSavedElement = document.getElementById('last-saved');
            if (lastSavedElement) {
                lastSavedElement.textContent = 'Saved just now';
            }
            
            // Restore cursor position after DOM modifications
            setTimeout(() => {
                this.restoreCursorPosition();
            }, 10); // Small delay to ensure DOM is fully updated
            
            console.log('Document saved successfully');
            
        } catch (error) {
            console.error('Error saving document:', error);
            this.updateStatus('Save failed', 'error');
        }
    }

    /**
     * Refresh WYSIWYG display to sync with saved markdown
     */
    async refreshWYSIWYGDisplay() {
        if (this.isSourceMode) {
            // In source mode, no need to refresh WYSIWYG
            return;
        }
        
        try {
            // Save cursor position before refresh (if not already saved)
            if (!this.cursorPosition.saved) {
                this.saveCursorPosition();
            }
            
            // Convert current HTML to markdown and back to ensure consistency
            const currentMarkdown = this.htmlToMarkdown(this.wysiwygEditor.innerHTML);
            const refreshedHTML = this.markdownToHTML(currentMarkdown);
            
            // Only update if content actually changed
            if (this.wysiwygEditor.innerHTML !== refreshedHTML) {
                this.wysiwygEditor.innerHTML = refreshedHTML;
                
                console.log('WYSIWYG display refreshed after save');
                
                // Cursor position will be restored by the calling saveDocument method
            }
            
        } catch (error) {
            console.warn('Could not refresh WYSIWYG display:', error);
        }
    }
    
    /**
     * Restore cursor position after refresh
     */
    /**
     * Update statistics
     */
    updateStats() {
        const content = this.isSourceMode 
            ? this.sourceEditor.value 
            : this.wysiwygEditor.textContent || '';
        
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        
        if (this.wordCount) this.wordCount.textContent = `${words} words`;
        if (this.charCount) this.charCount.textContent = `${chars} characters`;
    }

    /**
     * Update cursor position
     */
    updateCursorPosition() {
        if (!this.cursorPosition) return;
        
        try {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                // Simplified position calculation
                this.cursorPosition.textContent = 'Cursor position updated';
            }
        } catch (error) {
            // Ignore cursor position errors
        }
    }

    /**
     * Update status
     */
    updateStatus(message, type = 'info') {
        if (this.autoSaveStatus) {
            this.autoSaveStatus.textContent = message;
            this.autoSaveStatus.className = `save-status ${type}`;
        }
    }

    /**
     * Initialize database connection (placeholder)
     */
    async initializeDatabaseConnection() {
        // This would connect to the SQL agent
        console.log('Database connection initialized');
    }

    /**
     * Load documents (placeholder)
     */
    async loadDocuments() {
        // Load from localStorage for now
        const savedContent = localStorage.getItem('markdown-editor-content');
        if (savedContent) {
            this.wysiwygEditor.innerHTML = this.markdownToHTML(savedContent);
            this.currentDocument.content = savedContent;
        }
    }

    /**
     * Initialize explorer state
     */
    initializeExplorerState() {
        const fileExplorer = document.getElementById('file-explorer');
        const toggleBtn = document.getElementById('explorer-toggle');
        
        if (fileExplorer && toggleBtn) {
            // Start with collapsed state (not pinned)
            fileExplorer.classList.add('collapsed');
            fileExplorer.classList.remove('pinned');
            
            // Set initial button state
            toggleBtn.textContent = '📌';
            toggleBtn.title = 'Pin Explorer (stay open)';
            
            console.log('Explorer initialized in collapsed state');
        }
    }

    /**
     * Setup file explorer events (placeholder)
     */
    setupFileExplorerEvents() {
        // File explorer functionality
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload(e) {
        if (this.currentDocument.isDirty) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        const container = document.querySelector('.wysiwyg-editor-container');
        if (container) {
            container.classList.toggle('fullscreen');
        }
    }

    /**
     * Initialize menu functionality
     */
    initializeMenuFunctionality() {
        console.log('Initializing menu functionality...');

        
        // File menu handlers
        const fileMenu = document.getElementById('file-menu');
        const newFileBtn = document.getElementById('new-file');
        const openFileBtn = document.getElementById('open-file');
        const saveFileBtn = document.getElementById('save-file');
        const exportFileBtn = document.getElementById('export-file');
        
        // Edit menu handlers
        const editMenu = document.getElementById('edit-menu');
        const undoBtn = document.getElementById('undo');
        const redoBtn = document.getElementById('redo');
        const cutBtn = document.getElementById('cut');
        const copyBtn = document.getElementById('copy');
        const pasteBtn = document.getElementById('paste');
        
        // View menu handlers
        const viewMenu = document.getElementById('view-menu');
        const togglePreviewBtn = document.getElementById('toggle-preview');
        const toggleMenuBtn = document.getElementById('toggle-menu');
        const toggleExplorerBtn = document.getElementById('toggle-explorer');
        
        // File menu actions
        console.log('New file button found:', !!newFileBtn);
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => {
                console.log('New File clicked!');
                this.newFile();
                this.closeDropdowns();
            });
        }
        
        if (openFileBtn) {
            openFileBtn.addEventListener('click', () => {
                this.openFile();
                this.closeDropdowns();
            });
        }
        
        if (saveFileBtn) {
            saveFileBtn.addEventListener('click', () => {
                this.saveDocument();
                this.closeDropdowns();
            });
        }
        
        if (exportFileBtn) {
            exportFileBtn.addEventListener('click', () => {
                this.exportFile();
                this.closeDropdowns();
            });
        }
        
        // Edit menu actions
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                document.execCommand('undo');
                this.closeDropdowns();
            });
        }
        
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                document.execCommand('redo');
                this.closeDropdowns();
            });
        }
        
        if (cutBtn) {
            cutBtn.addEventListener('click', () => {
                document.execCommand('cut');
                this.closeDropdowns();
            });
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                document.execCommand('copy');
                this.closeDropdowns();
            });
        }
        
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => {
                document.execCommand('paste');
                this.closeDropdowns();
            });
        }
        
        // View menu actions
        if (togglePreviewBtn) {
            togglePreviewBtn.addEventListener('click', () => {
                this.togglePreview();
                this.closeDropdowns();
            });
        }
        
        if (toggleMenuBtn) {
            toggleMenuBtn.addEventListener('click', () => {
                this.toggleMenu();
                this.closeDropdowns();
            });
        }
        
        if (toggleExplorerBtn) {
            toggleExplorerBtn.addEventListener('click', () => {
                this.toggleExplorerPin();
                this.closeDropdowns();
            });
        }
        
        // Dropdown toggle functionality - DISABLED to prevent conflicts with debug-menu.js
        // this.initializeDropdowns();
        
        // Menu bar hover enhancement
        this.enhanceMenuHover();
    }
    
    /**
     * Initialize dropdown menus
     */
    initializeDropdowns() {
        console.log('🔧 Initializing dropdowns...');
        const navBtns = document.querySelectorAll('.nav-btn');
        console.log('🔧 Found nav buttons:', navBtns.length);
        
        navBtns.forEach((btn, index) => {
            console.log(`🔧 Setting up dropdown for button ${index}:`, btn.id);
            btn.addEventListener('click', (e) => {
                console.log('🔧 Dropdown button clicked:', btn.id);
                e.stopPropagation();
                const dropdown = btn.nextElementSibling;
                console.log('🔧 Found dropdown:', dropdown?.id, dropdown?.classList.contains('dropdown'));
                if (dropdown && dropdown.classList.contains('dropdown')) {
                    // Close other dropdowns
                    this.closeDropdowns(dropdown);
                    
                    // Toggle current dropdown
                    dropdown.classList.toggle('show');
                    console.log('🔧 Dropdown toggled, has show class:', dropdown.classList.contains('show'));
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeDropdowns();
        });
    }
    
    /**
     * Close all dropdown menus
     */
    closeDropdowns(except = null) {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            if (dropdown !== except) {
                dropdown.classList.remove('show');
            }
        });
    }
    
    /**
     * Enhance menu hover behavior
     */
    enhanceMenuHover() {
        const menuBar = document.getElementById('menu-bar');
        if (menuBar) {
            let hoverTimeout;
            
            menuBar.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                menuBar.classList.add('hover');
            });
            
            menuBar.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    menuBar.classList.remove('hover');
                    this.closeDropdowns();
                }, 300);
            });
        }
    }
    
    /**
     * New file action
     */
    newFile() {
        if (this.isDirty && this.currentFile) {
            if (confirm('You have unsaved changes. Create new file anyway?')) {
                this.wysiwygEditor.innerHTML = '<p><br></p>';
                this.currentFile = null;
                this.isDirty = false;
                this.updateStatus('New file created', 'success');
            }
        } else {
            this.wysiwygEditor.innerHTML = '<p><br></p>';
            this.currentFile = null;
            this.isDirty = false;
            this.updateStatus('New file created', 'success');
        }
    }
    
    /**
     * Open file action
     */
    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const content = await file.text();
                    this.wysiwygEditor.innerHTML = this.convertMarkdownToHtml(content);
                    this.currentFile = file.name;
                    this.isDirty = false;
                    this.updateStatus(`Opened: ${file.name}`, 'success');
                } catch (error) {
                    this.updateStatus('Failed to open file', 'error');
                }
            }
        };
        
        input.click();
    }
    
    /**
     * Export file action
     */
    exportFile() {
        const content = this.getMarkdownContent();
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile || 'document.md';
        a.click();
        
        URL.revokeObjectURL(url);
        this.updateStatus('File exported', 'success');
    }
    
    /**
     * Toggle preview mode
     */
    togglePreview() {
        // This would toggle between edit and preview modes
        this.updateStatus('Preview mode toggled', 'info');
    }
    
    /**
     * Convert markdown to HTML for display
     */
    convertMarkdownToHtml(markdown) {
        // Basic markdown to HTML conversion
        let html = markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            .replace(/\n/gim, '<br>');
        
        return `<p>${html}</p>`;
    }
    
    /**
     * Toggle menu visibility
     */
    toggleMenu() {
        const menuBar = document.getElementById('menu-bar');
        if (menuBar) {
            menuBar.classList.toggle('collapsed');
        }
    }

    /**
     * Toggle file explorer pin state
     */
    toggleExplorerPin() {
        const fileExplorer = document.getElementById('file-explorer');
        if (fileExplorer) {
            const wasPinned = fileExplorer.classList.contains('pinned');
            
            if (wasPinned) {
                // Unpin: remove pinned class
                fileExplorer.classList.remove('pinned');
                fileExplorer.classList.add('collapsed');
            } else {
                // Pin: add pinned class and remove collapsed
                fileExplorer.classList.add('pinned');
                fileExplorer.classList.remove('collapsed');
            }
            
            const toggleBtn = document.getElementById('explorer-toggle');
            if (toggleBtn) {
                const isPinned = fileExplorer.classList.contains('pinned');
                toggleBtn.textContent = isPinned ? '�' : '�';
                toggleBtn.title = isPinned ? 'Unpin Explorer (auto-collapse)' : 'Pin Explorer (stay open)';
            }
            
            // Update status
            const isPinned = fileExplorer.classList.contains('pinned');
            this.updateStatus(
                isPinned ? 'Explorer pinned open' : 'Explorer auto-collapse enabled', 
                'info'
            );
            
            console.log('Explorer pin toggled:', isPinned ? 'pinned' : 'unpinned');
        }
    }

    /**
     * Toggle file explorer pin state - FIXED VERSION
     */
    toggleExplorerPinFixed() {
        const fileExplorer = document.getElementById('file-explorer');
        const toggleBtn = document.getElementById('explorer-toggle');
        
        if (fileExplorer && toggleBtn) {
            const wasPinned = fileExplorer.classList.contains('pinned');
            
            console.log('Pin toggle - Current state:', wasPinned ? 'pinned' : 'unpinned');
            
            if (wasPinned) {
                // Unpin: remove pinned class
                fileExplorer.classList.remove('pinned');
                fileExplorer.classList.add('collapsed');
                
                toggleBtn.textContent = '📌';
                toggleBtn.title = 'Pin Explorer (stay open)';
                
                this.updateStatus('Explorer auto-collapse enabled', 'info');
                console.log('Explorer unpinned');
            } else {
                // Pin: add pinned class
                fileExplorer.classList.add('pinned');
                
                toggleBtn.textContent = '📍';  
                toggleBtn.title = 'Unpin Explorer (auto-collapse)';
                
                this.updateStatus('Explorer pinned open', 'info');
                console.log('Explorer pinned');
            }
            
            console.log('Classes after:', fileExplorer.className);
        }
    }

    /**
     * Toggle external link handling
     */
    toggleExternalLinks() {
        this.externalLinksEnabled = !this.externalLinksEnabled;
        const btn = document.getElementById('external-link-btn');
        if (btn) {
            btn.style.background = this.externalLinksEnabled ? '#667eea' : 'none';
            btn.style.color = this.externalLinksEnabled ? 'white' : '#333';
            btn.title = this.externalLinksEnabled ? 'External links enabled' : 'External links disabled';
        }
        
        this.updateStatus(
            this.externalLinksEnabled ? 'External links enabled' : 'External links disabled', 
            'info'
        );
    }
}

// Initialize the WYSIWYG editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const editor = new WYSIWYGEditor();
    
    // Expose the editor instance globally for testing and external access
    window.WYSIWYGEditor = editor;
    
    editor.init().catch(console.error);
});