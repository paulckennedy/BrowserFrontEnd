-- Create the markdown editor database schema
-- This file is automatically executed when the PostgreSQL container starts

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON documents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_documents_content_search ON documents USING GIN(to_tsvector('english', content));

-- Create users table for future authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'
);

-- Create document_shares table for collaborative features
CREATE TABLE IF NOT EXISTS document_shares (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'read', -- 'read', 'write', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, user_id)
);

-- Create document_history for version control
CREATE TABLE IF NOT EXISTS document_history (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT,
    version INTEGER,
    changed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_summary TEXT
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO documents (name, content, metadata) VALUES 
(
    'welcome.md',
    E'# Welcome to MarkdownEditor\n\nThis is your first document! 🎉\n\n## Features\n\n- **Auto-save**: Your changes are automatically saved\n- **Live preview**: See your markdown rendered in real-time\n- **Database storage**: All documents are stored securely\n- **AI integration**: Smart writing assistance\n\n## Getting Started\n\n1. Start typing in the editor\n2. Use the toolbar for quick formatting\n3. Your changes save automatically\n4. Toggle the preview pane to see rendered output\n\n---\n\n*Happy writing!* ✨',
    '{"tags": ["welcome", "tutorial"], "template": true}'
),
(
    'sample-document.md',
    E'# Sample Document\n\nThis is a sample markdown document to demonstrate the editor capabilities.\n\n## Code Examples\n\n```javascript\nconst editor = new MarkdownEditor();\neditor.init();\n```\n\n## Lists\n\n- Item 1\n- Item 2\n  - Nested item\n  - Another nested item\n\n## Tables\n\n| Feature | Status |\n|---------|--------|\n| Auto-save | ✅ |\n| Live preview | ✅ |\n| Database storage | ✅ |\n\n## Links and Images\n\n[Visit GitHub](https://github.com)\n\n![Placeholder](https://via.placeholder.com/300x200)',
    '{"tags": ["example", "demo"]}'
) ON CONFLICT DO NOTHING;

-- Create a default admin user (password: 'admin123' - change in production!)
INSERT INTO users (username, email, password_hash, preferences) VALUES 
(
    'admin',
    'admin@markdowneditor.local',
    '$2b$10$rGmzWjKkV0ZBTvWZXzKl6uJ0WkJ9Y9/2wF1JYUdJj3.xLKa5xYfNe', -- admin123
    '{"theme": "default", "auto_save_delay": 2000}'
) ON CONFLICT DO NOTHING;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO markdown_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO markdown_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO markdown_user;

-- Create custom functions for the application
CREATE OR REPLACE FUNCTION search_documents(search_term TEXT)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR(255),
    content TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.content,
        d.updated_at,
        ts_rank(to_tsvector('english', d.content), plainto_tsquery('english', search_term)) as rank
    FROM documents d
    WHERE 
        d.is_deleted = false
        AND (
            to_tsvector('english', d.content) @@ plainto_tsquery('english', search_term)
            OR d.name ILIKE '%' || search_term || '%'
        )
    ORDER BY rank DESC, d.updated_at DESC;
END;
$$ LANGUAGE plpgsql;