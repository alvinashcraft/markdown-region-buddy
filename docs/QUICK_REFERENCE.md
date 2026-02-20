# Learn Area Manager - Quick Reference

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+[` / `Cmd+Alt+[` | Toggle current section (collapse/expand) |
| `Ctrl+Alt+]` / `Cmd+Alt+]` | Expand current section |
| `Ctrl+Alt+F` / `Cmd+Alt+F` | Focus on section (picker) |

## Commands (Command Palette)

Type `Learn Area Manager` in Command Palette (`Ctrl+Shift+P`) to see all commands:

- **Toggle Current Section** - Toggle section at cursor position
- **Expand Current Section** - Expand section at cursor
- **Collapse Current Section** - Collapse section at cursor
- **Expand All Sections** - Expand all sections in document
- **Collapse All Sections** - Collapse all sections in document
- **Expand Named Section** - Expand all sections with same name as current
- **Collapse Named Section** - Collapse all sections with same name as current
- **Focus on Section** - Show picker to select and focus on specific section type
- **Toggle Section Background Colors** - Enable/disable decorations

## Context Menu

Right-click in markdown → **Learn Area Manager** submenu:
- Toggle Current Section
- Expand Named Section
- Collapse Named Section
- Expand All Sections
- Collapse All Sections

## Supported Section Types

### 1. Monikers
```markdown
::: moniker range="foundry-classic"
Content for this moniker
::: moniker-end
```

### 2. Zone Pivots
```markdown
:::zone pivot="python"
Python-specific content
::: zone-end
```

### 3. Tabs
```markdown
# [Linux](#tab/linux)
Linux content
# [Windows](#tab/windows)
Windows content
---
```

## Settings

```json
{
  // Enable colored backgrounds for sections
  "learnAreaManager.enableDecorations": false,
  
  // Opacity for section backgrounds (0.01-0.3)
  "learnAreaManager.decorationOpacity": 0.05
}
```

## Tips

1. **Quick Navigation**: Use focus mode (`Ctrl+Alt+F`) to view only sections you care about
2. **Review Mode**: Collapse all sections, then expand them one by one to review
3. **Background Colors**: Enable decorations to visually distinguish section types
4. **Hover Previews**: Hover over collapsed sections to see content without expanding
5. **Bulk Operations**: Use expand/collapse named section to handle multiple sections at once

## Workflow Examples

### Example 1: Review All Zone Pivots
1. Place cursor in any zone pivot section
2. Right-click → Learn Area Manager → Collapse Named Section
3. Manually expand each zone pivot to review

### Example 2: Focus on Python Content
1. Press `Ctrl+Alt+F`
2. Select "zone: python" from picker
3. All Python zone pivots expand, others collapse

### Example 3: Compare Monikers
1. Enable background colors: Command Palette → Toggle Section Background Colors
2. All moniker sections get blue background
3. Easy to see which content belongs to which moniker

## Known Limitations

Due to VS Code's folding architecture:

- **Fold indicators may not appear** in the gutter for Learn sections that contain markdown headers (`#`, `##`, etc.) or tab sections
- **Tab sections** (using `# [Label](#tab/id)` syntax) are treated as H1 headers by VS Code's markdown parser
- **Folding conflicts**: When Learn sections contain headers, VS Code's built-in markdown folding provider takes precedence
- **Workaround**: Keyboard shortcuts and commands may still be affected by the same conflicts, but hover tooltips and background decorations work correctly

## Troubleshooting

**Q: Folding indicators don't appear**
- This is a known limitation when sections contain markdown headers
- Use keyboard shortcuts (`Ctrl+Alt+[`) or commands as a workaround
- Background decorations and hover previews still work

**Q: Keyboard shortcut folds wrong section**
- This occurs when sections contain markdown headers
- VS Code's header folding conflicts with Learn section folding
- Unfortunately this is a VS Code API limitation

**Q: Hover preview doesn't show**
- Hover must be over the first line of the section
- Section must be collapsed first
- Works even when fold indicators don't appear

**Q: Commands are grayed out**
- Ensure active file is a markdown file
- Some commands require cursor to be within a section

**Q: Background colors too bright/dim**
- Adjust `learnAreaManager.decorationOpacity` setting
- Try values between 0.02 and 0.15 for best results
