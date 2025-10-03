const { DocumentSystemIntegration } = require('./src/DocumentSystemIntegration');
const { AIAgentCommunicator } = require('./src/AIAgentCommunicator');
const { SchemaValidator } = require('./src/SchemaValidator');
const { HashGenerator } = require('./src/HashGenerator');

// Export schemas as JSON objects
const documentSystemSchema = require('./schemas/document-system-schema.json');
const aiAgentCommunicationSchema = require('./schemas/ai-agent-communication.json');

// Export utility functions
const { validateDocument, validateCommunication } = require('./src/validators');
const { createDefaultUserNode, createMarkdownDocument } = require('./src/factories');

module.exports = {
  // Main classes
  DocumentSystemIntegration,
  AIAgentCommunicator,
  SchemaValidator,
  HashGenerator,
  
  // Schemas
  schemas: {
    documentSystem: documentSystemSchema,
    aiAgentCommunication: aiAgentCommunicationSchema
  },
  
  // Validators
  validateDocument,
  validateCommunication,
  
  // Factories
  createDefaultUserNode,
  createMarkdownDocument,
  
  // Version
  version: require('./package.json').version
};