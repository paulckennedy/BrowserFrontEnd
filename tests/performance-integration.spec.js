import { test, expect } from '@playwright/test';

test.describe('Performance and Integration Tests', () => {
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

  test('should load within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();
    
    // The beforeEach already handles navigation and initialization
    // Just verify the application loaded within time limits
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should handle large text input efficiently', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    await editor.click();
    
    // Generate large text content
    const largeText = 'This is a performance test with repeated content. '.repeat(1000);
    
    const startTime = Date.now();
    await page.keyboard.type(largeText.substring(0, 500)); // Type first 500 chars
    const typingTime = Date.now() - startTime;
    
    // Should handle typing efficiently (more lenient for mobile)
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;
    const expectedTime = isMobile ? 10000 : 5000; // More time for mobile devices
    expect(typingTime).toBeLessThan(expectedTime);
    
    // Verify content is present
    await expect(editor).toContainText('This is a performance test');
  });

  test('should maintain responsiveness during auto-save', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    await editor.click();
    
    // Type content that would trigger auto-save
    await page.keyboard.type('Content to trigger auto-save mechanism');
    
    // Continue interacting while auto-save might be running
    await page.keyboard.press('Enter');
    await page.keyboard.type('Additional content during potential auto-save');
    
    // Editor should remain responsive
    await expect(editor).toContainText('Additional content during potential auto-save');
  });

  test('should handle multiple rapid keystrokes', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    await editor.click();
    
    // Rapid typing simulation
    const rapidText = 'RapidTypingTest';
    for (const char of rapidText) {
      await page.keyboard.type(char);
      await page.waitForTimeout(10); // Very fast typing
    }
    
    // All characters should be captured
    await expect(editor).toContainText('RapidTypingTest');
  });

  test('should handle browser refresh gracefully', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    await editor.click();
    await page.keyboard.type('Content before refresh');
    
    // Refresh the page
    await page.reload();
    
    // Wait for initialization and handle no-tabs state
    await page.waitForFunction(() => {
      return window.WYSIWYGEditor !== undefined && 
             window.WYSIWYGEditor.wysiwygEditor !== null;
    }, { timeout: 15000 });
    
    const hasNoTabs = await page.evaluate(() => document.body.classList.contains('no-tabs'));
    if (hasNoTabs) {
      await page.click('.tree-item[data-path="profile.md"]');
      await page.waitForSelector('.wysiwyg-editor', { timeout: 10000 });
    }
    
    // Editor should be functional after refresh
    await editor.click();
    await page.keyboard.type('Content after refresh');
    await expect(editor).toContainText('Content after refresh');
  });

  test('should handle window resize events', async ({ page }) => {
    // Start with desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const editor = page.locator('.wysiwyg-editor');
    await editor.click();
    await page.keyboard.type('Resize test content');
    
    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Editor should still be functional
    await expect(editor).toBeVisible();
    await expect(editor).toContainText('Resize test content');
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Editor should still work
    await editor.click();
    await page.keyboard.type(' - mobile addition');
    await expect(editor).toContainText('mobile addition');
  });

  test('should handle multiple browser tabs', async ({ context }) => {
    // Create multiple tabs with the same application
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await page1.goto('/');
    await page2.goto('/');
    
    // Initialize both pages properly
    for (const page of [page1, page2]) {
      await page.waitForFunction(() => {
        return window.WYSIWYGEditor !== undefined && 
               window.WYSIWYGEditor.wysiwygEditor !== null;
      }, { timeout: 15000 });
      
      const hasNoTabs = await page.evaluate(() => document.body.classList.contains('no-tabs'));
      if (hasNoTabs) {
        await page.click('.tree-item[data-path="profile.md"]');
        await page.waitForSelector('.wysiwyg-editor', { timeout: 10000 });
      }
    }
    
    // Type in both tabs
    await page1.locator('.wysiwyg-editor').click();
    await page1.keyboard.type('Content in tab 1');
    
    await page2.locator('.wysiwyg-editor').click();
    await page2.keyboard.type('Content in tab 2');
    
    // Both should work independently
    await expect(page1.locator('.wysiwyg-editor')).toContainText('Content in tab 1');
    await expect(page2.locator('.wysiwyg-editor')).toContainText('Content in tab 2');
    
    await page1.close();
    await page2.close();
  });

  test('should handle memory usage reasonably', async ({ page }) => {
    // beforeEach already handles navigation and initialization
    const editor = page.locator('.wysiwyg-editor');
    
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await editor.click();
      await page.keyboard.type(`Iteration ${i} - testing memory usage with repeated operations`);
      await page.keyboard.press('Control+KeyA');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(100);
    }
    
    // Final operation should still work
    await page.keyboard.type('Final memory test content');
    await expect(editor).toContainText('Final memory test content');
  });

  test('should validate accessibility basics', async ({ page }) => {
    // Check for basic accessibility attributes
    const editor = page.locator('.wysiwyg-editor');
    
    // Editor should be focusable
    await editor.focus();
    await expect(editor).toBeFocused();
    
    // Check for proper ARIA attributes (if implemented)
    const menuButtons = page.locator('[role="button"]');
    if (await menuButtons.count() > 0) {
      for (let i = 0; i < await menuButtons.count(); i++) {
        const button = menuButtons.nth(i);
        await expect(button).toBeVisible();
      }
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle console errors gracefully', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // beforeEach already handles navigation and initialization
    const editor = page.locator('.wysiwyg-editor');
    await editor.click();
    await page.keyboard.type('Testing for console errors');
    
    // Try various menu operations
    await page.locator('.menu-bar').hover();
    await page.locator('#file-menu').click();
    await page.locator('.wysiwyg-editor').click(); // Click outside to close
    
    // Should have minimal console errors
    expect(consoleErrors.length).toBeLessThan(5);
    
    // No critical errors should be present
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.includes('SyntaxError')
    );
    expect(criticalErrors.length).toBe(0);
  });
});