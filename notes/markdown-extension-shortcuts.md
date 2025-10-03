# Markdown Extension Shortcuts for Enhanced Document System

## Overview

This document defines a comprehensive set of markdown extension shortcuts that integrate seamlessly with the enhanced document storage schema. These shortcuts provide rich functionality for document linking, resource embedding, and interactive content while maintaining consistent identification and hover notifications.

## Core Design Principles

### 1. Schema Integration
All shortcuts directly map to the enhanced document storage schema entities:
- Document references → `markdown_document` nodes
- Resource embeddings → `resource_node` entities  
- AI processing → `prompt_node` and `workflow_node` integration
- User context → `user_node` personalization

### 2. Consistent Syntax Pattern
```
@[type:identifier:parameters]
```
- `@` - Extension prefix for all shortcuts
- `type` - Shortcut category (doc, res, ai, chart, etc.)
- `identifier` - Unique reference or command
- `parameters` - Optional configuration (pipe-separated)

### 3. Hover Identification System
Every shortcut displays:
- **Icon** - Visual type indicator
- **Title** - Human-readable name
- **Status** - Processing state (pending, ready, error)
- **Preview** - Content summary or thumbnail
- **Actions** - Available operations (edit, refresh, delete)

## Document Linking Shortcuts

### Document References
```markdown
@[doc:hash_id]                           # Simple document link
@[doc:hash_id:title=Custom Title]        # Link with custom title
@[doc:hash_id:embed=preview]             # Embedded preview
@[doc:hash_id:section=heading-name]      # Link to specific section
```

**Schema Integration:**
- Creates `shortcut_node` with `shortcut_type: "document_reference"`
- References target document via `result_markdown_id`
- Updates target document's `shortcut_refs` array

**Hover Display:**
- 📄 Document icon
- Document subject and summary
- Last modified timestamp
- Preview of first paragraph

### Document Collections
```markdown
@[collection:tag_name]                   # All docs with tag
@[collection:user_id:category]           # User's docs in category
@[collection:recent:limit=5]             # Recent documents
```

## Resource Embedding Shortcuts

### Images and Visual Content
```markdown
@[img:resource_id]                       # Basic image embed
@[img:resource_id:width=300|alt=Description]  # Configured image
@[gallery:resource_ids]                  # Image gallery
@[avatar:user_id]                        # User avatar
```

### Charts and Data Visualization
```markdown
@[chart:resource_id]                     # Embedded chart
@[chart:create:type=bar|data=data_id]    # Generate new chart
@[graph:resource_id:interactive=true]    # Interactive graph
@[dashboard:layout_id]                   # Embedded dashboard
```

### Tables and Structured Data
```markdown
@[table:resource_id]                     # Data table embed
@[table:create:source=csv_resource_id]   # Generate from CSV
@[spreadsheet:resource_id:range=A1:C10]  # Spreadsheet range
```

### Mathematical Content
```markdown
@[equation:latex_string]                 # LaTeX equation
@[equation:resource_id]                  # Stored equation
@[formula:name:params]                   # Named formula with parameters
```

### Media Content
```markdown
@[video:resource_id]                     # Video embed
@[audio:resource_id]                     # Audio player
@[pdf:resource_id:page=3]               # PDF viewer at page
@[3d:model_resource_id]                 # 3D model viewer
```

## AI Processing Shortcuts

### Content Generation
```markdown
@[ai:summarize:doc_id]                   # Document summary
@[ai:translate:text|lang=es]             # Text translation  
@[ai:expand:topic|style=technical]       # Content expansion
@[ai:rewrite:text|tone=formal]           # Text rewriting
```

### Analysis and Insights
```markdown
@[ai:analyze:resource_id|type=sentiment] # Content analysis
@[ai:extract:doc_id|entities=people]     # Entity extraction
@[ai:classify:text|categories=topics]    # Content classification
@[ai:compare:doc1_id,doc2_id]           # Document comparison
```

### Interactive AI
```markdown
@[ai:chat:context_id]                    # AI chat interface
@[ai:qa:doc_id|question=What is...?]     # Question answering
@[ai:brainstorm:topic|style=creative]    # Idea generation
```

## Advanced Shortcuts

### Workflow Integration
```markdown
@[workflow:template_id]                  # Workflow template
@[workflow:status:workflow_id]           # Workflow status
@[workflow:trigger:event_name]           # Workflow triggers
```

### User and Collaboration
```markdown
@[user:user_id]                         # User mention/profile
@[team:team_id]                         # Team information
@[permission:resource_id]               # Permission viewer
@[audit:entity_id]                      # Audit trail
```

### System Integration
```markdown
@[metrics:entity_id|timeframe=week]     # Performance metrics
@[health:agent_id]                      # Agent health status
@[queue:status]                         # Processing queue status
```

## Implementation Architecture

### Shortcut Processing Pipeline

1. **Detection Phase**
   ```javascript
   // Regex pattern for shortcut detection  
   const SHORTCUT_PATTERN = /@\[([^:]+):([^:\]]+)(?::([^\]]+))?\]/g;
   
   // Parse shortcut components
   function parseShortcut(match) {
     const [, type, identifier, parameters] = match;
     return {
       type,
       identifier, 
       parameters: parseParameters(parameters),
       original: match[0]
     };
   }
   ```

