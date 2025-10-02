/**
 * Schema Validator Utility
 * Provides JSON schema validation capabilities for documents and communication
 */

class SchemaValidator {
    constructor(schemas = {}) {
        this.schemas = schemas;
        this.validationCache = new Map();
    }

    /**
     * Load schema from object or URL
     */
    async loadSchema(name, source) {
        if (typeof source === 'string') {
            try {
                const response = await fetch(source);
                this.schemas[name] = await response.json();
            } catch (error) {
                throw new Error(`Failed to load schema ${name}: ${error.message}`);
            }
        } else {
            this.schemas[name] = source;
        }
    }

    /**
     * Validate data against a schema
     */
    validate(schemaName, data) {
        const schema = this.schemas[schemaName];
        if (!schema) {
            throw new Error(`Schema ${schemaName} not found`);
        }

        const cacheKey = `${schemaName}:${JSON.stringify(data)}`;
        if (this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey);
        }

        const result = this.performValidation(schema, data);
        this.validationCache.set(cacheKey, result);
        
        return result;
    }

    /**
     * Perform the actual validation logic
     */
    performValidation(schema, data) {
        const errors = [];
        
        try {
            this.validateType(schema, data, [], errors);
            this.validateRequired(schema, data, [], errors);
            this.validateProperties(schema, data, [], errors);
            this.validatePatterns(schema, data, [], errors);
        } catch (error) {
            errors.push({
                path: [],
                message: error.message,
                value: data
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate data type
     */
    validateType(schema, data, path, errors) {
        if (!schema.type) return;

        const expectedType = schema.type;
        const actualType = this.getDataType(data);

        if (expectedType !== actualType) {
            errors.push({
                path: path.join('.'),
                message: `Expected type ${expectedType}, got ${actualType}`,
                value: data
            });
        }
    }

    /**
     * Validate required properties
     */
    validateRequired(schema, data, path, errors) {
        if (!schema.required || !Array.isArray(schema.required)) return;
        if (typeof data !== 'object' || data === null) return;

        for (const requiredProp of schema.required) {
            if (!(requiredProp in data)) {
                errors.push({
                    path: [...path, requiredProp].join('.'),
                    message: `Required property '${requiredProp}' is missing`,
                    value: undefined
                });
            }
        }
    }

    /**
     * Validate object properties
     */
    validateProperties(schema, data, path, errors) {
        if (!schema.properties || typeof data !== 'object' || data === null) return;

        // Validate each property
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            if (propName in data) {
                this.performValidation(propSchema, data[propName]);
            }
        }

        // Check for additional properties
        if (schema.additionalProperties === false) {
            for (const propName of Object.keys(data)) {
                if (!(propName in schema.properties)) {
                    errors.push({
                        path: [...path, propName].join('.'),
                        message: `Additional property '${propName}' is not allowed`,
                        value: data[propName]
                    });
                }
            }
        }
    }

    /**
     * Validate string patterns
     */
    validatePatterns(schema, data, path, errors) {
        if (schema.pattern && typeof data === 'string') {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(data)) {
                errors.push({
                    path: path.join('.'),
                    message: `String does not match pattern: ${schema.pattern}`,
                    value: data
                });
            }
        }

        if (schema.format && typeof data === 'string') {
            if (!this.validateFormat(schema.format, data)) {
                errors.push({
                    path: path.join('.'),
                    message: `String does not match format: ${schema.format}`,
                    value: data
                });
            }
        }
    }

    /**
     * Validate string formats
     */
    validateFormat(format, value) {
        switch (format) {
            case 'date-time':
                return !isNaN(Date.parse(value));
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'uri':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            default:
                return true; // Unknown format, assume valid
        }
    }

    /**
     * Get JavaScript type of data
     */
    getDataType(data) {
        if (data === null) return 'null';
        if (Array.isArray(data)) return 'array';
        return typeof data;
    }

    /**
     * Clear validation cache
     */
    clearCache() {
        this.validationCache.clear();
    }

    /**
     * Get available schemas
     */
    getSchemaNames() {
        return Object.keys(this.schemas);
    }
}

module.exports = { SchemaValidator };