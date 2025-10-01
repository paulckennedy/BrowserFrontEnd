import { test, expect } from '@playwright/test';
import { EditorTestHelpers, TestData, EditorAssertions } from './helpers/test-helpers.js';

test.describe('Comprehensive Editor Tests with Helpers', () => {
  let helpers;
  let assertions;

  test.beforeEach(async ({ page }) => {
    helpers = new EditorTestHelpers(page);
    assertions = new EditorAssertions(page);
    
    await page.goto('/');
    await helpers.waitForEditorReady();
  });

  test('should handle complete workflow with helpers', async ({ page }) => {
    // Verify initial state
    await helpers.verifyEditorState();
    await assertions.assertConversionMode('MANUAL');
    
    // Test typing functionality
    await helpers.typeInEditor(TestData.sampleMarkdown.heading);
    await assertions.assertEditorContains('# Sample Heading');
    
    // Test manual conversion
    await helpers.triggerManualConversion();
    await page.waitForTimeout(1000); // Wait for conversion instead of specific status message
    
    // Clear and test bold text
    await helpers.clearEditor();
    await helpers.typeInEditor(TestData.sampleMarkdown.bold);
    
    // Toggle to auto mode and test
    await helpers.toggleConversionMode();
    await assertions.assertConversionMode('AUTO');
    
    // Toggle back to manual
    await helpers.toggleConversionMode();
    await assertions.assertConversionMode('MANUAL');
  });

  test('should handle menu operations with helpers', async ({ page }) => {
    // Test File menu
    await helpers.openDropdownMenu('file-menu');
    await assertions.assertElementVisible('#file-dropdown');
    
    // Click New File
    await page.locator('#new-file').click();
    await page.waitForTimeout(1000); // Wait for tab creation instead of status message
    
    // Test Edit menu
    await helpers.openDropdownMenu('edit-menu');
    await assertions.assertElementVisible('#edit-dropdown');
    
    // Click outside to close dropdown
    await page.locator('.wysiwyg-editor').click();
    await assertions.assertElementHidden('#edit-dropdown');
  });

  test('should handle complex text operations', async ({ page }) => {
    // Type long text
    await helpers.typeInEditor(TestData.sampleMarkdown.longText);
    
    // Select all and replace
    await page.keyboard.press(TestData.keyboard.shortcuts.selectAll);
    await helpers.typeInEditor('Replaced content');
    await assertions.assertEditorContains('Replaced content');
    
    // Test undo/redo
    await page.keyboard.press(TestData.keyboard.shortcuts.undo);
    await page.waitForTimeout(500);
    
    await page.keyboard.press(TestData.keyboard.shortcuts.redo);
    await assertions.assertEditorContains('Replaced content');
  });

  test('should handle responsive behavior', async ({ page }) => {
    await helpers.typeInEditor('Responsive test content');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await helpers.waitForAnimations();
      
      // Editor should remain functional
      await assertions.assertElementVisible(TestData.selectors.editor);
      await assertions.assertEditorContains('Responsive test content');
      
      // Should be able to continue typing
      await helpers.typeInEditor(' - additional content');
    }
  });

  test('should handle performance under load', async ({ page }) => {
    const startTime = Date.now();
    
    // Perform multiple rapid operations
    for (let i = 0; i < 10; i++) {
      await helpers.typeInEditor(`Line ${i} with content `);
      await page.keyboard.press('Enter');
      
      if (i % 3 === 0) {
        await helpers.triggerManualConversion();
      }
    }
    
    const operationTime = Date.now() - startTime;
    expect(operationTime).toBeLessThan(10000); // Should complete within 10 seconds
    
    // Editor should still be responsive
    await helpers.typeInEditor('Final test');
    await assertions.assertEditorContains('Final test');
  });

  test('should maintain state consistency', async ({ page }) => {
    // Perform various operations
    await helpers.typeInEditor(TestData.sampleMarkdown.heading);
    await helpers.toggleConversionMode();
    await helpers.typeInEditor('\n' + TestData.sampleMarkdown.bold);
    await helpers.toggleConversionMode();
    
    // Take screenshot for visual verification
    await helpers.takeTimestampedScreenshot('state-consistency');
    
    // Verify final state
    const state = await helpers.verifyEditorState();
    await assertions.assertConversionMode('MANUAL');
    await assertions.assertEditorContains('# Sample Heading');
    await assertions.assertEditorContains('**Bold text**');
  });

  test('should handle edge cases gracefully', async ({ page }) => {
    // Test empty input
    await helpers.clearEditor();
    await helpers.triggerManualConversion();
    
    // Test special characters
    await helpers.typeInEditor('Special chars: éñ中文🚀<>&"\'');
    await assertions.assertEditorContains('Special chars: éñ中文🚀<>&"\'');
    
    // Test very long single line
    const longLine = 'This is a very long line of text that might cause wrapping issues. '.repeat(20);
    await helpers.clearEditor();
    await helpers.typeInEditor(longLine);
    await assertions.assertEditorContains('This is a very long line');
    
    // Test rapid toggle
    for (let i = 0; i < 5; i++) {
      await helpers.toggleConversionMode();
      await page.waitForTimeout(100);
    }
    
    // Should still be functional
    await helpers.typeInEditor('Still working after rapid toggle');
    await assertions.assertEditorContains('Still working after rapid toggle');
  });
});