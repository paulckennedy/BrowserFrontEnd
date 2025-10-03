# Markdown Editor Component

A powerful, reusable, and framework-agnostic markdown editor web component that can be easily integrated into any web application or framework.

## 🚀 Features

- **Framework Agnostic**: Works with React, Vue, Angular, Svelte, and vanilla JavaScript
- **WYSIWYG Editing**: Rich text editing with live markdown conversion
- **Multiple Modes**: WYSIWYG, Markdown, and Split view modes
- **Themeable**: Built-in themes (default, dark, minimal) with custom theme support
- **Auto-save**: Configurable auto-save functionality
- **Database Integration**: Optional PostgreSQL integration for document storage
- **AI Integration**: Optional AI writing assistance
- **Responsive Design**: Mobile-friendly with adaptive UI
- **Keyboard Shortcuts**: Full keyboard navigation and shortcuts
- **Extensible**: Plugin system for custom functionality
- **TypeScript Support**: Full TypeScript definitions included
- **Zero Dependencies**: No external runtime dependencies

## 📦 Installation

### Via NPM

```bash
npm install @your-org/markdown-editor-component
```

### Via CDN

```html
<script src="https://unpkg.com/@your-org/markdown-editor-component@latest/dist/markdown-editor-component.min.js"></script>
```

### Download

Download the latest release from [GitHub releases](https://github.com/your-org/markdown-editor-component/releases).

## 🎯 Quick Start

### Vanilla HTML

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@your-org/markdown-editor-component@latest/dist/markdown-editor-component.min.js"></script>
</head>
<body>
    <markdown-editor 
        mode="wysiwyg" 
        height="400px"
        content="# Welcome\n\nStart writing your markdown here...">
    </markdown-editor>
</body>
</html>
```

### React

```jsx
import React, { useRef, useEffect } from 'react';
import '@your-org/markdown-editor-component';

function MyEditor() {
    const editorRef = useRef(null);
    
    useEffect(() => {
        const editor = editorRef.current;
        
        editor.addEventListener('content-change', (e) => {
            console.log('Content:', e.detail.content);
        });
    }, []);
    
    return (
        <markdown-editor
            ref={editorRef}
            mode="wysiwyg"
            theme="default"
            height="500px"
            autosave="true"
        />
    );
}
```

### Vue.js

```vue
<template>
    <markdown-editor
        ref="editor"
        :mode="mode"
        :theme="theme"
        @content-change="handleContentChange"
        @save="handleSave"
    />
</template>

<script>
import '@your-org/markdown-editor-component';

export default {
    data() {
        return {
            mode: 'wysiwyg',
            theme: 'default'
        };
    },
    methods: {
        handleContentChange(event) {
            console.log('Content changed:', event.detail.content);
        },
        handleSave(event) {
            console.log('Saving:', event.detail.content);
        }
    }
};
</script>
```

### Angular

```typescript
// app.module.ts
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

// component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import '@your-org/markdown-editor-component';

@Component({
    selector: 'app-editor',
    template: `
        <markdown-editor 
            #editor
            mode="wysiwyg"
            (content-change)="onContentChange($event)">
        </markdown-editor>
    `
})
export class EditorComponent {
    @ViewChild('editor') editor!: ElementRef;
    
    onContentChange(event: any) {
        console.log('Content:', event.detail.content);
    }
}
```

## ⚙️ Configuration

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `'wysiwyg' \| 'markdown' \| 'split'` | `'wysiwyg'` | Editor display mode |
| `theme` | `'default' \| 'dark' \| 'minimal'` | `'default'` | Visual theme |
| `height` | `string` | `'500px'` | Editor height |
| `width` | `string` | `'100%'` | Editor width |
| `content` | `string` | `''` | Initial content |
| `autosave` | `boolean` | `true` | Enable auto-save |
| `show-toolbar` | `boolean` | `true` | Show formatting toolbar |
| `show-menubar` | `boolean` | `true` | Show menu bar |
| `show-statusbar` | `boolean` | `true` | Show status bar |

### JavaScript API

```javascript
const editor = document.querySelector('markdown-editor');

// Content management
editor.setContent('# New Content');
const content = editor.getContent();

// Configuration
editor.configure({
    theme: 'dark',
    mode: 'split',
    autosave: false
});

// Programmatic control
editor.insertText('Additional text');
editor.focus();
editor.save();

// Event listeners
editor.addEventListener('content-change', (e) => {
    console.log('Content changed:', e.detail.content);
});

editor.addEventListener('save', (e) => {
    console.log('Save triggered:', e.detail.content);
});
```

## 🎨 Theming

### Built-in Themes

- **Default**: Clean, professional appearance
- **Dark**: Dark mode for low-light environments  
- **Minimal**: Simplified interface with minimal chrome

### Custom Themes

```css
markdown-editor[theme="custom"] {
    --primary-color: #your-color;
    --secondary-color: #your-secondary;
    --text-color: #your-text;
    --border-color: #your-border;
    --background-color: #your-background;
}
```

## 🔌 Advanced Features

### Database Integration

```javascript
// Enable database features
import '@your-org/markdown-editor-component/enhanced';

// Use enhanced component with database support
const editor = document.createElement('enhanced-markdown-editor');
editor.configure({ 
    features: { 
        database: true 
    } 
});
```

### AI Integration

```javascript
// Configure AI assistance
editor.configure({
    features: {
        aiIntegration: true
    }
});

// Listen for AI events
editor.addEventListener('ai-suggestion', (e) => {
    console.log('AI suggestion:', e.detail.suggestion);
});
```

### Plugin System

```javascript
// Create custom plugin
class CustomPlugin {
    init(editor) {
        this.editor = editor;
        this.addCustomButton();
    }
    
    addCustomButton() {
        // Add custom functionality
    }
}

// Register plugin
editor.addPlugin('custom', new CustomPlugin());
```

## 📱 Mobile Support

The component is fully responsive and includes:

- Touch-friendly interface
- Mobile-optimized toolbar
- Gesture support
- Adaptive layout for small screens

## ♿ Accessibility

- Full keyboard navigation
- Screen reader support
- High contrast mode
- ARIA labels and roles
- Focus management

## 🌍 Browser Support

- Chrome 60+
- Firefox 63+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 Bundle Size

- Core component: ~45KB minified + gzipped
- Enhanced version: ~65KB minified + gzipped
- Zero runtime dependencies

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/your-org/markdown-editor-component.git
cd markdown-editor-component

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Serve examples
npm run serve
```

## 📝 Examples

See the [examples directory](./examples/) for comprehensive usage examples including:

- Basic integration
- Framework-specific implementations
- Advanced configuration
- Custom themes
- Plugin development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙋 Support

- 📖 [Documentation](https://your-org.github.io/markdown-editor-component)
- 💬 [Discussions](https://github.com/your-org/markdown-editor-component/discussions)
- 🐛 [Issues](https://github.com/your-org/markdown-editor-component/issues)
- 📧 Email: support@your-org.com

## 🗺️ Roadmap

- [ ] Plugin marketplace
- [ ] Real-time collaboration
- [ ] Advanced table editing
- [ ] Math equation support
- [ ] Diagram integration
- [ ] Export to multiple formats
- [ ] Version history
- [ ] Advanced AI features

## 🎉 Acknowledgments

Built upon the existing markdown and WYSIWYG editor implementations with inspiration from:

- Obsidian
- Typora  
- Notion
- GitHub's markdown editor

---

**Made with ❤️ by [Your Organization](https://your-org.com)**