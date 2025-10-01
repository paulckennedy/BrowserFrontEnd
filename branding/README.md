# Branding System

This directory contains the branding configuration and assets for the MarkdownEditor application.

## Configuration

### branding.json
The main branding configuration file that defines:
- Application name, version, and metadata
- UI text content (menu titles, empty state messages)
- Color scheme and theming
- Asset paths and icons
- Metadata for SEO and browser integration

## Usage

The branding system is automatically loaded when the application starts. To customize the branding:

1. Edit `branding.json` to update text, colors, and asset paths
2. Add custom assets (logos, icons, images) to this directory
3. Reference the assets in the JSON configuration
4. The application will automatically apply the branding on load

## Asset Guidelines

- **Logo**: SVG format recommended for scalability (logo.svg)
- **Favicon**: ICO format for broad browser support (favicon.ico) 
- **Icons**: Use emoji or SVG for consistency
- **Images**: PNG or JPG for photos, SVG for graphics

## Color Scheme

The branding system supports custom color variables:
- `primary`: Main brand color
- `secondary`: Secondary brand color  
- `accent`: Accent/highlight color
- `background`: Default background color
- `emptyStateBackground`: Background when no tabs are open

## Customization Examples

### Changing the Application Name
```json
{
  "application": {
    "name": "MyEditor",
    "fullName": "My Custom Markdown Editor"
  }
}
```

### Custom Empty State Message
```json
{
  "ui": {
    "emptyState": {
      "message": "Welcome! Start by opening a document",
      "subtitle": "Choose a file from the explorer to begin editing"
    }
  }
}
```

### Brand Colors
```json
{
  "ui": {
    "colors": {
      "primary": "#007acc",
      "secondary": "#005a9e", 
      "accent": "#ff6b35"
    }
  }
}
```

## Fallback Behavior

If the branding configuration fails to load, the application will use sensible defaults to ensure functionality is not impacted.