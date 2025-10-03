# Communication Schemas

This directory contains JSON Schema definitions for communication protocols between the frontend WYSIWYG editor and backend services.

## Schema Files

### `ai-agent-communication.json`

Defines the communication protocol for AI agent interactions including:

- **Request Messages**: Structure for sending content to AI agents
- **Response Messages**: Structure for receiving processed results
- **Stream Messages**: Structure for real-time streaming responses

### `document-system-schema.json`

Defines the complete document management system structure including:

- **Users**: User nodes with personalization settings
- **Markdown Documents**: Document nodes with content chunks and metadata
- **Prompt Nodes**: LLM prompt execution metadata and lineage tracking
- **Hash Keys**: 64-character hexadecimal identifiers for all entities

## Message Types

### AI Agent Operations

- `text_analysis` - Analyze text for insights
- `content_generation` - Generate new content
- `grammar_check` - Check and correct grammar
- `style_suggestion` - Provide style improvements
- `translation` - Translate content between languages
- `summarization` - Create content summaries
- `format_conversion` - Convert between formats (markdown, HTML, etc.)

## Document System Components

### Hash Keys

All entities use 64-character hexadecimal hash keys (256-bit) for unique identification:

```regex
^[0-9a-fA-F]{64}$
```

### User Nodes

Users with personalization settings and preferences:

- Detailed descriptions for AI context
- Personalization prompts for customized responses
- Created/updated timestamps

### Markdown Documents

Document structure with chunked content:

- **Summary**: Brief content description
- **Categories**: Descriptive tags for organization
- **Chunk IDs**: Ordered list for vector DB reassembly
- **Nested Prompts**: Full history of executed prompts
- **Prompt Source**: Lineage tracking (null for original docs)

### Prompt Nodes

LLM execution metadata:

- **Status**: completed, pending, or failed
- **Source/Response IDs**: Document lineage tracking
- **Prompt Text**: Natural language query
- **Timestamps**: Creation and update tracking

## Usage Examples

### AI Agent Communication

#### Request Message

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "grammar_check",
  "timestamp": "2025-10-02T14:30:00Z",
  "payload": {
    "content": "This is some text that needs checking.",
    "context": {
      "selection": {
        "start": 0,
        "end": 37
      },
      "documentType": "markdown",
      "language": "en"
    },
    "options": {
      "strictness": "medium"
    }
  }
}
```

### Response Message

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "success",
  "timestamp": "2025-10-02T14:30:02Z",
  "result": {
    "processedContent": "This is some text that needs checking.",
    "suggestions": [
      {
        "type": "replacement",
        "position": {
          "start": 8,
          "end": 12
        },
        "original": "some",
        "suggested": "sample",
        "confidence": 0.85,
        "reason": "More specific word choice"
      }
    ],
    "metadata": {
      "processingTime": 1.2,
      "model": "gpt-4",
      "confidence": 0.92
    }
  }
}
```

### Document System Example

#### User Node

```json
{
  "user_id": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890abcdef1234567890123456789012345678901234567890123456789012345",
  "detailed_description": "Technical writer specializing in software documentation with preference for concise, actionable content.",
  "personalization_prompts": [
    "Prefer bullet points over paragraphs",
    "Include code examples when relevant",
    "Focus on practical implementation details"
  ],
  "created_at": "2025-10-02T14:30:00Z",
  "updated_at": "2025-10-02T14:30:00Z"
}
```

#### Markdown Document

```json
{
  "markdown_id": "b2c3d4e5f6789012345678901234567890123456789012345678901234567890abcdef1234567890123456789012345678901234567890123456789012345678",
  "owner_user_id": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890abcdef1234567890123456789012345678901234567890123456789012345",
  "summary": "API documentation for user authentication endpoints",
  "categories": ["documentation", "api", "authentication"],
  "chunk_ids": [
    "c3d4e5f6789012345678901234567890123456789012345678901234567890abcdef1234567890123456789012345678901234567890123456789012345678901",
    "d4e5f6789012345678901234567890123456789012345678901234567890abcdef12345678901234567890123456789012345678901234567890123456789012"
  ],
  "nested_prompts": [],
  "prompt_source_id": null,
  "created_at": "2025-10-02T14:30:00Z",
  "updated_at": "2025-10-02T14:30:00Z"
}
```

## Document System Integration

### Editor-Schema Integration

The document system schema defines how data flows between the markdown editor and backend:

#### **Markdown Editor Loading**
- Each tab loads a `markdown_document` node
- Content is reconstructed from `chunk_ids` array (vector DB retrieval)
- Document metadata populates editor context (categories, summary, etc.)
- Associated `resources_array` loads linked files and references

#### **Autosave Operations**
- Every autosave triggers `markdown_document` node update
- Content is re-chunked and `chunk_ids` array updated
- `updated_at` timestamp refreshed
- `nested_prompts` array maintained for AI interaction history

#### **Backend Communication**
- Collections of `markdown_document` and `prompt_node` objects sent to server
- Batch operations for efficiency (multiple documents at once)
- `user_node` requested separately for user tab population
- Resource references maintained through `resources_array` linkage

### Data Flow Patterns

```
Editor Tab ←→ markdown_document node ←→ Backend Server
     ↓              ↓                        ↓
  Autosave    Update Object           Batch Sync
     ↓              ↓                        ↓
Vector DB ←→ chunk_ids array ←→ Content Reconstruction
```

### User Tab Integration
- `user_node` object populates user preferences tab
- `personalization_prompts` configure AI agent behavior
- `resources_array` shows user's associated files and references

## Schema Validation

The schemas can be used with JSON Schema validators to ensure message integrity and compatibility between frontend and backend services.

## Versioning

Schema versions follow semantic versioning. Breaking changes will increment the major version number.
