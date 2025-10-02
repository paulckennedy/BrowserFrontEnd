// TypeScript Definitions

declare module '@browserfrontend/document-system' {
  
  // Hash ID type
  export type HashId = string;
  
  // Timestamp type
  export type Timestamp = string;
  
  // Configuration interfaces
  export interface DocumentSystemConfig {
    baseUrl?: string;
    vectorDbUrl?: string;
    autosaveInterval?: number;
    batchSize?: number;
  }
  
  export interface AIAgentConfig {
    baseUrl?: string;
    timeout?: number;
  }
  
  // Document system types
  export interface UserNode {
    user_id: HashId;
    username: string;
    email: string;
    full_name: string;
    preferences: Record<string, any>;
    created_at: Timestamp;
    last_active: Timestamp;
  }
  
  export interface MarkdownDocument {
    markdown_id: HashId;
    summary: string;
    categories: string[];
    resources_array: HashId[];
    owner_user_id: HashId;
    nested_prompts: HashId[];
    prompt_source_id: HashId | null;
    chunk_ids: HashId[];
    created_at: Timestamp;
    updated_at: Timestamp;
  }
  
  export interface PromptNode {
    prompt_id: HashId;
    prompt_text: string;
    source_document_id: HashId;
    ai_model: string;
    parameters: Record<string, any>;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    response_document_id: HashId | null;
    created_at: Timestamp;
    processed_at: Timestamp | null;
  }
  
  export interface ResourceNode {
    resource_id: HashId;
    url: string;
    type: 'image' | 'file' | 'link' | 'reference';
    title: string;
    description: string;
    metadata: Record<string, any>;
    access_permissions: string;
    created_at: Timestamp;
    updated_at: Timestamp;
  }
  
  // AI Communication types
  export interface AIRequest {
    id: string;
    type: string;
    timestamp: Timestamp;
    payload: {
      content: string;
      context: {
        selection: string | null;
        documentType: string;
        language: string;
      };
      options: Record<string, any>;
    };
  }
  
  export interface AIResponse {
    id: string;
    type: string;
    status: 'success' | 'error';
    content: string;
    metadata: Record<string, any>;
    timestamp: Timestamp;
    model: string;
    processingTime: number;
  }
  
  // Validation result types
  export interface ValidationError {
    path: string;
    message: string;
    value: any;
  }
  
