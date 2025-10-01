import { test, expect } from '@playwright/test';

test.describe('UI Layout and Visual Tests', () => {
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
  });

  test('should have proper responsive layout', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const menuBar = page.locator('.menu-bar');
    const fileExplorer = page.locator('.file-explorer');
    const editor = page.locator('.wysiwyg-editor');
    const statusBar = page.locator('.status-bar');
    
    await expect(menuBar).toBeVisible();
    await expect(fileExplorer).toBeVisible();
    await expect(editor).toBeVisible();
    await expect(statusBar).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Elements should still be visible but may be reorganized
    await expect(editor).toBeVisible();
    await expect(statusBar).toBeVisible();
  });

  test('should show correct visual indicators', async ({ page }) => {
    // Check conversion mode indicator
    const conversionIndicator = page.locator('#conversion-mode-indicator');
    await expect(conversionIndicator).toBeVisible();
    await expect(conversionIndicator).toHaveCSS('background-color', 'rgb(40, 167, 69)'); // Green for manual
    
    // Check visual indicator for collapsed file explorer
    const fileExplorer = page.locator('.file-explorer.collapsed');
    await expect(fileExplorer).toBeVisible();
    
    // Check for collapsed menu visual indicator
    const menuBar = page.locator('.menu-bar.collapsed');
    await expect(menuBar).toBeVisible();
  });

  test('should have proper hover animations', async ({ page }) => {
    const menuBar = page.locator('.menu-bar');
    const fileExplorer = page.locator('.file-explorer');
    
    // Test menu bar hover
    await menuBar.hover();
    await page.waitForTimeout(400); // Wait for transition
    
    // Menu should expand
    const menuHeight = await menuBar.boundingBox();
    expect(menuHeight.height).toBeGreaterThan(8); // Should be more than collapsed height
    
    // Test file explorer hover
    await fileExplorer.hover();
    await page.waitForTimeout(400); // Wait for transition
    
    // Explorer should expand
    const explorerWidth = await fileExplorer.boundingBox();
    expect(explorerWidth.width).toBeGreaterThan(5); // Should be more than collapsed width
  });

  test('should maintain layout balance with gray spacers', async ({ page }) => {
    // Check that the layout has proper visual balance
    const browserWindow = page.locator('.browser-window');
    await expect(browserWindow).toBeVisible();
    
    // Verify right spacer exists (pseudo-element)
    const hasRightSpacer = await page.evaluate(() => {
      const element = document.querySelector('.browser-window');
      const afterStyle = window.getComputedStyle(element, '::after');
      return afterStyle.getPropertyValue('width') === '5px';
    });
    expect(hasRightSpacer).toBeTruthy();
    
    // Verify address bar spacers (only when tabs are open)
    const addressBar = page.locator('.address-bar');
    const hasTabsOpen = await page.evaluate(() => document.body.classList.contains('has-tabs'));
    
    if (hasTabsOpen) {
      await expect(addressBar).toBeVisible();
      
      const hasAddressBarSpacers = await page.evaluate(() => {
        const element = document.querySelector('.address-bar');
        const beforeStyle = window.getComputedStyle(element, '::before');
        const afterStyle = window.getComputedStyle(element, '::after');
        return beforeStyle.getPropertyValue('width') === '5px' && 
               afterStyle.getPropertyValue('width') === '5px';
      });
      expect(hasAddressBarSpacers).toBeTruthy();
    } else {
      // In no-tabs state, address bar is hidden - this is expected behavior
      await expect(addressBar).toBeHidden();
    }
  });

  test('should handle full-width editor layout', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    const editorContainer = page.locator('.wysiwyg-editor-container');
    
    await expect(editor).toBeVisible();
    await expect(editorContainer).toBeVisible();
    
    // Check if editor takes full width within its container
    const editorBox = await editor.boundingBox();
    const containerBox = await editorContainer.boundingBox();
    
    // Editor should be close to full width of container (accounting for padding)
    expect(editorBox.width).toBeGreaterThan(containerBox.width * 0.8);
  });

  test('should show proper status bar information', async ({ page }) => {
    const statusBar = page.locator('.status-bar');
    await expect(statusBar).toBeVisible();
    
    // Check for conversion mode indicator
    const conversionMode = page.locator('#conversion-mode-indicator');
    await expect(conversionMode).toBeVisible();
    await expect(conversionMode).toContainText(/MANUAL|AUTO/);
    
    // Status should show Ready or other status
    await expect(statusBar).toContainText(/Ready|Saved|Unsaved/);
  });

  test('should handle browser window controls', async ({ page }) => {
    // Check if browser-like controls are present
    const browserWindow = page.locator('.browser-window');
    await expect(browserWindow).toBeVisible();
    
    // Address bar visibility depends on tab state
    const addressBar = page.locator('.address-bar');
    const hasTabsOpen = await page.evaluate(() => document.body.classList.contains('has-tabs'));
    
    if (hasTabsOpen) {
      await expect(addressBar).toBeVisible();
    } else {
      // In no-tabs state, address bar is hidden - this is expected behavior
      await expect(addressBar).toBeHidden();
    }
    
    // Browser buttons (if implemented)
    const browserBtns = page.locator('.browser-btn');
    if (await browserBtns.count() > 0) {
      await expect(browserBtns.first()).toBeVisible();
    }
  });

  test('should maintain cross-browser compatibility', async ({ page, browserName }) => {
    // This test runs across different browsers defined in playwright.config.js
    
    const editor = page.locator('.wysiwyg-editor');
    const menuBar = page.locator('.menu-bar');
    const fileExplorer = page.locator('.file-explorer');
    
    // Core elements should be visible in all browsers
    await expect(editor).toBeVisible();
    await expect(menuBar).toBeVisible();
    await expect(fileExplorer).toBeVisible();
    
    // Test specific browser behavior
    if (browserName === 'firefox') {
      // Firefox-specific layout tests
      const body = page.locator('body');
      await expect(body).toHaveCSS('overflow-x', 'hidden');
    }
    
    // Type in editor to test basic functionality
    await editor.click();
    await page.keyboard.type('Cross-browser test content');
    await expect(editor).toContainText('Cross-browser test content');
  });
});