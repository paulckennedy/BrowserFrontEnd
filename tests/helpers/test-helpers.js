/**
 * Test Helper Utilities for WYSIWYG Markdown Editor
 */
import { expect } from '@playwright/test';

export class EditorTestHelpers {
  constructor(page) {
    this.page = page;
  }

  /**
   * Wait for editor to be fully initialized
   */
  async waitForEditorReady() {
    // Wait for the main editor element
    await this.page.waitForSelector('.wysiwyg-editor', { timeout: 15000 });
    
    // Wait for the WYSIWYGEditor instance to be available
    await this.page.waitForFunction(() => {
      return window.WYSIWYGEditor !== undefined && 
             window.WYSIWYGEditor.wysiwygEditor !== null &&
             window.WYSIWYGEditor.wysiwygEditor !== undefined;
    }, { timeout: 15000 });
    
    // Wait for any async initialization to complete
    await this.page.waitForTimeout(1000);
    
    // Verify editor is actually ready to use
    await this.page.waitForFunction(() => {
      const editor = document.querySelector('.wysiwyg-editor');
      return editor && editor.style.display !== 'none';
    }, { timeout: 5000 });
  }

  /**
   * Expand the collapsed menu bar
   */
  async expandMenuBar() {
    const menuBar = this.page.locator('.menu-bar');
    await menuBar.hover();
    await this.page.waitForTimeout(300); // Wait for transition
    return menuBar;
  }

  /**
   * Expand the collapsed file explorer
   */
  async expandFileExplorer() {
    const fileExplorer = this.page.locator('.file-explorer');
    await fileExplorer.hover();
    await this.page.waitForTimeout(300); // Wait for transition
    return fileExplorer;
  }

  /**
   * Open a specific dropdown menu
   */
  async openDropdownMenu(menuId) {
    await this.expandMenuBar();
    
    // For mobile devices, force visibility if needed
    const viewport = this.page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;
    
    if (isMobile) {
      // On mobile, we need to ensure the menu is visible
      await this.page.locator(`#${menuId}`).waitFor({ state: 'attached' });
      await this.page.locator(`#${menuId}`).click({ force: true });
    } else {
      await this.page.locator(`#${menuId}`).click();
    }
    
    await this.page.waitForTimeout(200);
  }

  /**
   * Type text in the editor
   */
  async typeInEditor(text) {
    const editor = this.page.locator('.wysiwyg-editor');
    await editor.click();
    await this.page.keyboard.type(text);
    return editor;
  }

  /**
   * Clear editor content
   */
  async clearEditor() {
    const editor = this.page.locator('.wysiwyg-editor');
    await editor.click();
    await this.page.keyboard.press('Control+KeyA');
    await this.page.keyboard.press('Delete');
    return editor;
  }

  /**
   * Toggle conversion mode
   */
  async toggleConversionMode() {
    await this.page.keyboard.press('Control+Shift+KeyC');
    await this.page.waitForTimeout(500);
  }

  /**
   * Trigger manual conversion
   */
  async triggerManualConversion() {
    await this.page.keyboard.press('Control+Enter');
    await this.page.waitForTimeout(500);
  }

  /**
   * Get current conversion mode
   */
  async getConversionMode() {
    const indicator = this.page.locator('#conversion-mode-indicator');
    return await indicator.textContent();
  }

  /**
   * Wait for status message to appear
   */
  async waitForStatusMessage(expectedText, timeout = 5000) {
    const statusBar = this.page.locator('.status-bar');
    await statusBar.waitFor({ state: 'visible', timeout });
    
    if (expectedText) {
      await this.page.waitForFunction(
        (text) => document.querySelector('.status-bar').textContent.includes(text),
        expectedText,
        { timeout }
      );
    }
    
    return statusBar;
  }

