// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('BrowserFrontEnd project loaded successfully!');
    
    // Demo button functionality
    const demoButton = document.getElementById('demo-button');
    const demoOutput = document.getElementById('demo-output');
    
    if (demoButton && demoOutput) {
        demoButton.addEventListener('click', function() {
            // Check if AI integration is available
            if (window.aiIntegration && window.aiIntegration.isInitialized) {
                // Use AI integration for dynamic content
                const systemContext = window.aiIntegration.getSystemContext();
                const messages = [
                    'AI Integration is active! 🤖 Centralized prompts loaded successfully.',
                    'Ready for AI-powered features! Check prompts.json for available templates.',
                    `System context loaded: ${systemContext ? 'Connected' : 'Loading...'}`,
                    'AI-enhanced frontend development at your fingertips!',
                    `Prompt categories available: ${window.aiIntegration.getAvailableCategories().length} categories loaded.`
                ];
                
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                demoOutput.innerHTML = `<strong>AI Status:</strong> ${randomMessage}`;
            } else {
                // Fallback messages
                const messages = [
                    'Hello! This is a demo of JavaScript functionality.',
                    'The project is working correctly!',
                    'You can now start building your frontend application.',
                    'Modern web development at your fingertips!',
                    'Ready to create something amazing?'
                ];
                
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                demoOutput.textContent = randomMessage;
            }
            
            demoOutput.style.display = 'block';
            
            // Add some animation
            demoOutput.style.opacity = '0';
            setTimeout(() => {
                demoOutput.style.transition = 'opacity 0.5s ease';
                demoOutput.style.opacity = '1';
            }, 50);
        });
    }
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Dynamic greeting based on time of day
    function updateGreeting() {
        const hour = new Date().getHours();
        const homeSection = document.querySelector('#home h2');
        
        if (homeSection) {
            let greeting = 'Home';
            if (hour < 12) {
                greeting = 'Good Morning!';
            } else if (hour < 18) {
                greeting = 'Good Afternoon!';
            } else {
                greeting = 'Good Evening!';
            }
            homeSection.textContent = greeting;
        }
    }
    
    updateGreeting();
});

// AI Integration Event Listeners
document.addEventListener('aiIntegrationReady', function(event) {
    console.log('AI Integration is ready!', event.detail);
    
    // Example: Get a specific prompt
    const featurePrompt = window.aiIntegration.getPrompt('development', 'featureRequest', {
        feature_name: 'user authentication',
        description: 'allow users to sign up, log in, and manage their profiles'
    });
    
    if (featurePrompt) {
        console.log('Example AI Prompt Generated:', featurePrompt);
    }
    
    // Display available prompt categories in console for developers
    const categories = window.aiIntegration.getAvailableCategories();
    console.log('Available AI Prompt Categories:', categories);
});

// AI Helper Functions
const aiHelpers = {
    // Generate content using AI prompts
    generatePrompt: async function(category, type, variables = {}) {
        if (!window.aiIntegration || !window.aiIntegration.isInitialized) {
            console.warn('AI Integration not available');
            return null;
        }
        
        try {
            const result = await window.aiIntegration.generateContent(category, type, variables);
            return result;
        } catch (error) {
            console.error('Error generating AI content:', error);
            return null;
        }
    },
    
    // Quick access to common prompts
    getCodeReviewPrompt: function() {
        return window.aiIntegration?.getPrompt('system', 'codeReview');
    },
    
    getFeatureRequestPrompt: function(featureName, description) {
        return window.aiIntegration?.getPrompt('development', 'featureRequest', {
            feature_name: featureName,
            description: description
        });
    },
    
    // Debug helper
    listAllPrompts: function() {
        if (!window.aiIntegration) return {};
        
        const categories = window.aiIntegration.getAvailableCategories();
        const allPrompts = {};
        
        categories.forEach(category => {
            allPrompts[category] = window.aiIntegration.getPromptTypes(category);
        });
        
        return allPrompts;
    }
};

// Utility functions
const utils = {
    // Format date helper
    formatDate: function(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },
    
    // Simple validation helper
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Simple API call helper
    apiCall: async function(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
};

// Export utils for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
}