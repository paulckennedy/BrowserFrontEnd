# Document System Implementation Guide

## Schema-Editor Integration Overview

This document describes how the document system schema integrates with the markdown editor for data loading, autosave operations, and backend communication.

## Core Integration Patterns

### 1. Markdown Editor Loading Process

Each editor tab corresponds to a `markdown_document` node:

```javascript
// Load document into editor tab
async function loadDocumentIntoEditor(markdownId) {
  // 1. Fetch markdown_document node from backend
  const docNode = await fetchMarkdownDocument(markdownId);
  
  // 2. Reconstruct content from chunks
  const content = await reconstructFromChunks(docNode.chunk_ids);
  
  // 3. Load metadata into editor context
  const editorContext = {
    documentId: docNode.markdown_id,
    summary: docNode.summary,
    categories: docNode.categories,
    resources: docNode.resources_array,
    owner: docNode.owner_user_id,
    promptHistory: docNode.nested_prompts
  };
  
  // 4. Initialize editor with content and context
  createEditorTab(content, editorContext);
}
```

### 2. Autosave Operations

Every autosave updates the corresponding `markdown_document` node:

```javascript
// Autosave handler
async function handleAutosave(editorTab) {
  const content = editorTab.getContent();
  const documentId = editorTab.getDocumentId();
  
  // 1. Chunk content for vector storage
  const chunkIds = await chunkContent(content);
  
  // 2. Update markdown_document node
  const updatedNode = {
    markdown_id: documentId,
    chunk_ids: chunkIds,
    summary: generateSummary(content),
    updated_at: new Date().toISOString(),
    // Preserve existing fields
    owner_user_id: editorTab.context.owner,
    categories: editorTab.context.categories,
    nested_prompts: editorTab.context.promptHistory,
    resources_array: editorTab.context.resources,
    prompt_source_id: editorTab.context.promptSourceId,
    created_at: editorTab.context.createdAt
  };
  
  // 3. Send update to backend
  await updateMarkdownDocument(updatedNode);
}
```

### 3. Backend Communication Protocol

Collections of nodes are sent for batch operations:

```javascript
// Batch sync with backend
async function syncWithBackend(pendingChanges) {
  const payload = {
    operation: 'batch_update',
    timestamp: new Date().toISOString(),
    data: {
      markdown_documents: pendingChanges.documents,
      prompt_nodes: pendingChanges.prompts,
      resources: pendingChanges.resources
    }
  };
  
  // Send batch update
  const response = await fetch('/api/documents/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  return await response.json();
}
```

### 4. User Tab Population

User preferences tab loads from `user_node`:

```javascript
// Load user tab
async function loadUserTab(userId) {
  // Fetch user node
  const userNode = await fetchUserNode(userId);
  
  // Populate user interface
  const userTab = {
    profile: {
      id: userNode.user_id,
      description: userNode.detailed_description,
      resources: userNode.resources_array
    },
    preferences: {
      aiPrompts: userNode.personalization_prompts,
      createdAt: userNode.created_at,
      updatedAt: userNode.updated_at
    }
  };
  
  renderUserPreferencesTab(userTab);
}
```

## Data Flow Architecture

### Document Loading Flow
1. **Request** → Backend fetches `markdown_document` node
2. **Reconstruction** → Vector DB retrieves chunks via `chunk_ids`
3. **Assembly** → Content reconstructed and loaded into editor
4. **Context** → Metadata populates editor context and UI

### Autosave Flow
1. **Content Change** → Editor detects modification
2. **Chunking** → Content split and stored in vector DB
3. **Node Update** → `markdown_document` node updated with new `chunk_ids`
4. **Sync** → Updated node sent to backend

### AI Integration Flow
1. **Prompt Trigger** → User triggers AI operation in editor
2. **Prompt Node** → New `prompt_node` created with pending status
3. **Processing** → AI agents process prompt using document context
4. **Response** → New `markdown_document` created for AI response
5. **Linking** → Prompt node updated with response document ID
6. **History** → Prompt added to source document's `nested_prompts`

## Implementation Considerations

### Performance Optimization
- **Batch Operations**: Minimize API calls by batching document updates
- **Lazy Loading**: Load document content on tab activation
- **Chunk Caching**: Cache frequently accessed chunks locally
- **Debounced Autosave**: Prevent excessive saves during rapid typing

### Data Consistency
- **Version Control**: Use `updated_at` timestamps for conflict resolution
- **Atomic Updates**: Ensure chunk storage and node updates are atomic
- **Rollback**: Maintain previous chunk versions for rollback capability
- **Validation**: Validate schema compliance before backend sync

### Error Handling
- **Network Failures**: Queue updates for retry on connection restore
- **Schema Violations**: Validate data before sending to backend
- **Chunk Loss**: Implement chunk verification and recovery
- **Concurrent Edits**: Handle simultaneous edits with merge strategies

## Schema Validation Integration

```javascript
// Validate document node before saving
function validateDocumentNode(node) {
  const validator = new JSONSchemaValidator(documentSystemSchema);
  const result = validator.validate(node, 'markdown_document');
  
  if (!result.valid) {
    throw new Error(`Schema validation failed: ${result.errors.join(', ')}`);
  }
  
  return true;
}
```

This integration ensures that your markdown editor maintains perfect synchronization with the backend while providing a seamless user experience through the schema-defined data structures.