  /**
   * Check if element has specific CSS class
   */
  async hasClass(selector, className) {
    const element = this.page.locator(selector);
    const classes = await element.getAttribute('class');
    return classes && classes.includes(className);
  }

  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Simulate file upload (if file input is present)
   */
  async uploadFile(filePath) {
    const fileInputs = this.page.locator('input[type="file"]');
    if (await fileInputs.count() > 0) {
      await fileInputs.first().setInputFiles(filePath);
    }
  }

  /**
   * Check console for specific message types
   */
  async getConsoleMessages(type = 'all') {
    const messages = [];
    
    this.page.on('console', msg => {
      if (type === 'all' || msg.type() === type) {
        messages.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return messages;
  }

  /**
   * Simulate network conditions
   */
  async setNetworkConditions(conditions) {
    const client = await this.page.context().newCDPSession(this.page);
    
    if (conditions === 'slow') {
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024, // 50 KB/s
        uploadThroughput: 20 * 1024,   // 20 KB/s
        latency: 500 // 500ms
      });
    } else if (conditions === 'offline') {
      await client.send('Network.emulateNetworkConditions', {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0
      });
    }
  }

  /**
   * Wait for animations to complete
   */
  async waitForAnimations() {
    await this.page.waitForTimeout(500);
    await this.page.waitForFunction(() => {
      const animations = document.getAnimations();
      return animations.every(animation => 
        animation.playState === 'finished' || 
        animation.playState === 'idle'
      );
    });
  }

  /**
   * Verify editor state consistency
   */
  async verifyEditorState() {
    const editor = this.page.locator('.wysiwyg-editor');
    const menuBar = this.page.locator('.menu-bar');
    const fileExplorer = this.page.locator('.file-explorer');
    const statusBar = this.page.locator('.status-bar');
    
    // All core elements should be present
    await expect(editor).toBeVisible();
    await expect(menuBar).toBeVisible();
    await expect(fileExplorer).toBeVisible();
    await expect(statusBar).toBeVisible();
    
    // Editor should be interactive
    await editor.click();
    await expect(editor).toBeFocused();
    
    return {
      editor,
      menuBar,
      fileExplorer,
      statusBar
    };
  }
}

/**
 * Custom test fixtures and data
 */
export const TestData = {
  sampleMarkdown: {
    heading: '# Sample Heading',
    bold: '**Bold text**',
    italic: '*Italic text*',
    code: '`inline code`',
    link: '[Link text](https://example.com)',
    list: '- List item 1\n- List item 2',
    longText: 'This is a longer piece of text that can be used for testing various editor functionalities, including word wrapping, selection, and performance with larger content blocks.'
  },
  
  keyboard: {
    shortcuts: {
      selectAll: 'Control+KeyA',
      copy: 'Control+KeyC',
      paste: 'Control+KeyV',
      undo: 'Control+KeyZ',
      redo: 'Control+KeyY',
      toggleConversion: 'Control+Shift+KeyC',
      manualConversion: 'Control+Enter'
    }
  },
  
  selectors: {
    editor: '.wysiwyg-editor',
    menuBar: '.menu-bar',
    fileExplorer: '.file-explorer',
    statusBar: '.status-bar',
    conversionIndicator: '#conversion-mode-indicator',
    fileMenu: '#file-menu',
    editMenu: '#edit-menu',
    viewMenu: '#view-menu'
  }
};

/**
 * Assertion helpers
 */
export class EditorAssertions {
  constructor(page) {
    this.page = page;
  }

  async assertEditorContains(text) {
    const editor = this.page.locator('.wysiwyg-editor');
    await expect(editor).toContainText(text);
  }

  async assertStatusMessage(expectedText) {
    const statusBar = this.page.locator('.status-bar');
    await expect(statusBar).toContainText(expectedText);
  }

  async assertConversionMode(mode) {
    const indicator = this.page.locator('#conversion-mode-indicator');
    await expect(indicator).toContainText(mode);
  }

  async assertElementVisible(selector) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async assertElementHidden(selector) {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }
}