// Complete menu and explorer fix - handles both dropdowns and toggles
console.log('🚀 Menu fix script starting...');

// Direct toggle functions for menu bar and file explorer
function toggleMenuDirect() {
    console.log('🔧 Direct menu toggle called');
    const menuBar = document.getElementById('menu-bar');
    if (menuBar) {
        const wasCollapsed = menuBar.classList.contains('collapsed');
        if (wasCollapsed) {
            menuBar.classList.remove('collapsed');
            console.log('🔧 Menu expanded');
        } else {
            menuBar.classList.add('collapsed');
            console.log('� Menu collapsed');
        }
    } else {
        console.error('🔧 Menu bar not found');
    }
}

function toggleExplorerDirect() {
    console.log('🔧 Direct explorer toggle called');
    const fileExplorer = document.getElementById('file-explorer');
    const toggleBtn = document.getElementById('explorer-toggle');
    
    if (fileExplorer && toggleBtn) {
        const wasPinned = fileExplorer.classList.contains('pinned');
        
        if (wasPinned) {
            // Unpin: remove pinned class and add collapsed
            fileExplorer.classList.remove('pinned');
            fileExplorer.classList.add('collapsed'); 
            toggleBtn.textContent = '📌';
            toggleBtn.title = 'Pin Explorer (stay open)';
            console.log('🔧 Explorer unpinned');
        } else {
            // Pin: add pinned class and remove collapsed
            fileExplorer.classList.add('pinned');
            fileExplorer.classList.remove('collapsed');
            toggleBtn.textContent = '📍';
            toggleBtn.title = 'Unpin Explorer (auto-collapse)';
            console.log('🔧 Explorer pinned');
        }
    } else {
        console.error('🔧 File explorer or toggle button not found', {
            fileExplorer: !!fileExplorer,
            toggleBtn: !!toggleBtn
        });
    }
}

// Setup toggle button listeners
function setupToggleListeners() {
    console.log('🔧 Setting up toggle listeners');
    
    const menuToggle = document.getElementById('menu-toggle');
    const explorerToggle = document.getElementById('explorer-toggle');
    
    if (menuToggle) {
        // Remove any existing listeners by cloning the element
        const newMenuToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);
        
        newMenuToggle.addEventListener('click', (e) => {
            console.log('🔧 Menu toggle clicked');
            e.preventDefault();
            e.stopPropagation();
            toggleMenuDirect();
        });
        console.log('� Menu toggle listener added');
    } else {
        console.error('🔧 Menu toggle button not found');
    }
    
    if (explorerToggle) {
        // Remove any existing listeners by cloning the element
        const newExplorerToggle = explorerToggle.cloneNode(true);
        explorerToggle.parentNode.replaceChild(newExplorerToggle, explorerToggle);
        
        newExplorerToggle.addEventListener('click', (e) => {
            console.log('🔧 Explorer toggle clicked');
            e.preventDefault();
            e.stopPropagation();
            toggleExplorerDirect();
        });
        console.log('🔧 Explorer toggle listener added');
    } else {
        console.error('🔧 Explorer toggle button not found');
    }
}

// Setup dropdown menu functionality
function setupDropdownMenus() {
    console.log('🚀 Setting up dropdown menus...');
    
    // Find all menu buttons and dropdowns
    const buttons = document.querySelectorAll('.nav-btn');
    const dropdowns = document.querySelectorAll('.dropdown');
    
    console.log(`🚀 Found ${buttons.length} buttons and ${dropdowns.length} dropdowns`);
    
    if (buttons.length === 0) {
        console.log('🚀 No dropdown buttons found');
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
    
    console.log('🚀 Dropdown menu setup complete!');
}

// Main initialization function
function initializeMenuFix() {
    console.log('🚀 Initializing complete menu fix...');
    
    // Setup toggle button functionality
    setupToggleListeners();
    
    // Setup dropdown menu functionality
    setupDropdownMenus();
    
    console.log('🚀 Complete menu fix setup finished!');
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