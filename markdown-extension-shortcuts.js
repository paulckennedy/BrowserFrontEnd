/**
 * Markdown Extension Shortcuts Implementation
 * 
 * This module provides comprehensive markdown extension shortcuts that integrate
 * with the enhanced document storage schema. It handles parsing, processing,
 * and rendering of various shortcut types with consistent hover identification.
 */

class MarkdownExtensionShortcuts {
    constructor(options = {}) {
        this.options = {
            hoverDelay: options.hoverDelay || 500,
            autoProcess: options.autoProcess !== false,
            previewSize: options.previewSize || 'medium',
            apiEndpoint: options.apiEndpoint || '/api/shortcuts',
            showStatusOverview: options.showStatusOverview !== false,
            enableProgressTracking: options.enableProgressTracking !== false,
            ...options
        };

        // Shortcut detection pattern
        this.SHORTCUT_PATTERN = /@\[([^:]+):([^:\]]+)(?::([^\]]+))?\]/g;
        
        // Initialize processors and event handlers
        this.processors = new Map();
        this.activeShortcuts = new Map();
        this.tooltipElement = null;
        this.statusOverviewPanel = null;
        this.statusCounts = { pending: 0, processing: 0, ready: 0, error: 0 };
        
        this.initializeProcessors();
        this.bindEventHandlers();
        this.initializeStatusOverview();
    }

    /**
     * Initialize shortcut processors for different types
     */
    initializeProcessors() {
        // Document processors
        this.processors.set('doc', new DocumentProcessor());
        this.processors.set('collection', new DocumentCollectionProcessor());
        
        // Resource processors  
        this.processors.set('img', new ImageProcessor());
        this.processors.set('gallery', new GalleryProcessor());
        this.processors.set('chart', new ChartProcessor());
        this.processors.set('table', new TableProcessor());
        this.processors.set('video', new VideoProcessor());
        this.processors.set('audio', new AudioProcessor());
        this.processors.set('pdf', new PDFProcessor());
        
        // AI processors
        this.processors.set('ai', new AIProcessor());
        
        // System processors
        this.processors.set('workflow', new WorkflowProcessor());
        this.processors.set('user', new UserProcessor());
        this.processors.set('metrics', new MetricsProcessor());
    }

    /**
     * Parse markdown content and extract shortcuts
     * @param {string} markdown - The markdown content to parse
     * @returns {Array} Array of shortcut objects
     */
    parseShortcuts(markdown) {
        const shortcuts = [];
        let match;

        while ((match = this.SHORTCUT_PATTERN.exec(markdown)) !== null) {
            const [original, type, identifier, parametersStr] = match;
            
            const shortcut = {
                id: this.generateShortcutId(),
                original,
                type,
                identifier,
                parameters: this.parseParameters(parametersStr),
                index: match.index,
                length: original.length,
                status: 'pending',
                result: null,
                error: null
            };

            shortcuts.push(shortcut);
        }

        return shortcuts;
    }

    /**
     * Parse shortcut parameters string
     * @param {string} parametersStr - Parameters string (key=value|key2=value2)
     * @returns {Object} Parameters object
     */
    parseParameters(parametersStr) {
        if (!parametersStr) return {};
        
        const params = {};
        const pairs = parametersStr.split('|');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value !== undefined) {
                params[key.trim()] = value.trim();
            }
        });
        
        return params;
    }

    /**
     * Process all shortcuts in markdown content
     * @param {string} markdown - The markdown content
     * @param {string} markdownId - The document ID for schema integration
     * @returns {Promise<string>} Processed markdown with rendered shortcuts
     */
    async processMarkdown(markdown, markdownId) {
        const shortcuts = this.parseShortcuts(markdown);
        let processedMarkdown = markdown;
        
        // Process shortcuts in reverse order to maintain indices
        for (let i = shortcuts.length - 1; i >= 0; i--) {
            const shortcut = shortcuts[i];
            
            try {
                // Register shortcut in schema
                await this.registerShortcutInSchema(shortcut, markdownId);
                
                // Process the shortcut
                const processor = this.processors.get(shortcut.type);
                if (processor) {
                    shortcut.status = 'processing';
                    this.updateShortcutDisplay(shortcut);
                    
                    const result = await processor.process(shortcut);
                    shortcut.result = result;
                    shortcut.status = 'ready';
                } else {
                    shortcut.error = `Unknown shortcut type: ${shortcut.type}`;
                    shortcut.status = 'error';
                }
                
                // Replace shortcut with rendered version
                const rendered = this.renderShortcut(shortcut);
                processedMarkdown = processedMarkdown.substring(0, shortcut.index) + 
                                 rendered + 
                                 processedMarkdown.substring(shortcut.index + shortcut.length);
                
                this.activeShortcuts.set(shortcut.id, shortcut);
                
                // Update status counts if this is an AI request
                if (shortcut.type === 'ai') {
                    this.updateStatusCounts();
                }
                
            } catch (error) {
                shortcut.error = error.message;
                shortcut.status = 'error';
                
                const rendered = this.renderShortcut(shortcut);
                processedMarkdown = processedMarkdown.substring(0, shortcut.index) + 
                                 rendered + 
                                 processedMarkdown.substring(shortcut.index + shortcut.length);
            }
        }
        
        return processedMarkdown;
    }

    /**
     * Register shortcut in document schema
     */
    async registerShortcutInSchema(shortcut, markdownId) {
        const shortcutNode = {
            shortcut_id: shortcut.id,
            markdown_id: markdownId,
            shortcut_type: shortcut.type,
            shortcut_content: shortcut.original,
            status: shortcut.status,
            prompt_ref: null,
            result_resource_id: null,
            result_markdown_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Send to backend API
        await fetch(`${this.options.apiEndpoint}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shortcut: shortcutNode })
        });
    }

    /**
     * Render shortcut as HTML element with hover support and progress tracking
     */
    renderShortcut(shortcut) {
        const statusClass = `shortcut-${shortcut.status}`;
        const icon = this.getShortcutIcon(shortcut.type);
        
        let progressAttr = '';
        if (shortcut.status === 'processing' && shortcut.progress) {
            progressAttr = `style="--progress-width: ${shortcut.progress}%"`;
        }
        
        // Add visual indicator for AI requests
        const isAI = shortcut.type === 'ai';
        const aiClass = isAI ? ' ai-request' : '';
        const title = this.getShortcutStatusTitle(shortcut);
        
        return `<span class="shortcut ${statusClass}${aiClass}" 
                      data-shortcut-id="${shortcut.id}"
                      data-shortcut-type="${shortcut.type}"
                      title="${title}"
                      ${progressAttr}>
                    <span class="shortcut-icon">${icon}</span>
                    <span class="shortcut-content">${shortcut.identifier}</span>
                    ${isAI ? this.renderAIStatusIndicator(shortcut) : ''}
                </span>`;
    }
    
    /**
     * Render AI-specific status indicator
     */
    renderAIStatusIndicator(shortcut) {
        const statusIcons = {
            pending: '⏳',
            processing: '🔄',
            ready: '✅',
            error: '❌'
        };
        
        return `<span class="ai-status-indicator">${statusIcons[shortcut.status] || ''}</span>`;
    }
    
    /**
     * Get status title for tooltip
     */
    getShortcutStatusTitle(shortcut) {
        const statusMessages = {
            pending: `AI Request: ${shortcut.identifier} - Waiting to process`,
            processing: `AI Request: ${shortcut.identifier} - Processing... ${shortcut.progress ? shortcut.progress + '%' : ''}`,
            ready: `AI Request: ${shortcut.identifier} - Completed successfully`,
            error: `AI Request: ${shortcut.identifier} - Error: ${shortcut.error || 'Processing failed'}`
        };
        
        return statusMessages[shortcut.status] || `${shortcut.type}: ${shortcut.identifier}`;
    }

    /**
     * Get icon for shortcut type
     */
    getShortcutIcon(type) {
        const icons = {
            doc: '📄',
            collection: '📚',
            img: '🖼️',
            gallery: '🖼️',
            chart: '📊',
            table: '📋',
            video: '🎥',
            audio: '🎵',
            pdf: '📑',
            ai: '🤖',
            workflow: '⚡',
            user: '👤',
            metrics: '📈'
        };
        
        return icons[type] || '📎';
    }

    /**
     * Initialize AI status overview panel
     */
    initializeStatusOverview() {
        if (!this.options.showStatusOverview) return;
        
        this.statusOverviewPanel = document.createElement('div');
        this.statusOverviewPanel.className = 'ai-status-overview';
        this.statusOverviewPanel.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px; color: #495057;">AI Requests Status</div>
            <div class="ai-status-item">
                <span class="ai-status-count ai-status-pending" data-status="pending">0</span>
                <span>⏳ Pending</span>
            </div>
            <div class="ai-status-item">
                <span class="ai-status-count ai-status-processing" data-status="processing">0</span>
                <span>🔄 Processing</span>
            </div>
            <div class="ai-status-item">
                <span class="ai-status-count ai-status-ready" data-status="ready">0</span>
                <span>✅ Ready</span>
            </div>
            <div class="ai-status-item">
                <span class="ai-status-count ai-status-error" data-status="error">0</span>
                <span>❌ Error</span>
            </div>
        `;
        
        document.body.appendChild(this.statusOverviewPanel);
        
        // Add click handler to toggle visibility
        this.statusOverviewPanel.addEventListener('click', () => {
            this.statusOverviewPanel.style.opacity = 
                this.statusOverviewPanel.style.opacity === '0.3' ? '1' : '0.3';
        });
    }

    /**
     * Bind event handlers for hover and click interactions
     */
    bindEventHandlers() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('shortcut')) {
                this.handleShortcutHover(e);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('shortcut')) {
                this.handleShortcutMouseOut(e);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('shortcut')) {
                this.handleShortcutClick(e);
            }
        });
        
        // Add keyboard shortcut to toggle status overview
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                this.toggleStatusOverview();
            }
        });
    }

    /**
     * Handle shortcut hover events
     */
    handleShortcutHover(event) {
        const shortcutId = event.target.dataset.shortcutId;
        const shortcut = this.activeShortcuts.get(shortcutId);
        
        if (!shortcut) return;

        // Clear any existing timeout
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        // Set timeout for hover delay
        this.hoverTimeout = setTimeout(() => {
            this.showTooltip(shortcut, event.target);
        }, this.options.hoverDelay);
    }

    /**
     * Handle shortcut mouse out events
     */
    handleShortcutMouseOut(event) {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }
        
        // Hide tooltip after a short delay
        setTimeout(() => {
            this.hideTooltip();
        }, 100);
    }

    /**
     * Handle shortcut click events
     */
    handleShortcutClick(event) {
        const shortcutId = event.target.dataset.shortcutId;
        const shortcut = this.activeShortcuts.get(shortcutId);
        
        if (!shortcut) return;

        // Handle different click actions based on status
        switch (shortcut.status) {
            case 'ready':
                this.openShortcutResult(shortcut);
                break;
            case 'error':
                this.showErrorDetails(shortcut);
                break;
            case 'processing':
                this.showProcessingStatus(shortcut);
                break;
        }
    }

    /**
     * Show tooltip for shortcut
     */
    showTooltip(shortcut, targetElement) {
        this.hideTooltip(); // Hide any existing tooltip
        
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'shortcut-tooltip';
        this.tooltipElement.innerHTML = this.renderTooltip(shortcut);
        
        document.body.appendChild(this.tooltipElement);
        
        // Position tooltip relative to target element
        const rect = targetElement.getBoundingClientRect();
        this.tooltipElement.style.left = rect.left + 'px';
        this.tooltipElement.style.top = (rect.bottom + 10) + 'px';
        
        // Show tooltip with animation
        requestAnimationFrame(() => {
            this.tooltipElement.classList.add('visible');
        });
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
    }

    /**
     * Render tooltip content
     */
    renderTooltip(shortcut) {
        const icon = this.getShortcutIcon(shortcut.type);
        const title = this.getShortcutTitle(shortcut);
        
        return `
            <div class="tooltip-header">
                <span class="tooltip-icon">${icon}</span>
                <span class="tooltip-title">${title}</span>
                <span class="tooltip-status status-${shortcut.status}">${shortcut.status}</span>
            </div>
            <div class="tooltip-content">
                ${this.renderTooltipContent(shortcut)}
            </div>
            <div class="tooltip-actions">
                ${this.renderTooltipActions(shortcut)}
            </div>
        `;
    }

    /**
     * Generate tooltip content based on shortcut type and status
     */
    renderTooltipContent(shortcut) {
        if (shortcut.status === 'error') {
            return `<div class="error-message">${shortcut.error}</div>`;
        }
        
        if (shortcut.status === 'processing') {
            return `<div class="processing-message">Processing ${shortcut.type} shortcut...</div>`;
        }
        
        if (shortcut.result && shortcut.result.preview) {
            return `<div class="preview">${shortcut.result.preview}</div>`;
        }
        
        return `<div class="description">${shortcut.identifier}</div>`;
    }

    /**
     * Generate tooltip actions
     */
    renderTooltipActions(shortcut) {
        const actions = [];
        
        if (shortcut.status === 'ready') {
            actions.push(`<button onclick="window.shortcutManager.openShortcut('${shortcut.id}')">Open</button>`);
        }
        
        if (shortcut.status === 'error') {
            actions.push(`<button onclick="window.shortcutManager.retryShortcut('${shortcut.id}')">Retry</button>`);
        }
        
        actions.push(`<button onclick="window.shortcutManager.editShortcut('${shortcut.id}')">Edit</button>`);
        actions.push(`<button onclick="window.shortcutManager.deleteShortcut('${shortcut.id}')">Delete</button>`);
        
        return actions.join('');
    }

    /**
     * Get human-readable title for shortcut
     */
    getShortcutTitle(shortcut) {
        const titles = {
            doc: 'Document Reference',
            collection: 'Document Collection',
            img: 'Image',
            gallery: 'Image Gallery',
            chart: 'Chart',
            table: 'Data Table',
            video: 'Video',
            audio: 'Audio',
            pdf: 'PDF Document',
            ai: 'AI Processing',
            workflow: 'Workflow',
            user: 'User Profile',
            metrics: 'Metrics'
        };
        
        return titles[shortcut.type] || 'Extension';
    }

    /**
     * Generate unique shortcut ID
     */
    generateShortcutId() {
        return 'shortcut_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    /**
     * Update shortcut display status with visual enhancements
     */
    updateShortcutDisplay(shortcut) {
        const elements = document.querySelectorAll(`[data-shortcut-id="${shortcut.id}"]`);
        const isAI = shortcut.type === 'ai';
        const aiClass = isAI ? ' ai-request' : '';
        
        elements.forEach(element => {
            const oldStatus = element.className.match(/shortcut-(pending|processing|ready|error)/)?.[1];
            element.className = `shortcut shortcut-${shortcut.status}${aiClass}`;
            element.title = this.getShortcutStatusTitle(shortcut);
            
            // Update progress for processing AI requests
            if (shortcut.status === 'processing' && shortcut.progress) {
                element.style.setProperty('--progress-width', shortcut.progress + '%');
            }
            
            // Update AI status indicator
            const indicator = element.querySelector('.ai-status-indicator');
            if (indicator && isAI) {
                const statusIcons = {
                    pending: '⏳',
                    processing: '🔄',
                    ready: '✅',
                    error: '❌'
                };
                indicator.textContent = statusIcons[shortcut.status] || '';
            }
            
            // Update status counts if status changed
            if (oldStatus && oldStatus !== shortcut.status && isAI) {
                this.updateStatusCounts();
            }
        });
    }
    
    /**
     * Update AI status counts and overview panel
     */
    updateStatusCounts() {
        // Reset counts
        this.statusCounts = { pending: 0, processing: 0, ready: 0, error: 0 };
        
        // Count AI shortcuts by status
        this.activeShortcuts.forEach(shortcut => {
            if (shortcut.type === 'ai' && this.statusCounts.hasOwnProperty(shortcut.status)) {
                this.statusCounts[shortcut.status]++;
            }
        });
        
        // Update overview panel
        this.updateStatusOverviewPanel();
    }
    
    /**
     * Update status overview panel display
     */
    updateStatusOverviewPanel() {
        if (!this.statusOverviewPanel) return;
        
        Object.keys(this.statusCounts).forEach(status => {
            const countElement = this.statusOverviewPanel.querySelector(`[data-status="${status}"]`);
            if (countElement) {
                countElement.textContent = this.statusCounts[status];
            }
        });
        
        // Show/hide panel based on AI request presence
        const hasAIRequests = Object.values(this.statusCounts).some(count => count > 0);
        this.statusOverviewPanel.classList.toggle('visible', hasAIRequests);
    }
    
    /**
     * Toggle status overview panel visibility
     */
    toggleStatusOverview() {
        if (this.statusOverviewPanel) {
            this.statusOverviewPanel.classList.toggle('visible');
        }
    }

    /**
     * Get visual status summary for scanning
     */
    getStatusSummary() {
        this.updateStatusCounts();
        return {
            total: Object.values(this.statusCounts).reduce((a, b) => a + b, 0),
            counts: { ...this.statusCounts },
            hasErrors: this.statusCounts.error > 0,
            hasProcessing: this.statusCounts.processing > 0,
            allComplete: this.statusCounts.pending === 0 && this.statusCounts.processing === 0
        };
    }
    
    /**
     * Highlight all AI requests for visual scanning
     */
    highlightAIRequests(duration = 3000) {
        const aiShortcuts = document.querySelectorAll('.shortcut[data-shortcut-type="ai"]');
        aiShortcuts.forEach(element => {
            element.style.outline = '2px solid #6f42c1';
            element.style.outlineOffset = '2px';
        });
        
        setTimeout(() => {
            aiShortcuts.forEach(element => {
                element.style.outline = '';
                element.style.outlineOffset = '';
            });
        }, duration);
    }
    
    /**
     * Scroll to next AI request with specific status
     */
    scrollToNextAIRequest(status = null) {
        const selector = status 
            ? `.shortcut[data-shortcut-type="ai"].shortcut-${status}`
            : '.shortcut[data-shortcut-type="ai"]';
            
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Briefly highlight the element
            elements[0].style.boxShadow = '0 0 20px rgba(111, 66, 193, 0.8)';
            setTimeout(() => {
                elements[0].style.boxShadow = '';
            }, 2000);
        }
    }

    // Public API methods for tooltip actions
    openShortcut(shortcutId) {
        const shortcut = this.activeShortcuts.get(shortcutId);
        if (shortcut && shortcut.result) {
            this.openShortcutResult(shortcut);
        }
    }

    retryShortcut(shortcutId) {
        const shortcut = this.activeShortcuts.get(shortcutId);
        if (shortcut) {
            // Reset status and reprocess
            shortcut.status = 'pending';
            shortcut.error = null;
            this.processShortcut(shortcut);
        }
    }

    editShortcut(shortcutId) {
        // Implementation for editing shortcuts
        console.log('Edit shortcut:', shortcutId);
    }

    deleteShortcut(shortcutId) {
        // Implementation for deleting shortcuts
        console.log('Delete shortcut:', shortcutId);
    }

    openShortcutResult(shortcut) {
        // Implementation varies by shortcut type
        console.log('Open shortcut result:', shortcut);
    }

    showErrorDetails(shortcut) {
        alert(`Error: ${shortcut.error}`);
    }

    showProcessingStatus(shortcut) {
        console.log('Processing status:', shortcut);
    }
}

