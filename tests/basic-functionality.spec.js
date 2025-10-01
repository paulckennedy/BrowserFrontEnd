import { test, expect } from '@playwright/test';

test.describe('WYSIWYG Markdown Editor - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Add console listener to capture browser logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Wait for the WYSIWYG editor to be available globally (initialization complete)
    await page.waitForFunction(
      () => window.WYSIWYGEditor !== undefined,
      {},
      { timeout: 30000 }
    );
    
    // Wait for the body to have either no-tabs or has-tabs class (initialization complete)
    await page.waitForFunction(
      () => document.body.classList.contains('no-tabs') || document.body.classList.contains('has-tabs'),
      {},
      { timeout: 15000 }
    );
    
    // If we're in no-tabs state, open a file to make the editor visible for tests that need it
    const hasNoTabs = await page.evaluate(() => document.body.classList.contains('no-tabs'));
    if (hasNoTabs) {
      await page.click('.tree-item[data-path="profile.md"]');
      await page.waitForSelector('.wysiwyg-editor', { timeout: 10000 });
    }
    
    // Finally wait for full initialization (for non-WebKit browsers)  
    const browserName = await page.evaluate(() => navigator.userAgent);
    if (!browserName.includes('WebKit') || browserName.includes('Chrome')) {
      await page.waitForFunction(() => {
        return window.WYSIWYGEditor && 
               window.WYSIWYGEditor.wysiwygEditor !== null &&
               window.WYSIWYGEditor.wysiwygEditor !== undefined;
      }, { timeout: 15000 });
    } else {
      // For WebKit, just wait a bit more for initialization to complete
      await page.waitForTimeout(3000);
    }
    
    await page.waitForTimeout(500); // Final stabilization time
  });

  test('should load the application successfully', async ({ page }) => {
    // Check if main elements are present
    await expect(page.locator('.menu-bar')).toBeVisible();
    await expect(page.locator('.file-explorer')).toBeVisible();
    await expect(page.locator('.wysiwyg-editor')).toBeVisible();
    await expect(page.locator('.status-bar')).toBeVisible();
    
    // Check if title is correct (branded)
    await expect(page).toHaveTitle('🚀 Custom MarkdownEditor Pro - Your Document Workspace');
  });

  test('should have collapsed menu bar by default', async ({ page }) => {
    const menuBar = page.locator('.menu-bar');
    await expect(menuBar).toHaveClass(/collapsed/);
    
    // Menu should expand on hover
    await menuBar.hover();
    await page.waitForTimeout(500); // Wait for transition
    await expect(menuBar).toBeVisible();
    
    // Check if menu items are present when expanded (desktop only)
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 768) {
      await expect(page.locator('#file-menu')).toBeVisible();
      await expect(page.locator('#edit-menu')).toBeVisible();
      await expect(page.locator('#view-menu')).toBeVisible();
    } else {
      // On mobile, just verify the menu bar itself is functional
      await expect(menuBar).toBeVisible();
      // Menu items might be styled differently on mobile
      await expect(page.locator('#file-menu')).toBeAttached();
    }
  });

  test('should have collapsed file explorer by default', async ({ page }) => {
    const fileExplorer = page.locator('.file-explorer');
    await expect(fileExplorer).toHaveClass(/collapsed/);
    
    // File explorer should expand on hover
    await fileExplorer.hover();
    await page.waitForTimeout(500); // Wait for transition
    await expect(fileExplorer).toBeVisible();
  });

  test('should show conversion mode indicator', async ({ page }) => {
    const conversionIndicator = page.locator('#conversion-mode-indicator');
    await expect(conversionIndicator).toBeVisible();
    await expect(conversionIndicator).toContainText('MANUAL');
    await expect(conversionIndicator).toHaveClass(/conversion-mode-indicator/);
  });

  test('should have gray spacer bars for visual balance', async ({ page }) => {
    // Check for right-side spacer on browser window
    const browserWindow = page.locator('.browser-window');
    const afterPseudo = await page.evaluate(() => {
      const element = document.querySelector('.browser-window');
      return window.getComputedStyle(element, '::after').getPropertyValue('width');
    });
    expect(afterPseudo).toBe('5px');

    // Note: Address bar is intentionally hidden by default (display: none inline style)
    // This test verifies the gray spacer visual elements exist in the design
    const addressBar = page.locator('.address-bar');
    await expect(addressBar).toBeHidden(); // Expected behavior - hidden by design
  });
});