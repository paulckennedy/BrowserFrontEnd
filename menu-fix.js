// Standalone menu fix - Complete override
console.log('🚀 Menu fix script starting...');

// Wait for page to be fully loaded
function initializeMenuFix() {
    console.log('🚀 Initializing menu fix...');
    
    // Find all menu buttons and dropdowns
    const buttons = document.querySelectorAll('.nav-btn');
    const dropdowns = document.querySelectorAll('.dropdown');
    
    console.log(`🚀 Found ${buttons.length} buttons and ${dropdowns.length} dropdowns`);
    
    if (buttons.length === 0) {
        console.log('🚀 No buttons found, waiting...');
        setTimeout(initializeMenuFix, 100);
        return;
    }
    
    // Remove all existing event listeners by replacing elements
    buttons.forEach((button, index) => {
        const parent = button.parentNode;
        const newButton = button.cloneNode(true);
        parent.replaceChild(newButton, button);
    });
    
    // Get fresh references
    const freshButtons = document.querySelectorAll('.nav-btn');
    const freshDropdowns = document.querySelectorAll('.dropdown');
    
    // Setup click handlers
    freshButtons.forEach((button, index) => {
        const dropdown = freshDropdowns[index];
        
        if (!dropdown) {
            console.log(`🚀 No dropdown for button ${index}`);
            return;
        }
        
        console.log(`🚀 Setting up: ${button.textContent} -> ${dropdown.className}`);
        
        // Direct onclick assignment
        button.onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            console.log(`🚀 CLICKED: ${button.textContent}`);
            
            // Close all dropdowns first
            freshDropdowns.forEach((dd, i) => {
                if (i !== index) {
                    dd.style.display = 'none';
                    dd.classList.remove('show');
                }
            });
            
            // Toggle current dropdown
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
                dropdown.classList.remove('show');
                console.log(`🚀 CLOSED: ${dropdown.className}`);
            } else {
                dropdown.style.display = 'block';
                dropdown.style.position = 'absolute';
                dropdown.style.top = '100%';
                dropdown.style.left = '0';
                dropdown.style.backgroundColor = 'white';
                dropdown.style.border = '1px solid #ccc';
                dropdown.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                dropdown.style.zIndex = '9999';
                dropdown.style.minWidth = '150px';
                dropdown.classList.add('show');
                console.log(`🚀 OPENED: ${dropdown.className}`);
            }
            
            return false;
        };
    });
    
    // Close on outside click
    document.onclick = function(event) {
        if (!event.target.closest('.nav-group')) {
            freshDropdowns.forEach((dropdown) => {
                dropdown.style.display = 'none';
                dropdown.classList.remove('show');
            });
            console.log('🚀 Closed all dropdowns (outside click)');
        }
    };
    
    console.log('🚀 Menu setup complete!');
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMenuFix);
} else {
    initializeMenuFix();
}

window.addEventListener('load', initializeMenuFix);
setTimeout(initializeMenuFix, 500);
setTimeout(initializeMenuFix, 1000);

console.log('🚀 Menu fix script loaded');