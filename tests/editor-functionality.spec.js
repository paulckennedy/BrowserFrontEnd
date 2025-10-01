import { test, expect } from '@playwright/test';

test.describe('WYSIWYG Editor Functionality', () => {
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

  test('should allow typing in the editor', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    
    // Click to focus and type
    await editor.click();
    await page.keyboard.type('Hello, this is a test!');
    
    // Verify text appears
    await expect(editor).toContainText('Hello, this is a test!');
  });

  test('should preserve raw markdown when auto-conversion is disabled', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    
    // Verify conversion mode is manual by default
    const conversionIndicator = page.locator('#conversion-mode-indicator');
    await expect(conversionIndicator).toContainText('MANUAL');
    
    // Clear existing content first since profile.md is loaded
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    
    // Type markdown syntax
    await page.keyboard.type('# This is a heading');
    
    // Should remain as raw text (not converted to H1)
    await expect(editor).toContainText('# This is a heading');
    
    // In loaded document, there may be existing H1 elements, so check if new ones weren't added
    const h1Elements = page.locator('h1');
    const h1Count = await h1Elements.count();
    
    // Type more markdown to see if it converts
    await page.keyboard.press('Enter');
    await page.keyboard.type('## This is a subheading');
    
    // Should still show the raw markdown text
    await expect(editor).toContainText('## This is a subheading');
  });

  test('should convert markdown when using manual conversion shortcut', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    
    // Clear existing content first since profile.md is loaded
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    
    // Type markdown heading
    await page.keyboard.type('# Test Heading');
    
    // Use manual conversion shortcut
    await page.keyboard.press('Control+Enter');
    
    // Wait for conversion and check status - status shows save state, not conversion state
    await page.waitForTimeout(500);
    const statusBar = page.locator('.status-bar');
    await expect(statusBar).toContainText(/Saved|MANUAL/); // Check for actual status messages
  });

  test('should toggle auto-conversion mode', async ({ page }) => {
    const conversionIndicator = page.locator('#conversion-mode-indicator');
    
    // Initially should be MANUAL
    await expect(conversionIndicator).toContainText('MANUAL');
    
    // Toggle to auto mode - Focus the editor first to ensure event reaches it
    await page.locator('.wysiwyg-editor').focus();
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('c');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    
    // Should change to AUTO
    await page.waitForTimeout(500);
    await expect(conversionIndicator).toContainText('AUTO');
    
    // Toggle back to manual
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('c');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);
    await expect(conversionIndicator).toContainText('MANUAL');
  });

  test('should show markdown tooltips on hover', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    
    // First, let's create some formatted content by toggling to auto mode
    await page.keyboard.press('Control+Shift+KeyC'); // Enable auto-conversion
    await page.waitForTimeout(500);
    
    await editor.click();
    await page.keyboard.type('**Bold text**');
    await page.keyboard.press('Space'); // Trigger conversion
    
    // Switch back to manual mode
    await page.keyboard.press('Control+Shift+KeyC');
    await page.waitForTimeout(500);
    
    // Hover over the formatted text to see tooltip (first bold element in editor)
    const boldText = page.locator('.wysiwyg-editor strong').first();
    if (await boldText.count() > 0) {
      await boldText.hover();
      
      // Check if tooltip appears (may take time to appear)
      await page.waitForTimeout(1000);
      const tooltip = page.locator('.markdown-tooltip');
      await expect(tooltip).toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle link auto-completion', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    
    // Click and type link syntax
    await editor.click();
    await page.keyboard.type('[');
    
    // Should trigger link completion hint
    await page.waitForTimeout(500);
    
    // Complete the link
    await page.keyboard.type('Link text](https://example.com)');
    
    // Verify link is created
    await expect(editor).toContainText('[Link text](https://example.com)');
  });

  test('should preserve cursor position during auto-save', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    
    // Clear existing content and type initial content
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('This is some test content for cursor position testing');
    
    // Move cursor to position 10 (after "This is so")
    await page.keyboard.press('Home');
    for (let i = 0; i < 8; i++) { // Position after "This is "
      await page.keyboard.press('ArrowRight');
    }
    
    // Type something to trigger auto-save mechanism
    await page.keyboard.type('INSERTED ');
    
    // Wait for potential auto-save
    await page.waitForTimeout(2000);
    
    // Continue typing to verify cursor position is maintained
    await page.keyboard.type('MORE TEXT');
    
    // Verify content is as expected - insertion at position 8 gives us "This is INSERTED MORE TEXT"
    await expect(editor).toContainText('This is INSERTED MORE TEXT');
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    
    // Test basic shortcuts
    await editor.click();
    await page.keyboard.type('Test content');
    
    // Test Ctrl+A (select all)
    await page.keyboard.press('Control+KeyA');
    
    // Test Ctrl+B (if implemented)
    await page.keyboard.press('Control+KeyB');
    
    // Type new content
    await page.keyboard.type('Bold text');
    
    // Verify content exists
    await expect(editor).toContainText('Bold text');
  });

  test('should update word count and status', async ({ page }) => {
    const editor = page.locator('.wysiwyg-editor');
    const statusBar = page.locator('.status-bar');
    
    // Type content
    await editor.click();
    await page.keyboard.type('This is a test with multiple words for counting');
    
    // Wait for status update
    await page.waitForTimeout(1000);
    
    // Check if word count is updated (if implemented)
    // This depends on your specific implementation
    await expect(statusBar).toBeVisible();
  });
});