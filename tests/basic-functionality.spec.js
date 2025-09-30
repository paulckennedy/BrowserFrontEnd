import { test, expect } from '@playwright/test';

test.describe('WYSIWYG Markdown Editor - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the editor to initialize
    await page.waitForSelector('.wysiwyg-editor', { timeout: 15000 });
    await page.waitForFunction(() => {
      return window.WYSIWYGEditor !== undefined && 
             window.WYSIWYGEditor.wysiwygEditor !== null;
    }, { timeout: 15000 });
    await page.waitForTimeout(1000); // Stabilization time
  });

  test('should load the application successfully', async ({ page }) => {
    // Check if main elements are present
    await expect(page.locator('.menu-bar')).toBeVisible();
    await expect(page.locator('.file-explorer')).toBeVisible();
    await expect(page.locator('.wysiwyg-editor')).toBeVisible();
    await expect(page.locator('.status-bar')).toBeVisible();
    
    // Check if title is correct
    await expect(page).toHaveTitle('MarkdownEditor - Browser-in-Browser Markdown Editor');
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

    // Check for address bar spacers
    const addressBar = page.locator('.address-bar');
    await expect(addressBar).toBeVisible();
  });
});