# Playwright Testing Suite for WYSIWYG Markdown Editor

## Overview

This comprehensive test suite uses Playwright to test the WYSIWYG Markdown Editor web interface. The tests cover functionality, performance, accessibility, and cross-browser compatibility.

## Test Structure

```
tests/
├── basic-functionality.spec.js     # Core application loading and UI tests
├── menu-functionality.spec.js      # Menu system and dropdown tests  
├── editor-functionality.spec.js    # Editor typing, conversion, shortcuts
├── ui-layout.spec.js               # Layout, responsive design, visual tests
├── performance-integration.spec.js # Performance and integration tests
├── comprehensive-workflow.spec.js  # End-to-end workflow tests
├── helpers/
│   └── test-helpers.js             # Utility functions and test helpers
└── config/
    └── test-config.js              # Environment configurations
```

## Test Categories

### 1. Basic Functionality Tests
- ✅ Application loading and initialization
- ✅ Core UI elements visibility
- ✅ Menu bar collapse/expand behavior
- ✅ File explorer collapse/expand behavior
- ✅ Conversion mode indicator display
- ✅ Gray spacer bars for visual balance

### 2. Menu Functionality Tests
- ✅ Menu bar hover expansion
- ✅ Dropdown menu opening/closing
- ✅ File menu operations (New, Open, Save, Export)
- ✅ Edit menu operations (Undo, Redo, Cut, Copy, Paste)
- ✅ View menu operations (Toggle Preview, Menu, Explorer)
- ✅ Keyboard shortcuts
- ✅ Click-outside-to-close behavior

### 3. Editor Functionality Tests
- ✅ Text input and typing
- ✅ Raw markdown preservation (manual mode)
- ✅ Manual markdown conversion (Ctrl+Enter)
- ✅ Auto-conversion mode toggle (Ctrl+Shift+C)
- ✅ Markdown tooltips on hover
- ✅ Link auto-completion
- ✅ Cursor position preservation
- ✅ Keyboard shortcuts
- ✅ Word count and status updates

### 4. UI Layout Tests
- ✅ Responsive design across viewports
- ✅ Visual indicators and animations
- ✅ Hover animations and transitions
- ✅ Layout balance with gray spacers
- ✅ Full-width editor layout
- ✅ Status bar information display
- ✅ Cross-browser compatibility

### 5. Performance & Integration Tests
- ✅ Load time performance
- ✅ Large text input handling
- ✅ Auto-save responsiveness
- ✅ Rapid keystroke handling
- ✅ Browser refresh handling
- ✅ Window resize events
- ✅ Multiple browser tabs
- ✅ Memory usage
- ✅ Basic accessibility
- ✅ Console error monitoring

### 6. Comprehensive Workflow Tests
- ✅ Complete user workflows
- ✅ State consistency
- ✅ Edge case handling
- ✅ Error recovery
- ✅ Performance under load

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Test Commands
```bash
# Run all tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests with debugging
npm run test:debug

# Show test report
npm run test:report
```

### Specific Test Categories
```bash
# Run basic functionality tests only
npx playwright test basic-functionality

# Run menu tests only
npx playwright test menu-functionality

# Run editor tests only
npx playwright test editor-functionality

# Run UI layout tests only
npx playwright test ui-layout

# Run performance tests only
npx playwright test performance-integration
```

### Browser-Specific Tests
```bash
# Run on Chrome only
npx playwright test --project=chromium

# Run on Firefox only
npx playwright test --project=firefox

# Run on Safari only
npx playwright test --project=webkit

# Run on mobile Chrome
npx playwright test --project="Mobile Chrome"
```

## Test Configuration

The tests are configured to run across multiple browsers and viewports:

- **Desktop Browsers**: Chrome, Firefox, Safari
- **Mobile Browsers**: Mobile Chrome, Mobile Safari
- **Viewports**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

## Test Helpers

The `EditorTestHelpers` class provides utility methods:

- `waitForEditorReady()` - Wait for complete editor initialization
- `expandMenuBar()` - Expand collapsed menu bar
- `openDropdownMenu(menuId)` - Open specific dropdown menu
- `typeInEditor(text)` - Type text in the editor
- `toggleConversionMode()` - Toggle between manual/auto conversion
- `triggerManualConversion()` - Trigger manual markdown conversion
- `waitForStatusMessage()` - Wait for specific status messages
- `takeTimestampedScreenshot()` - Capture screenshots with timestamps

## Test Data

The `TestData` object provides sample content:

```javascript
TestData.sampleMarkdown.heading  // '# Sample Heading'
TestData.sampleMarkdown.bold     // '**Bold text**'
TestData.sampleMarkdown.italic   // '*Italic text*'
TestData.sampleMarkdown.link     // '[Link text](https://example.com)'
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches

GitHub Actions workflow includes:
- Multi-browser testing
- Test result artifacts
- HTML test reports
- Screenshot and video capture on failures

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Reports include:
- ✅ Test results with pass/fail status
- 📊 Performance metrics
- 📸 Screenshots on failures
- 🎥 Video recordings of failed tests
- 📝 Detailed execution logs

## Debugging Tests

For debugging failing tests:

1. **Run in headed mode**: `npm run test:headed`
2. **Use debug mode**: `npm run test:debug`
3. **Check screenshots**: `test-results/screenshots/`
4. **Review video recordings**: `test-results/videos/`
5. **Examine console logs**: Available in test reports

## Best Practices

1. **Wait for initialization**: Always use `waitForEditorReady()`
2. **Handle animations**: Use `waitForAnimations()` for smooth transitions
3. **Verify state**: Use `verifyEditorState()` for consistency checks
4. **Use helpers**: Leverage the helper utilities for common operations
5. **Take screenshots**: Use `takeTimestampedScreenshot()` for visual verification
6. **Monitor console**: Check for JavaScript errors during tests

## Troubleshooting

### Common Issues

1. **Timeout errors**: Increase timeout values in `playwright.config.js`
2. **Element not found**: Ensure selectors match current DOM structure
3. **Flaky tests**: Add appropriate wait conditions and timeouts
4. **Cross-browser issues**: Check browser-specific CSS and JavaScript compatibility

### Debug Information

- Console logs are captured during test execution
- Screenshots are taken on test failures
- Video recordings are available for failed tests
- Network requests can be monitored if needed

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the helper utilities when possible
3. Add appropriate assertions
4. Include error handling
5. Test across multiple browsers
6. Update this documentation

## Coverage Areas

- ✅ **Functional Testing**: All user-facing features
- ✅ **UI Testing**: Layout, responsive design, animations
- ✅ **Performance Testing**: Load times, memory usage, responsiveness
- ✅ **Cross-browser Testing**: Chrome, Firefox, Safari, Mobile
- ✅ **Integration Testing**: Component interactions
- ✅ **Accessibility Testing**: Basic keyboard navigation and focus
- ✅ **Error Handling**: Graceful degradation and error recovery