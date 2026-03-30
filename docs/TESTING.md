# Testing Guide

## Manual Testing Steps

### 1. Basic Folding Test

1. Open the extension in debug mode (F5)
2. Open `sample.md` in the Extension Development Host
3. Verify folding indicators (▼) appear next to:
   - `::: moniker range="..."`
   - `:::zone pivot="..."`
   - `# [Label](#tab/id)`
4. Click a folding indicator to collapse
5. Verify the section collapses
6. Click again to expand

**Expected**: Sections fold/unfold smoothly

---

### 2. Hover Preview Test

1. Collapse a section (click ▼)
2. Hover over the first line of the collapsed section
3. Verify tooltip appears showing:
   - Section type and name in bold
   - Code block with section contents
   - Max 20 lines with "... (X more lines)" if longer

**Expected**: Tooltip displays correct preview

---

### 3. Keyboard Shortcut Test

#### Toggle Current Section (Ctrl+Alt+[)
1. Place cursor inside a section
2. Press `Ctrl+Alt+[`
3. Verify section toggles (collapses if expanded, expands if collapsed)

#### Expand Current Section (Ctrl+Alt+])
1. Place cursor in a collapsed section
2. Press `Ctrl+Alt+]`
3. Verify section expands

#### Focus Section (Ctrl+Alt+F)
1. Press `Ctrl+Alt+F`
2. Verify Quick Pick menu appears
3. Select a section type
4. Verify selected sections expand, others collapse

**Expected**: All keyboard shortcuts work correctly

---

### 4. Context Menu Test

1. Right-click in a markdown file
2. Verify "Markdown Region Buddy" submenu appears
3. Test each menu item:
   - **Toggle Current Section**: Should toggle section at cursor
   - **Expand Named Section**: Should expand all sections of same type/name
   - **Collapse Named Section**: Should collapse all sections of same type/name
   - **Expand All**: Should expand all sections
   - **Collapse All**: Should collapse all sections

**Expected**: All context menu commands work

---

### 5. Command Palette Test

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Markdown Region Buddy"
3. Verify all commands appear
4. Test each command

**Expected**: All commands accessible and functional

---

### 6. Named Section Test

1. Open `sample.md`
2. Place cursor in a zone pivot section (e.g., "portal")
3. Right-click → Markdown Region Buddy → Expand Named Section
4. Verify only "portal" sections remain expanded
5. Repeat with Collapse Named Section

**Expected**: Operations affect only sections with matching type and name

---

### 7. Focus Mode Test

1. Open `sample.md`
2. Press `Ctrl+Alt+F`
3. Select "zone: python" from picker
4. Verify:
   - All "python" zone pivots are expanded
   - Other zone pivots are collapsed
   - Monikers and tabs are unaffected

**Expected**: Only selected section type/name is visible

---

### 8. Decoration Test

#### Enable Decorations
1. Open Command Palette
2. Run "Markdown Region Buddy: Toggle Section Background Colors"
3. Verify sections get subtle background colors:
   - Monikers: Blue tint
   - Zone Pivots: Green tint
   - Tabs: Pink tint

#### Change Opacity
1. Open settings
2. Set `markdownRegionBuddy.decorationOpacity` to `0.1`
3. Verify backgrounds become more visible

#### Disable Decorations
1. Toggle decorations again
2. Verify backgrounds disappear

**Expected**: Decorations toggle correctly and respect settings

---

### 9. Nested Section Test

1. Create nested sections in a markdown file:
   ```markdown
   ::: moniker range="v2"
   
   :::zone pivot="advanced"
   Nested content
   ::: zone-end
   
   ::: moniker-end
   ```
2. Verify both levels fold independently
3. Collapse outer section
4. Expand outer section
5. Verify inner section remembers its state

**Expected**: Nested sections work correctly

---

### 10. Tab Section Test

1. Open a markdown file with tabs
2. Verify each tab section folds independently
3. Collapse first tab
4. Verify other tabs remain expanded
5. Verify `---` delimiter ends the tab group

**Expected**: Tab sections behave correctly

---

### 11. Edge Cases

#### Empty Sections
```markdown
::: moniker range="empty"
::: moniker-end
```
- Should still fold/unfold

#### No End Marker (Tabs)
```markdown
# [Tab](#tab/test)
Last tab with no --- at end
(end of file)
```
- Should fold to end of file

#### Multiple Whitespace
```markdown
:::  zone   pivot="spaced"
::: zone-end
```
- Should NOT match (proper format required)

#### Case Sensitivity
```markdown
::: Moniker range="test"  <!-- Wrong case -->
::: MONIKER-END
```
- Should NOT match (lowercase required)

**Expected**: Extension handles edge cases gracefully

---

## Automated Testing (Future)

### Unit Tests to Implement

```typescript
describe('LearnSectionParser', () => {
    test('should parse moniker sections', () => {
        // Test moniker parsing
    });
    
    test('should parse zone pivot sections', () => {
        // Test zone parsing
    });
    
    test('should parse tab sections', () => {
        // Test tab parsing
    });
    
    test('should find section at line', () => {
        // Test findSectionAtLine
    });
    
    test('should find sections by name', () => {
        // Test findSectionsByName
    });
    
    test('should handle nested sections', () => {
        // Test nesting
    });
    
    test('should handle malformed sections', () => {
        // Test error cases
    });
});
```

---

## Performance Testing

### Large Document Test

1. Create a markdown file with 100+ sections
2. Open in Extension Development Host
3. Verify:
   - Extension loads quickly
   - No lag when scrolling
   - Commands execute quickly
   - Decorations update smoothly

**Expected**: Good performance even with many sections

---

## Compatibility Testing

### Different Markdown Files

Test with:
- GitHub-flavored markdown
- Standard markdown
- region-specific markdown
- Mixed content (some sections, some not)

**Expected**: Works correctly, doesn't interfere with non-region markdown

### Different Themes

Test with:
- Light themes
- Dark themes
- High contrast themes

**Expected**: Decorations adapt to theme colors

---

## Bug Testing Checklist

- [ ] Folding indicators appear correctly
- [ ] Hover previews work on collapsed sections
- [ ] Keyboard shortcuts trigger correct commands
- [ ] Context menu appears in markdown files only
- [ ] Commands work from Command Palette
- [ ] Named section operations affect correct sections
- [ ] Focus mode isolates correct sections
- [ ] Decorations toggle correctly
- [ ] Settings changes take effect immediately
- [ ] Nested sections work independently
- [ ] Tab sections handle --- delimiter
- [ ] Extension doesn't affect non-markdown files
- [ ] No errors in Developer Tools console
- [ ] Extension activates only for markdown files
- [ ] Performance acceptable with large files

---

## Reporting Issues

When reporting issues, include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Sample markdown** that demonstrates the issue
5. **VS Code version**
6. **Extension version**
7. **Operating system**
8. **Screenshots/videos** if applicable
9. **Console errors** from Developer Tools
