// Enhanced debug menu functionality - Complete override
(function() {
    'use strict';
    
    console.log('🔧 Debug menu script loading...');
    
    // Override any existing menu functionality
    window.initializeMenus = null;
    window.initializeDropdowns = null;
    
    function forceSetupMenus() {
        console.log('🔧 Force setting up debug menus...');
        
        const menuButtons = document.querySelectorAll('.nav-btn');
        const dropdowns = document.querySelectorAll('.dropdown');
        
        console.log(`🔧 Found ${menuButtons.length} menu buttons and ${dropdowns.length} dropdowns`);
        
        if (menuButtons.length === 0) {
            console.warn('🔧 No menu buttons found, retrying in 500ms...');
            setTimeout(forceSetupMenus, 500);
            return;
        }
        
        // Force remove ALL existing event listeners by replacing elements
        menuButtons.forEach((button, index) => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            console.log(`🔧 Force cloned button ${index}: ${newButton.textContent}`);
        });
        
        // Get completely fresh references
        const freshButtons = document.querySelectorAll('.nav-btn');
        const freshDropdowns = document.querySelectorAll('.dropdown');
        
        console.log(`🔧 Fresh elements: ${freshButtons.length} buttons, ${freshDropdowns.length} dropdowns`);
        
        // Add our ONLY event listeners
        freshButtons.forEach((button, index) => {
            const dropdown = freshDropdowns[index];
            
            if (!dropdown) {
                console.warn(`🔧 No dropdown found for button ${index}`);
                return;
            }
            
            console.log(`🔧 Setting up button ${index}: "${button.textContent}" -> "${dropdown.id}"`);
            
            // FORCE the click handler
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`🔧 CLICK DETECTED: ${button.textContent}`);
                
                // Close all other dropdowns FIRST
                freshDropdowns.forEach((otherDropdown, otherIndex) => {
                    if (otherIndex !== index) {
                        otherDropdown.classList.remove('show');
                        otherDropdown.style.cssText = 'opacity: 0 !important; visibility: hidden !important; display: none !important;';
                        console.log(`🔧 Force closed dropdown ${otherIndex}`);
                    }
                });
                
                // Toggle current dropdown with FORCE
                const isVisible = dropdown.classList.contains('show');
                if (isVisible) {
                    dropdown.classList.remove('show');
                    dropdown.style.cssText = 'opacity: 0 !important; visibility: hidden !important; display: none !important;';
                    console.log(`🔧 FORCE CLOSED dropdown ${index}`);
                } else {
                    dropdown.classList.add('show');
                    dropdown.style.cssText = 'opacity: 1 !important; visibility: visible !important; display: block !important; position: absolute !important; z-index: 1000 !important; background: white !important; border: 1px solid #ccc !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;';
                    console.log(`🔧 FORCE OPENED dropdown ${index}`);
                }
                
                return false;
            };
            
            // Also add addEventListener as backup
            button.addEventListener('click', button.onclick, true);
        });
        
        // Force close dropdowns when clicking outside
        document.onclick = function(e) {
            if (!e.target.closest('.nav-group')) {
                console.log('🔧 Outside click detected');
                freshDropdowns.forEach((dropdown, index) => {
                    dropdown.classList.remove('show');
                    dropdown.style.cssText = 'opacity: 0 !important; visibility: hidden !important; display: none !important;';
                    console.log(`🔧 Force closed dropdown ${index} (outside click)`);
                });
            }
        };
        
        console.log('🔧 FORCE MENU SETUP COMPLETE!');
    }
    
    // Multiple aggressive initialization attempts
    console.log('🔧 Starting multiple initialization attempts...');
    
    // Immediate
    forceSetupMenus();
    
    // DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceSetupMenus);
    }
    
    // Window load
    window.addEventListener('load', forceSetupMenus);
    
    // Delayed attempts to override other scripts
    setTimeout(forceSetupMenus, 100);
    setTimeout(forceSetupMenus, 500);
    setTimeout(forceSetupMenus, 1000);
    setTimeout(forceSetupMenus, 2000);
    setTimeout(forceSetupMenus, 3000);
    
    console.log('🔧 Debug menu script loaded with force override');
})();