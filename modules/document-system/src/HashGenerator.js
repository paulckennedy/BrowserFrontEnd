/**
 * Hash Generator Utility
 * Generates secure 64-character hexadecimal hash IDs for system entities
 */

class HashGenerator {
    constructor() {
        this.usedHashes = new Set();
    }

    /**
     * Generate a cryptographically secure 64-character hex hash
     */
    generate() {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            // Browser environment
            return this.generateSecure();
        } else {
            // Node.js environment
            return this.generateNodeSecure();
        }
    }

    /**
     * Generate secure hash in browser environment
     */
    generateSecure() {
        const array = new Uint8Array(32); // 32 bytes = 256 bits
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate secure hash in Node.js environment
     */
    generateNodeSecure() {
        try {
            const crypto = require('crypto');
            return crypto.randomBytes(32).toString('hex');
        } catch (error) {
            // Fallback to pseudo-random if crypto is not available
            return this.generatePseudoRandom();
        }
    }

    /**
     * Fallback pseudo-random generator
     */
    generatePseudoRandom() {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
    }

    /**
     * Generate a unique hash (checks against previously generated hashes)
     */
    generateUnique() {
        let hash;
        let attempts = 0;
        const maxAttempts = 1000;

        do {
            hash = this.generate();
            attempts++;
            
            if (attempts > maxAttempts) {
                throw new Error('Unable to generate unique hash after maximum attempts');
            }
        } while (this.usedHashes.has(hash));

        this.usedHashes.add(hash);
        return hash;
    }

    /**
     * Validate hash format
     */
    static validate(hash) {
        if (typeof hash !== 'string') {
            return false;
        }

        if (hash.length !== 64) {
            return false;
        }

        return /^[0-9a-fA-F]{64}$/.test(hash);
    }

    /**
     * Generate hash from string content (deterministic)
     */
    async generateFromContent(content) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            // Browser environment with Web Crypto API
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = new Uint8Array(hashBuffer);
            return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback for environments without Web Crypto API
            return this.simpleHash(content);
        }
    }

    /**
     * Simple hash function for fallback
     */
    simpleHash(content) {
        let hash = 0;
        if (content.length === 0) return '0'.repeat(64);
        
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to positive and pad with zeros
        const hexHash = Math.abs(hash).toString(16);
        return hexHash.padStart(64, '0');
    }

    /**
     * Clear the used hashes set
     */
    clearUsedHashes() {
        this.usedHashes.clear();
    }

    /**
     * Get the count of used hashes
     */
    getUsedHashCount() {
        return this.usedHashes.size;
    }

    /**
     * Check if a hash has been used
     */
    isHashUsed(hash) {
        return this.usedHashes.has(hash);
    }
}

module.exports = { HashGenerator };