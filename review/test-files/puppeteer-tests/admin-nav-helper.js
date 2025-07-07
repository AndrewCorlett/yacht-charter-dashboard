/**
 * Admin Navigation Helper
 * 
 * This script helps navigate to the admin configuration section
 * when the application loads.
 */

// Wait for the application to load
window.addEventListener('load', function() {
    console.log('🔧 Admin Navigation Helper loaded');
    
    // Function to navigate to admin section
    function navigateToAdmin() {
        // Try multiple methods to access the admin section
        
        // Method 1: Check if there's a sidebar with admin option
        const adminButtons = document.querySelectorAll('button, a, [role="button"]');
        for (let button of adminButtons) {
            const text = button.textContent?.toLowerCase() || '';
            if (text.includes('admin') || text.includes('config')) {
                console.log('🎯 Found admin button:', button);
                button.click();
                return true;
            }
        }
        
        // Method 2: Try to find navigation items
        const navItems = document.querySelectorAll('nav button, nav a, [role="navigation"] button, [role="navigation"] a');
        for (let item of navItems) {
            const text = item.textContent?.toLowerCase() || '';
            if (text.includes('admin') || text.includes('configuration')) {
                console.log('🎯 Found admin nav item:', item);
                item.click();
                return true;
            }
        }
        
        // Method 3: Look for sidebar items
        const sidebarItems = document.querySelectorAll('aside button, aside a, .sidebar button, .sidebar a');
        for (let item of sidebarItems) {
            const text = item.textContent?.toLowerCase() || '';
            if (text.includes('admin') || text.includes('config')) {
                console.log('🎯 Found admin sidebar item:', item);
                item.click();
                return true;
            }
        }
        
        console.log('❌ Could not find admin navigation automatically');
        return false;
    }
    
    // Auto-navigate to admin if URL hash is present
    if (window.location.hash === '#admin') {
        setTimeout(() => {
            const success = navigateToAdmin();
            if (success) {
                console.log('✅ Successfully navigated to admin section');
            } else {
                console.log('⚠️ Manual navigation required - look for "Admin" or "Configuration" in the sidebar');
            }
        }, 500);
    }
    
    // Make navigation function available globally
    window.navigateToAdmin = navigateToAdmin;
    
    // Log available navigation options
    setTimeout(() => {
        console.log('📋 Available navigation options:');
        const allButtons = document.querySelectorAll('button, a[href], [role="button"]');
        const navOptions = [];
        
        allButtons.forEach((btn, index) => {
            const text = btn.textContent?.trim();
            if (text && text.length > 0 && text.length < 50) {
                navOptions.push(`${index + 1}. ${text}`);
            }
        });
        
        if (navOptions.length > 0) {
            console.log(navOptions.slice(0, 10).join('\n'));
            if (navOptions.length > 10) {
                console.log(`... and ${navOptions.length - 10} more options`);
            }
        }
    }, 1000);
});

// Add manual navigation function
function manualNavigateToAdmin() {
    console.log('🔧 Manual admin navigation triggered');
    return window.navigateToAdmin ? window.navigateToAdmin() : false;
}

// Export for use in testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { navigateToAdmin, manualNavigateToAdmin };
}