2. **Schema Registration**
   ```javascript
   // Create shortcut_node in schema
   function registerShortcut(shortcut, markdownId) {
     return {
       shortcut_id: generateHashKey(),
       markdown_id: markdownId,
       shortcut_type: shortcut.type,
       shortcut_content: shortcut.original,
       status: "pending",
       prompt_ref: null,
       result_resource_id: null,
       result_markdown_id: null,
       created_at: new Date().toISOString(),
       updated_at: new Date().toISOString()
     };
   }
   ```

3. **Processing Execution**
   ```javascript
   // Route to appropriate processor
   async function processShortcut(shortcut) {
     const processor = getProcessor(shortcut.type);
     
     // Create prompt_node for AI processing
     if (processor.requiresAI) {
       const prompt = await createPromptNode(shortcut);
       await queueForProcessing(prompt);
     }
     
     // Direct execution for simple shortcuts
     else {
       const result = await processor.execute(shortcut);
       await updateShortcutResult(shortcut.id, result);
     }
   }
   ```

4. **Hover System Implementation**
   ```javascript
   // Hover tooltip component
   class ShortcutTooltip {
     constructor(shortcut) {
       this.shortcut = shortcut;
       this.element = this.createElement();
     }
     
     createElement() {
       return `
         <div class="shortcut-tooltip ${this.shortcut.status}">
           <div class="tooltip-header">
             <span class="icon">${this.getIcon()}</span>
             <span class="title">${this.getTitle()}</span>
             <span class="status">${this.shortcut.status}</span>
           </div>
           <div class="tooltip-content">
             ${this.getPreview()}
           </div>
           <div class="tooltip-actions">
             ${this.getActions()}
           </div>
         </div>
       `;
     }
   }
   ```

### Status Indicators

Each shortcut displays visual status through consistent styling:

```css
.shortcut {
  position: relative;
  display: inline-block;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.9em;
}

.shortcut.pending {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.shortcut.processing {
  background: #d1ecf1; 
  border: 1px solid #bee5eb;
  color: #0c5460;
  animation: pulse 1.5s infinite;
}

.shortcut.ready {
  background: #d4edda;
  border: 1px solid #c3e6cb; 
  color: #155724;
  cursor: pointer;
}

.shortcut.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

## Configuration and Customization

### Shortcut Registry
```javascript
const SHORTCUT_REGISTRY = {
  // Document shortcuts
  doc: {
    processor: DocumentProcessor,
    icon: '📄',
    requiresAI: false,
    permissions: ['read']
  },
  
  // Resource shortcuts  
  img: {
    processor: ImageProcessor,
    icon: '🖼️', 
    requiresAI: false,
    permissions: ['read']
  },
  
  // AI shortcuts
  ai: {
    processor: AIProcessor,
    icon: '🤖',
    requiresAI: true,
    permissions: ['execute']
  },
  
  // Chart shortcuts
  chart: {
    processor: ChartProcessor,
    icon: '📊',
    requiresAI: false,
    permissions: ['read', 'create']
  }
};
```

### User Preferences
```javascript
// User-specific shortcut configuration
const userShortcutPrefs = {
  user_id: "user_hash_here",
  preferences: {
    hover_delay: 500,           // ms before showing tooltip
    auto_process: true,         // Auto-process on creation
    preview_size: 'medium',     // small, medium, large
    default_permissions: ['read'],
    favorite_shortcuts: ['ai:summarize', 'chart:create']
  }
};
```

## Integration Examples

### Example 1: Research Document with Mixed Content
```markdown
# Market Analysis Report

## Executive Summary
@[ai:summarize:market_data_2024:style=executive]

## Market Trends  
@[chart:sales_data:type=line|period=ytd]

## Competitive Analysis
@[table:competitor_data:sort=market_share|desc=true]

## Regional Performance
@[img:regional_map:overlay=performance_data]

## Related Documents
@[collection:market_analysis:recent:limit=3]

## Video Presentation
@[video:presentation_recording:start=120|chapters=true]
```

### Example 2: Technical Documentation
```markdown
# API Documentation

## Authentication Flow
@[workflow:auth_flow:diagram=true]

## Code Examples
@[ai:generate:code_examples|lang=javascript|style=complete]

## Performance Metrics
@[metrics:api_endpoints|timeframe=month|chart=true]

## Error Codes
@[table:error_codes:searchable=true|exportable=csv]
```

This comprehensive markdown extension system provides:

✅ **Rich Content Integration** - Support for all major content types
✅ **Schema Compliance** - Full integration with enhanced document storage
✅ **Consistent UX** - Uniform hover notifications and status indicators  
✅ **AI Processing** - Seamless workflow integration for intelligent content
✅ **Extensibility** - Plugin architecture for custom shortcuts
✅ **Performance** - Efficient processing and caching mechanisms

The system transforms markdown documents from static text into dynamic, interactive content hubs that leverage the full power of the enhanced document storage schema.