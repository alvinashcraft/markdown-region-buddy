# Markdown Region Buddy - Getting Started

## Installation

### From the Visual Studio Marketplace

1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X`)
3. Search for **Markdown Region Buddy**
4. Click **Install**

### From a .vsix file

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run **Extensions: Install from VSIX...**
3. Browse to the `.vsix` file and click **Install**
4. Reload VS Code when prompted

## Setup (recommended)

### Set as default folding provider

Without this step, VS Code's built-in markdown folding can conflict with region folds — especially tab sections. To get the best experience:

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run **Markdown Region Buddy: Set as Default Folding Provider**
3. Click **Yes** when prompted

Alternatively, add this to your `settings.json`:

```json
"markdownRegionBuddy.overrideFoldingProvider": true
```

## Quick tour

### 1. Folding sections
- Click the folding indicator (▼) in the left gutter to collapse a section
- Click (▶) to expand it again
- Works for:
  - Monikers: `::: moniker range="name"`
  - Zone Pivots: `:::zone pivot="name"`
  - Tabs: `# [Label](#tab/id)`
  - Plus headings, fenced code blocks, tables, front matter, blockquotes, HTML blocks, region markers, and lists

### 2. Hover previews
- Hover over a collapsed section's start line to see a preview tooltip
- Shows up to 20 lines of content
- Displays the section type and name

### 3. Keyboard shortcuts
- `Ctrl+Alt+[` (Mac: `Cmd+Alt+[`) — Toggle current section
- `Ctrl+Alt+]` (Mac: `Cmd+Alt+]`) — Expand current section
- `Ctrl+Alt+F` (Mac: `Cmd+Alt+F`) — Focus on section (opens picker)

### 4. Context menu
Right-click in a markdown file to access **Markdown Region Buddy**:
- **Toggle Current Section** — Collapse/expand the section at cursor
- **Expand Named Section** — Expand all sections with the same name/type
- **Collapse Named Section** — Collapse all sections with the same name/type
- **Expand All Regions** — Expand all moniker, zone pivot, and tab sections
- **Collapse All Regions** — Collapse all moniker, zone pivot, and tab sections

### 5. Focus mode
1. Open the Command Palette (`Ctrl+Shift+P`)
2. Type **Markdown Region Buddy: Focus on Section**
3. Select one or more section types/names from the list
4. All matching sections expand; others collapse

### 6. Background colors (optional)
- Enable via settings: `markdownRegionBuddy.enableDecorations: true`
- Or use the Command Palette: **Markdown Region Buddy: Toggle Section Background Colors**
- Each section type gets a subtle background color:
  - Monikers: Blue tint
  - Zone Pivots: Green tint
  - Tabs: Pink tint
- Adjust opacity: `markdownRegionBuddy.decorationOpacity` (0.01–0.3)

## Configuration

Add to your `settings.json`:

```json
{
  "markdownRegionBuddy.enableDecorations": false,
  "markdownRegionBuddy.decorationOpacity": 0.05,
  "markdownRegionBuddy.overrideFoldingProvider": false
}
```

## Try it out

Open the [sample file](docs/sample.md) in VS Code to experiment with all the supported section types.

## Support

For issues or feature requests, please [open an issue](https://github.com/alvinashcraft/markdown-region-buddy/issues) on GitHub.

## License

MIT License — See [LICENSE](LICENSE) for details.
