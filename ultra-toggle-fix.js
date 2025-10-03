// Ultra-simple toggle fix - overrides everything
console.log('🚨 Loading ultra-simple toggle fix');

// Wait for page to be fully loaded
window.addEventListener('load', function() {
    console.log('🚨 Page loaded, setting up toggles');
    
    setTimeout(function() {
        console.log('🚨 Delayed setup starting...');
        
        // Menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const menuBar = document.getElementById('menu-bar');
        
        if (menuToggle && menuBar) {
            console.log('🚨 Setting up menu toggle');
            
            // Override onclick directly
            menuToggle.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚨 MENU CLICKED!');
                
                if (menuBar.classList.contains('collapsed')) {
                    menuBar.classList.remove('collapsed');
                    console.log('🚨 Menu expanded');
                } else {
                    menuBar.classList.add('collapsed');
                    console.log('🚨 Menu collapsed');
                }
                return false;
            };
            
            // Also add event listener as backup
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚨 MENU EVENT LISTENER FIRED');
                
                if (menuBar.classList.contains('collapsed')) {
                    menuBar.classList.remove('collapsed');
                    console.log('🚨 Menu expanded (listener)');
                } else {
                    menuBar.classList.add('collapsed');
                    console.log('🚨 Menu collapsed (listener)');
                }
            }, true); // Use capture phase
            
            console.log('🚨 Menu toggle setup complete');
        } else {
            console.error('🚨 Menu elements not found:', {
                menuToggle: !!menuToggle,
                menuBar: !!menuBar
            });
        }
        
        // Explorer toggle
        const explorerToggle = document.getElementById('explorer-toggle');
        const fileExplorer = document.getElementById('file-explorer');
        
        if (explorerToggle && fileExplorer) {
            console.log('🚨 Setting up explorer toggle');
            
            // Override onclick directly
            explorerToggle.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚨 EXPLORER CLICKED!');
                
                if (fileExplorer.classList.contains('pinned')) {
                    fileExplorer.classList.remove('pinned');
                    fileExplorer.classList.add('collapsed');
                    explorerToggle.textContent = '📌';
                    explorerToggle.title = 'Pin Explorer';
                    console.log('🚨 Explorer unpinned');
                } else {
                    fileExplorer.classList.add('pinned');
                    fileExplorer.classList.remove('collapsed');
                    explorerToggle.textContent = '📍';
                    explorerToggle.title = 'Unpin Explorer';
                    console.log('🚨 Explorer pinned');
                }
                return false;
            };
            
            // Also add event listener as backup
            explorerToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚨 EXPLORER EVENT LISTENER FIRED');
                
                if (fileExplorer.classList.contains('pinned')) {
                    fileExplorer.classList.remove('pinned');
                    fileExplorer.classList.add('collapsed');
                    explorerToggle.textContent = '📌';
                    explorerToggle.title = 'Pin Explorer';
                    console.log('🚨 Explorer unpinned (listener)');
                } else {
                    fileExplorer.classList.add('pinned');
                    fileExplorer.classList.remove('collapsed');
                    explorerToggle.textContent = '📍';
                    explorerToggle.title = 'Unpin Explorer';
                    console.log('🚨 Explorer pinned (listener)');
                }
            }, true); // Use capture phase
            
            console.log('🚨 Explorer toggle setup complete');
        } else {
            console.error('🚨 Explorer elements not found:', {
                explorerToggle: !!explorerToggle,
                fileExplorer: !!fileExplorer
            });
        }
        
        console.log('🚨 Ultra-simple toggle setup complete');
        
    }, 500); // Wait 500ms after page load
    
}, false);

// Also try on DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚨 DOM ready, trying backup setup');
    
    setTimeout(function() {
        // Force setup regardless
        const menuToggle = document.getElementById('menu-toggle');
        const menuBar = document.getElementById('menu-bar');
        const explorerToggle = document.getElementById('explorer-toggle');
        const fileExplorer = document.getElementById('file-explorer');
        
        if (menuToggle && menuBar) {
            menuToggle.style.pointerEvents = 'auto';
            menuToggle.style.cursor = 'pointer';
        }
        
        if (explorerToggle && fileExplorer) {
            explorerToggle.style.pointerEvents = 'auto';
            explorerToggle.style.cursor = 'pointer';
        }
        
        console.log('🚨 Backup setup complete');
    }, 2000);
});

console.log('🚨 Ultra-simple toggle fix loaded');