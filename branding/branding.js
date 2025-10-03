/**
 * Branding Manager - Handles application branding and theming
 */
class BrandingManager {
    constructor() {
        this.config = null;
        this.loaded = false;
    }

    /**
     * Load branding configuration from JSON file
     */
    async loadBranding() {
        try {
            const response = await fetch('branding/branding.json');
            if (!response.ok) {
                throw new Error(`Failed to load branding: ${response.status}`);
            }
            
            this.config = await response.json();
            this.loaded = true;
            console.log('Branding configuration loaded:', this.config);
            
            // Apply branding immediately after loading
            this.applyBranding();
            
            return this.config;
        } catch (error) {
            console.error('Failed to load branding configuration:', error);
            
            // Fallback to default branding
            this.config = this.getDefaultBranding();
            this.loaded = true;
            
            console.log('Using default branding configuration');
            this.applyBranding();
            
            return this.config;
        }
    }

    /**
     * Get default branding configuration as fallback
     */
    getDefaultBranding() {
        return {
            application: {
                name: "MarkdownEditor",
                fullName: "Browser-in-Browser Markdown Editor",
                tagline: "A sophisticated markdown editor",
                version: "1.0.0"
            },
            ui: {
                menuBar: {
                    title: "MarkdownEditor - Browser-in-Browser Markdown Editor"
                },
                emptyState: {
                    message: "Open a file from the explorer to start editing",
                    subtitle: "Select any document from the file explorer to begin"
                },
                colors: {
                    primary: "#667eea",
                    secondary: "#764ba2",
                    accent: "#4f46e5",
                    background: "#f4f4f4",
                    emptyStateBackground: "#d0d0d0"
                }
            },
            assets: {
                emptyStateIcon: "📁",
                fileIcons: {
                    markdown: "📄",
                    folder: "📁",
                    user: "👤"
                }
            },
            metadata: {
                author: "Your Organization",
                description: "Professional markdown editing experience"
            }
        };
    }

    /**
     * Apply branding to the UI
     */
    applyBranding() {
        if (!this.config) return;

        // Update document title
        this.updateDocumentTitle();

        // Update menu bar title
        this.updateMenuBarTitle();

        // Update empty state message
        this.updateEmptyStateMessage();

        // Apply color scheme
        this.applyColorScheme();

        // Update meta tags
        this.updateMetaTags();
    }

    /**
     * Update the document title
     */
    updateDocumentTitle() {
        const title = this.config.ui?.menuBar?.title || this.config.application?.fullName || 'MarkdownEditor';
        document.title = title;
    }

    /**
     * Update menu bar title
     */
    updateMenuBarTitle() {
        const titleElement = document.querySelector('header h1');
        if (titleElement) {
            const title = this.config.ui?.menuBar?.title || this.config.application?.fullName || 'MarkdownEditor';
            titleElement.textContent = title;
        }
    }

    /**
     * Update empty state message in CSS
     */
    updateEmptyStateMessage() {
        const message = this.config.ui?.emptyState?.message || 'Open a file from the explorer to start editing';
        
        // Update the CSS content property dynamically
        const style = document.createElement('style');
        style.textContent = `
            html body.no-tabs::after {
                content: '${message}' !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Apply color scheme from branding
     */
    applyColorScheme() {
        const colors = this.config.ui?.colors;
        if (!colors) return;

        const style = document.createElement('style');
        style.textContent = `
            :root {
                --brand-primary: ${colors.primary || '#667eea'};
                --brand-secondary: ${colors.secondary || '#764ba2'};
                --brand-accent: ${colors.accent || '#4f46e5'};
                --brand-background: ${colors.background || '#f4f4f4'};
                --brand-empty-state: ${colors.emptyStateBackground || '#d0d0d0'};
            }
            
            /* Apply branded colors */
            header {
                background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%) !important;
            }
            
            html body.no-tabs {
                background-color: var(--brand-empty-state) !important;
            }
            
            .file-explorer.collapsed:not(.pinned)::after {
                background: var(--brand-primary) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update meta tags with branding information
     */
    updateMetaTags() {
        const metadata = this.config.metadata;
        if (!metadata) return;

        // Update description
        let descMeta = document.querySelector('meta[name="description"]');
        if (descMeta && metadata.description) {
            descMeta.setAttribute('content', metadata.description);
        }

        // Add keywords if they don't exist
        if (metadata.keywords && !document.querySelector('meta[name="keywords"]')) {
            const keywordsMeta = document.createElement('meta');
            keywordsMeta.setAttribute('name', 'keywords');
            keywordsMeta.setAttribute('content', metadata.keywords.join(', '));
            document.head.appendChild(keywordsMeta);
        }

        // Add author if it doesn't exist
        if (metadata.author && !document.querySelector('meta[name="author"]')) {
            const authorMeta = document.createElement('meta');
            authorMeta.setAttribute('name', 'author');
            authorMeta.setAttribute('content', metadata.author);
            document.head.appendChild(authorMeta);
        }
    }

    /**
     * Get branded asset path
     */
    getAssetPath(assetKey) {
        const assets = this.config?.assets;
        if (!assets) return null;

        const keys = assetKey.split('.');
        let value = assets;
        
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return null;
            }
        }
        
        return value;
    }

    /**
     * Get branding configuration value
     */
    get(path) {
        if (!this.config) return null;

        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return null;
            }
        }
        
        return value;
    }

    /**
     * Check if branding is loaded
     */
    isLoaded() {
        return this.loaded;
    }
}

// Create global branding manager instance
window.BrandingManager = new BrandingManager();