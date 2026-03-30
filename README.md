# Markdown Region Buddy

A VS Code extension for managing markdown regions including monikers, zone pivots, and tabs.

## Features

- **Folding Support**: Collapse and expand monikers, zone pivots, tabs, headings, code blocks, tables, blockquotes, HTML blocks, front matter, region markers, and lists
- **Hover Previews**: View section contents when hovering over collapsed sections
- **Context Menu**: Right-click to expand/collapse sections by name or type
- **Keyboard Shortcuts**: Quick access to expand/collapse operations
- **Focus Mode**: Expand specific sections while collapsing others
- **Optional Background Colors**: Visual distinction for different section types

## Usage

### Keyboard Shortcuts

- `Ctrl+Alt+[` (Mac: `Cmd+Alt+[`) - Toggle current section
- `Ctrl+Alt+]` (Mac: `Cmd+Alt+]`) - Expand current section
- `Ctrl+Alt+F` (Mac: `Cmd+Alt+F`) - Focus on section (opens picker)

### Context Menu

Right-click in a markdown file to access the "Markdown Region Buddy" menu with options to:
- Toggle current section
- Expand/collapse sections by name
- Expand/collapse all sections

## Supported Section Types

- **Monikers**: `::: moniker range="..."` ... `::: moniker-end`
- **Zone Pivots**: `:::zone pivot="..."` ... `::: zone-end`
- **Tabs**: `# [Label](#tab/id)` ... `---`

## Configuration

- `markdownRegionBuddy.enableDecorations`: Enable background colors for sections (default: false)
- `markdownRegionBuddy.decorationOpacity`: Opacity for section backgrounds (default: 0.05)
- `markdownRegionBuddy.overrideFoldingProvider`: Set this extension as the default folding provider for Markdown files (default: false). Resolves conflicts with VS Code's built-in markdown folding provider.

## Resolving Folding Conflicts

VS Code's built-in markdown language features provide their own folding ranges for headings, which can conflict with region folds — especially tab sections that use `# [Label](#tab/id)` syntax. When both providers emit folds on the same line, VS Code's built-in provider wins and the region fold is discarded.

This extension includes its own detection of standard markdown folds (headings, fenced code blocks, and tables) so it can serve as the **sole folding provider** for markdown files without losing any functionality.

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

## Known Limitations

- **Default folding conflicts**: Without configuring this extension as the default folding provider (see above), VS Code's built-in markdown folding can take precedence over region folds when both start on the same line. This primarily affects tab sections.
- **Tab section syntax**: Tab sections use `# [Label](#tab/id)` syntax which VS Code's markdown parser treats as H1 headers. Configuring this extension as the default folding provider resolves this.
- **Workaround without overriding**: Hover tooltips and background decorations work correctly regardless of folding conflicts.

## Design Decisions

- **Separate markdown fold helper**: Standard markdown fold detection (`MarkdownFoldingHelper`) is kept separate from `LearnSectionParser` since these are generic markdown constructs, keeping the region-specific parser focused.
- **Tab header exclusion**: `MarkdownFoldingHelper` explicitly skips `# [Label](#tab/id)` lines to avoid duplicating tab folds as heading folds.
- **Expanding excluded set**: Fold detection uses an ordered pipeline — code blocks and front matter are detected first and added to an excluded-lines set, preventing `#` comments in YAML and `---` inside HTML from being misdetected as headings or table separators.
- **Front matter vs tab `---`**: Front matter is only detected at line 0 with no leading whitespace, and is added to the section parser's excluded set so tab `---` terminators are not confused with YAML delimiters.
- **FoldingRangeKind**: Regions and region markers use `FoldingRangeKind.Region`; standard markdown folds use `undefined` to match VS Code's built-in behavior.
- **Setting default**: `overrideFoldingProvider` defaults to `false` so the extension does not modify user settings without explicit consent.

## Documentation

- [Quick Reference](docs/QUICK_REFERENCE.md) - Keyboard shortcuts, commands, and tips
- [Sample File](docs/sample.md) - Example markdown with all section types
- [Architecture](docs/ARCHITECTURE.md) - Technical documentation
- [Testing Guide](docs/TESTING.md) - Manual and automated testing instructions

## License

MIT