  export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
  }
  
  export interface DocumentValidationResult extends ValidationResult {
    node?: any;
  }
  
  export interface CommunicationValidationResult extends ValidationResult {
    message?: AIRequest;
  }
  
  // Editor context type
  export interface EditorContext {
    documentId: HashId;
    summary: string;
    categories: string[];
    resources: HashId[];
    owner: HashId;
    promptHistory: HashId[];
    promptSourceId: HashId | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  
  // Document load result
  export interface DocumentLoadResult {
    content: string;
    context: EditorContext;
    node: MarkdownDocument;
  }
  
  // Main classes
  export class DocumentSystemIntegration {
    constructor(config?: DocumentSystemConfig);
    
    loadDocument(markdownId: HashId): Promise<DocumentLoadResult>;
    createDocument(content: string, metadata?: Partial<MarkdownDocument>): Promise<MarkdownDocument>;
    onDocumentChange(documentId: HashId, content: string, metadata?: Record<string, any>): void;
    setUserNode(userNode: UserNode): void;
    getDocument(documentId: HashId): MarkdownDocument | undefined;
    forceSave(): Promise<void>;
    destroy(): void;
    
    private reconstructContent(chunkIds: HashId[]): Promise<string>;
    private setupAutosave(): void;
    private processBatchUpdates(): Promise<void>;
    private processBatch(batch: Array<[HashId, any]>): Promise<void>;
    private chunkContent(documentId: HashId, content: string): Promise<HashId[]>;
    private splitIntoChunks(content: string, chunkSize?: number): string[];
    private generateSummary(content: string, maxLength?: number): string;
    private generateHashId(): HashId;
    private createBatches<T>(array: T[], batchSize: number): T[][];
  }
  
  export class AIAgentCommunicator {
    constructor(config?: AIAgentConfig);
    
    sendRequest(type: string, content: string, options?: Record<string, any>): Promise<AIResponse>;
    sendStreamingRequest(
      type: string, 
      content: string, 
      options?: Record<string, any>, 
      onChunk?: (chunk: string) => void
    ): Promise<AIResponse>;
    
    generateText(prompt: string, options?: Record<string, any>): Promise<AIResponse>;
    summarizeText(text: string, options?: Record<string, any>): Promise<AIResponse>;
    improveText(text: string, instructions?: string, options?: Record<string, any>): Promise<AIResponse>;
    explainText(text: string, options?: Record<string, any>): Promise<AIResponse>;
    translateText(text: string, targetLanguage: string, options?: Record<string, any>): Promise<AIResponse>;
    answerQuestion(question: string, context?: string, options?: Record<string, any>): Promise<AIResponse>;
    
    sendBatchRequests(requests: Array<{type: string, content: string, options?: Record<string, any>}>): Promise<Array<{
      index: number;
      success: boolean;
      data: AIResponse | null;
      error: string | null;
    }>>;
    
    cancelAllRequests(): void;
    cancelRequest(requestId: string): boolean;
    getPendingRequests(): string[];
    updateConfig(newConfig: Partial<AIAgentConfig>): void;
    
    private loadSchema(): Promise<void>;
    private generateRequestId(): string;
    private createRequest(type: string, content: string, options?: Record<string, any>): AIRequest;
    private processResponse(response: any): AIResponse;
  }
  
  export class SchemaValidator {
    constructor(schemas?: Record<string, any>);
    
    loadSchema(name: string, source: string | object): Promise<void>;
    validate(schemaName: string, data: any): ValidationResult;
    clearCache(): void;
    getSchemaNames(): string[];
    
    private performValidation(schema: any, data: any): ValidationResult;
    private validateType(schema: any, data: any, path: string[], errors: ValidationError[]): void;
    private validateRequired(schema: any, data: any, path: string[], errors: ValidationError[]): void;
    private validateProperties(schema: any, data: any, path: string[], errors: ValidationError[]): void;
    private validatePatterns(schema: any, data: any, path: string[], errors: ValidationError[]): void;
    private validateFormat(format: string, value: string): boolean;
    private getDataType(data: any): string;
  }
  
  export class HashGenerator {
    constructor();
    
    generate(): HashId;
    generateUnique(): HashId;
    generateFromContent(content: string): Promise<HashId>;
    clearUsedHashes(): void;
    getUsedHashCount(): number;
    isHashUsed(hash: HashId): boolean;
    
    static validate(hash: string): boolean;
    
    private generateSecure(): HashId;
    private generateNodeSecure(): HashId;
    private generatePseudoRandom(): HashId;
    private simpleHash(content: string): HashId;
  }
  
  // Validation functions
  export function validateDocument(documentNode: any): DocumentValidationResult;
  export function validateCommunication(message: any): CommunicationValidationResult;
  export function validateMarkdownDocument(markdownDoc: any): ValidationResult & { document: MarkdownDocument };
  export function validateUserNode(userNode: any): ValidationResult & { user: UserNode };
  export function validateHashId(hashId: string): { valid: boolean; error: string | null };
  export function validateDocumentBatch(documents: any[]): {
    totalCount: number;
    validCount: number;
    invalidCount: number;
    results: Array<ValidationResult & { index: number }>;
    allValid: boolean;
  };
  
  // Factory functions
  export function createDefaultUserNode(
    username: string, 
    email: string, 
    fullName: string, 
    options?: Record<string, any>
  ): UserNode;
  
  export function createMarkdownDocument(
    content: string, 
    ownerId: HashId, 
    options?: Partial<MarkdownDocument>
  ): MarkdownDocument;
  
  export function createPromptNode(
    promptText: string, 
    sourceDocumentId: HashId, 
    options?: Partial<PromptNode>
  ): PromptNode;
  
  export function createResourceNode(
    url: string, 
    type: ResourceNode['type'], 
    options?: Partial<ResourceNode>
  ): ResourceNode;
  
  export function createCommunicationRequest(
    type: string, 
    content: string, 
    options?: Record<string, any>
  ): AIRequest;
  
  export function createDocumentSystem(): {
    users: UserNode[];
    markdown_documents: MarkdownDocument[];
    resources: ResourceNode[];
  };
  
  export function createUserWorkspace(
    userInfo: { username: string; email: string; fullName: string }, 
    options?: Record<string, any>
  ): {
    user: UserNode;
    documents: MarkdownDocument[];
    resources: ResourceNode[];
  };
  
  export function generateSummary(content: string, maxLength?: number): string;
  export function extractTitleFromUrl(url: string): string;
  
  // Schema exports
  export const schemas: {
    documentSystem: any;
    aiAgentCommunication: any;
  };
  
  // Version
  export const version: string;
}