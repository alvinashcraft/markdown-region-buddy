# Markdown Region Buddy

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/alvinashcraft.markdown-region-buddy)](https://marketplace.visualstudio.com/items?itemName=alvinashcraft.markdown-region-buddy)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A Visual Studio Code extension that helps authors manage markdown regions — **monikers**, **zone pivots**, and **tabs** — with folding, hover previews, focus commands, and optional background decorations. Built for [Microsoft Learn](https://learn.microsoft.com/) content authors and anyone working with regional markdown syntax.

## Features

### Region folding

Collapse and expand moniker, zone pivot, and tab sections directly in the editor gutter. The extension also provides full standard markdown folding for headings, fenced code blocks, tables, front matter, blockquotes, HTML blocks, `<!-- #region -->` markers, and lists.

### Hover previews

Hover over a collapsed section's start line to see a preview of up to 20 lines of content without expanding it.

### Focus mode

Use the **Focus on Section** command to expand sections of a specific type/name while collapsing everything else — great for isolating the content you're working on.

### Context menu and Command Palette

All operations are available from the right-click context menu (in a **Markdown Region Buddy** submenu) and from the Command Palette.

### Background decorations (optional)

Enable subtle, theme-aware background colors to visually distinguish moniker (blue), zone pivot (green), and tab (pink) regions.

## Supported section types

| Type | Start syntax | End syntax |
|------|-------------|------------|
| Moniker | `::: moniker range="..."` | `::: moniker-end` |
| Zone Pivot | `:::zone pivot="..."` | `::: zone-end` |
| Tab | `# [Label](#tab/id)` | `---` or next tab header |

> Tab headers support any heading level (`#` through `######`) and optional dependent-tab syntax: `# [Label](#tab/tab-id/tab-condition)`.

## Getting started

1. Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=alvinashcraft.markdown-region-buddy).
2. Open any `.md` file — the extension activates automatically.
3. Look for folding indicators in the gutter next to region start lines.

For the best experience, set this extension as the default folding provider to avoid conflicts with VS Code's built-in markdown folding (see [Resolving folding conflicts](#resolving-folding-conflicts) below).

## Keyboard shortcuts

| Shortcut | Mac | Action |
|----------|-----|--------|
| `Ctrl+Alt+[` | `Cmd+Alt+[` | Toggle current section |
| `Ctrl+Alt+]` | `Cmd+Alt+]` | Expand current section |
| `Ctrl+Alt+F` | `Cmd+Alt+F` | Focus on section (opens picker) |

## Commands

All commands are available via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`). Search for **Markdown Region Buddy**:

| Command | Description |
|---------|-------------|
| Toggle Current Section | Collapse or expand the section at the cursor |
| Expand Current Section | Expand the section at the cursor |
| Collapse Current Section | Collapse the section at the cursor |
| Expand All Regions | Expand all moniker, zone pivot, and tab sections |
| Collapse All Regions | Collapse all moniker, zone pivot, and tab sections |
| Expand Named Section | Expand all sections matching the current section's name |
| Collapse Named Section | Collapse all sections matching the current section's name |
| Focus on Section | Pick a section type/name to focus; others collapse |
| Toggle Section Background Colors | Enable or disable background decorations |
| Set as Default Folding Provider | Configure this extension as the default markdown folding provider |

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `markdownRegionBuddy.enableDecorations` | boolean | `false` | Enable background colors for different section types |
| `markdownRegionBuddy.decorationOpacity` | number | `0.05` | Opacity for section background colors (0.01–0.3) |
| `markdownRegionBuddy.overrideFoldingProvider` | boolean | `false` | Set this extension as the default folding provider for Markdown files |

## Resolving folding conflicts

VS Code's built-in markdown language features provide their own folding ranges for headings, which can conflict with region folds — especially tab sections that use `# [Label](#tab/id)` syntax. When both providers emit folds on the same line, VS Code's built-in provider wins and the region fold is discarded.

This extension includes its own detection of standard markdown folds (headings, fenced code blocks, tables, and more) so it can serve as the **sole folding provider** for markdown files without losing any functionality.

### Option 1: Use the command

Open the Command Palette and run **Markdown Region Buddy: Set as Default Folding Provider**. This writes the `editor.defaultFoldingRangeProvider` setting for markdown files.

### Option 2: Enable the setting

Set `markdownRegionBuddy.overrideFoldingProvider` to `true` in your settings. The extension will automatically configure itself as the default folding provider on activation.

### Option 3: Manual configuration

Add this to your `settings.json`:

```json
"[markdown]": {
    "editor.defaultFoldingRangeProvider": "alvinashcraft.markdown-region-buddy"
}
```

## Known limitations

- Without configuring this extension as the default folding provider (see above), VS Code's built-in markdown folding can take precedence over region folds when both start on the same line. This primarily affects tab sections.
- Hover tooltips and background decorations work correctly regardless of folding provider configuration.

## Documentation

- [Quick Reference](docs/QUICK_REFERENCE.md) — Keyboard shortcuts, commands, and tips
- [Architecture](docs/ARCHITECTURE.md) — Technical design and component overview
- [Testing Guide](docs/TESTING.md) — Manual and automated testing instructions
- [Sample File](docs/sample.md) — Example markdown with all section types

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/alvinashcraft/markdown-region-buddy).

## License

[MIT](LICENSE)
