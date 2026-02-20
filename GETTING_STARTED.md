# Learn Area Manager - Getting Started

## Installation & Setup

1. **Install Dependencies**
   ```bash
   cd learn-area-manager
   npm install
   ```

2. **Compile the Extension**
   ```bash
   npm run compile
   ```

3. **Run the Extension**
   - Press `F5` in VS Code to open a new Extension Development Host window
   - Or use the "Run Extension" launch configuration from the debug panel

## Testing the Extension

1. Open the `sample.md` file in the Extension Development Host window
2. You should see folding indicators (▼/▶) appear next to section headers

## Features Overview

### 1. Folding Sections
- Click the folding indicator (▼) in the left gutter to collapse a section
- Click (▶) to expand it again
- Works for:
  - Monikers: `::: moniker range="name"`
  - Zone Pivots: `:::zone pivot="name"`
  - Tabs: `# [Label](#tab/id)`

### 2. Hover Previews
- Hover over a collapsed section's start line to see a preview tooltip
- Shows up to 20 lines of content
- Displays the section type and name

### 3. Keyboard Shortcuts
- `Ctrl+Alt+[` (Mac: `Cmd+Alt+[`) - Toggle current section
- `Ctrl+Alt+]` (Mac: `Cmd+Alt+]`) - Expand current section  
- `Ctrl+Alt+F` (Mac: `Cmd+Alt+F`) - Focus on section (opens picker)

### 4. Context Menu
Right-click in a markdown file to access "Learn Area Manager":
- **Toggle Current Section** - Collapse/expand the section at cursor
- **Expand Named Section** - Expand all sections with the same name/type
- **Collapse Named Section** - Collapse all sections with the same name/type
- **Expand All Sections** - Expand everything in the document
- **Collapse All Sections** - Collapse everything in the document

### 5. Focus Mode
- Open Command Palette (`Ctrl+Shift+P`)
- Type "Learn Area Manager: Focus on Section"
- Select a section type/name from the list
- All sections of that type/name expand, others collapse

### 6. Background Colors (Optional)
- Enable via settings: `learnAreaManager.enableDecorations: true`
- Or use Command Palette: "Learn Area Manager: Toggle Section Background Colors"
- Each section type gets a subtle background color:
  - Monikers: Blue tint
  - Zone Pivots: Green tint
  - Tabs: Pink tint
- Adjust opacity: `learnAreaManager.decorationOpacity` (0.01-0.3)

## Configuration

Add to your `settings.json`:

```json
{
  "learnAreaManager.enableDecorations": false,
  "learnAreaManager.decorationOpacity": 0.05
}
```

## Development Commands

- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode for development
- `npm run lint` - Run ESLint
- `npm run package` - Package for production
- `npm test` - Run tests (after implementing tests)

## Project Structure

```
learn-area-manager/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── learnSectionParser.ts     # Parse markdown sections
│   ├── learnFoldingProvider.ts   # Provide folding ranges
│   ├── learnHoverProvider.ts     # Provide hover tooltips
│   ├── learnFoldingCommands.ts   # Command implementations
│   └── learnDecorationManager.ts # Background color decorations
├── sample.md                      # Sample markdown for testing
├── package.json                   # Extension manifest
├── tsconfig.json                  # TypeScript configuration
└── webpack.config.js              # Webpack bundling config
```

## How It Works

### Section Detection
The extension uses regex patterns to detect three types of Learn sections:

1. **Monikers**: Matches `::: moniker range="..."` and `::: moniker-end`
2. **Zone Pivots**: Matches `:::zone pivot="..."` and `::: zone-end`
3. **Tabs**: Matches `# [Label](#tab/id)` with `---` or next tab as end

### Folding Provider
Implements `vscode.FoldingRangeProvider` to tell VS Code where sections can fold.

### Hover Provider
Implements `vscode.HoverProvider` to show content previews when hovering over collapsed sections.

### Commands
Uses VS Code's command system to manipulate folding state programmatically.

### Decorations
Uses `TextEditorDecorationType` with theme-aware colors (light/dark mode support).

## Next Steps

### Potential Enhancements
1. Add support for other Learn markdown extensions
2. Implement unit tests for parser
3. Add configuration for custom section colors
4. Support for custom regex patterns
5. Minimap indicators for sections
6. Status bar showing current section info
7. Breadcrumb integration

### Known Limitations
- Folding indicators are VS Code's standard ones (can't customize the +/- icons)
- Background colors are optional and disabled by default
- Nested sections may have complex folding behavior

## Publishing

To publish to VS Code Marketplace:

1. Update `publisher` in package.json
2. Create an icon (128x128 PNG)
3. Install vsce: `npm install -g @vscode/vsce`
4. Package: `vsce package`
5. Publish: `vsce publish`

## Support

For issues or feature requests, please file an issue in the repository.

## License

MIT License - See LICENSE file for details.