// Base processor class
class ShortcutProcessor {
    async process(shortcut) {
        throw new Error('Process method must be implemented by subclass');
    }
}

// Document processor implementation
class DocumentProcessor extends ShortcutProcessor {
    async process(shortcut) {
        // Fetch document information
        const response = await fetch(`/api/documents/${shortcut.identifier}`);
        if (!response.ok) {
            throw new Error(`Document not found: ${shortcut.identifier}`);
        }
        
        const document = await response.json();
        
        return {
            title: document.subject || 'Untitled Document',
            preview: document.summary || document.content?.substring(0, 200) + '...',
            url: `/documents/${shortcut.identifier}`,
            lastModified: document.updated_at
        };
    }
}

// AI processor implementation with progress tracking
class AIProcessor extends ShortcutProcessor {
    async process(shortcut) {
        const [command, ...params] = shortcut.identifier.split(':');
        
        // Start processing with progress tracking
        const processingId = this.generateProcessingId();
        shortcut.processingId = processingId;
        
        try {
            const response = await fetch('/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command,
                    parameters: params.join(':'),
                    config: shortcut.parameters,
                    processingId: processingId
                })
            });
            
            if (!response.ok) {
                throw new Error('AI processing failed');
            }
            
            // Start progress polling
            this.pollProgress(shortcut);
            
            const result = await response.json();
            
            return {
                preview: result.summary || 'AI processing completed',
                content: result.content,
                processingTime: result.processingTime,
                confidence: result.confidence || null
            };
            
        } catch (error) {
            shortcut.progress = 0;
            throw error;
        }
    }
    
    generateProcessingId() {
        return 'ai_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    
    async pollProgress(shortcut) {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/ai/progress/${shortcut.processingId}`);
                if (response.ok) {
                    const progress = await response.json();
                    shortcut.progress = progress.percentage;
                    
                    // Update display
                    if (window.shortcutManager) {
                        window.shortcutManager.updateShortcutDisplay(shortcut);
                    }
                    
                    // Stop polling when complete
                    if (progress.percentage >= 100 || progress.status === 'complete') {
                        clearInterval(pollInterval);
                    }
                }
            } catch (error) {
                console.log('Progress polling error:', error);
                clearInterval(pollInterval);
            }
        }, 1000); // Poll every second
        
        // Clear interval after 2 minutes max
        setTimeout(() => clearInterval(pollInterval), 120000);
    }
}

// Image processor implementation
class ImageProcessor extends ShortcutProcessor {
    async process(shortcut) {
        const response = await fetch(`/api/resources/${shortcut.identifier}`);
        if (!response.ok) {
            throw new Error(`Image not found: ${shortcut.identifier}`);
        }
        
        const resource = await response.json();
        
        return {
            url: resource.file_path,
            alt: shortcut.parameters.alt || resource.name,
            width: shortcut.parameters.width,
            height: shortcut.parameters.height,
            preview: `<img src="${resource.file_path}" alt="${resource.name}" style="max-width: 200px; max-height: 150px;">`
        };
    }
}

// Chart processor implementation
class ChartProcessor extends ShortcutProcessor {
    async process(shortcut) {
        if (shortcut.identifier === 'create') {
            // Create new chart
            return await this.createChart(shortcut.parameters);
        } else {
            // Load existing chart
            return await this.loadChart(shortcut.identifier);
        }
    }
    
    async createChart(params) {
        const response = await fetch('/api/charts/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        const chart = await response.json();
        return {
            preview: 'Chart created successfully',
            chartId: chart.id,
            url: `/charts/${chart.id}`
        };
    }
    
    async loadChart(chartId) {
        const response = await fetch(`/api/charts/${chartId}`);
        const chart = await response.json();
        
        return {
            title: chart.title,
            preview: `<div>Chart: ${chart.title}</div>`,
            url: `/charts/${chartId}`
        };
    }
}

// Export for use
window.MarkdownExtensionShortcuts = MarkdownExtensionShortcuts;

// Initialize global instance
window.shortcutManager = new MarkdownExtensionShortcuts();

// Global helper functions for AI status scanning
window.scanAIStatus = () => window.shortcutManager.getStatusSummary();
window.highlightAI = (duration) => window.shortcutManager.highlightAIRequests(duration);
window.nextAIError = () => window.shortcutManager.scrollToNextAIRequest('error');
window.nextAIProcessing = () => window.shortcutManager.scrollToNextAIRequest('processing');
window.toggleAIOverview = () => window.shortcutManager.toggleStatusOverview();

// Add global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
            case 'H': // Highlight AI requests
                e.preventDefault();
                window.highlightAI();
                break;
            case 'E': // Next error
                e.preventDefault();
                window.nextAIError();
                break;
            case 'P': // Next processing
                e.preventDefault();
                window.nextAIProcessing();
                break;
        }
    }
});