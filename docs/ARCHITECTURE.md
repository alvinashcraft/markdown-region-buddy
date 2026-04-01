# Extension Architecture

## Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      extension.ts                            │
│                  (Main Extension Entry)                      │
│                                                              │
│  • Activates extension                                       │
│  • Registers providers                                       │
│  • Registers commands                                        │
│  • Sets up event listeners                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴───────────┬──────────────┬───────────────┐
        │                      │              │               │
        ▼                      ▼              ▼               ▼
┌───────────────┐   ┌──────────────────┐   ┌────────────┐   ┌──────────────────┐
│ LearnSection  │   │  LearnFolding    │   │   Learn    │   │     Learn        │
│    Parser     │   │    Provider      │   │   Hover    │   │   Decoration     │
│               │   │                  │   │  Provider  │   │    Manager       │
├───────────────┤   ├──────────────────┤   ├────────────┤   ├──────────────────┤
│ • Parse       │◄──│ • Implements     │   │ • Shows    │   │ • Background     │
│   monikers    │   │   Folding Range  │   │   preview  │   │   colors for     │
│ • Parse       │   │   Provider       │   │   on hover │   │   sections       │
│   zones       │   │ • Combines       │   │ • Max 20   │   │ • Theme-aware    │
│ • Parse       │   │   region +       │   │   lines    │   │   colors         │
│   tabs        │   │   standard folds │   │            │   │ • Toggle on/off  │
│ • Find by     │   │                  │   │            │   │                  │
│   line/name   │   │                  │   │            │   │                  │
└───────┬───────┘   └────────┬─────────┘   └────────────┘   └──────────────────┘
        │                    │
        │                    ▼
        │           ┌──────────────────┐
        │           │   Markdown       │
        │           │ FoldingHelper    │
        │           ├──────────────────┤
        │           │ • Headings       │
        │           │ • Code blocks    │
        │           │ • Tables         │
        │           │ • Front matter   │
        │           │ • Blockquotes    │
        │           │ • HTML blocks    │
        │           │ • Region markers │
        │           │ • Lists          │
        │           └──────────────────┘
        │
        │
        ▼
┌──────────────────────────────┐
│  LearnFoldingCommands        │
│                              │
├──────────────────────────────┤
│ • toggleCurrentSection()     │
│ • expandCurrentSection()     │
│ • collapseCurrentSection()   │
│ • expandAll()                │
│ • collapseAll()              │
│ • expandNamedSection()       │
│ • collapseNamedSection()     │
│ • focusSection()             │
└──────────────────────────────┘
```

## Data Flow

### 1. Section Parsing
```
Markdown Document
      │
      ▼
LearnSectionParser.parseSections()
      │
      ├─► Regex match ::: moniker range="..." → Moniker section
      ├─► Regex match :::zone pivot="..." → Zone pivot section
      └─► Regex match # [Label](#tab/id) → Tab section
      │
      ▼
Array<LearnSection>
```

### 2. Folding
```
VS Code requests folding ranges
      │
      ▼
LearnFoldingProvider.provideFoldingRanges()
      │
      ├─► Calls LearnSectionParser.parseSections()  → region folds
      ├─► Calls MarkdownFoldingHelper.parse()       → standard folds
      │
      ▼
Merges both sets into one FoldingRange array
      │
      ▼
VS Code displays fold indicators in gutter
```

### 3. Hover
```
User hovers over collapsed section
      │
      ▼
LearnHoverProvider.provideHover()
      │
      ├─► Finds section at cursor position
      ├─► Extracts first 20 lines
      ├─► Formats as markdown code block
      │
      ▼
VS Code displays hover tooltip
```

### 4. Commands
```
User triggers command (keyboard/menu/palette)
      │
      ▼
LearnFoldingCommands method
      │
      ├─► Parse document to find sections
      ├─► Find relevant section(s)
      ├─► Execute VS Code fold/unfold commands
      │
      ▼
Sections expand/collapse
```

### 5. Decorations
```
Document opened/edited
      │
      ▼
LearnDecorationManager.updateDecorations()
      │
      ├─► Check if decorations enabled
      ├─► Parse sections
      ├─► Group by type (moniker/zone/tab)
      ├─► Apply color decorations
      │
      ▼
Background colors displayed (if enabled)
```

## Section Type Definitions

```typescript
interface LearnSection {
    type: 'moniker' | 'zone' | 'tab';
    name: string;              // e.g., "foundry", "python", "windows"
    startLine: number;         // 0-based line number
    endLine: number;           // 0-based line number
    indentLevel: number;       // For nested sections
    range: vscode.Range;       // VS Code Range object
}
```

## Regex Patterns

### Moniker
```typescript
Start: /^(\s*)::: moniker range="([^"]+)"/
End:   /^(\s*)::: moniker-end/

Example:
::: moniker range="foundry-classic"
                    ^^^^^^^^^^^^^^^
                    Captured as name
```

### Zone Pivot
```typescript
Start: /^(\s*):::zone pivot="([^"]+)"/
End:   /^(\s*)::: zone-end/

Example:
:::zone pivot="python"
               ^^^^^^
               Captured as name
```

### Tab
```typescript
Header: /^(\s*)# \[([^\]]+)\]\(#tab\/([^)]+)\)/
End:    /^(\s*)---\s*$/ or next tab header

Example:
# [Linux](#tab/linux)
             ^^^^^
             Captured as name (id)
```

## Event Flow

```
Extension Activation
      │
      ├─► Register providers (folding, hover)
      ├─► Register commands
      ├─► Initialize decoration manager
      └─► Set up event listeners
            │
            ├─► onDidChangeActiveTextEditor
            │     └─► Update decorations
            │
            ├─► onDidChangeTextDocument
            │     └─► Update decorations
            │
            └─► onDidChangeConfiguration
                  └─► Reload decoration settings
```

## Command Execution Example

**Scenario**: User presses `Ctrl+Alt+F` (Focus Section)

```
1. Command triggered: markdownRegionBuddy.focusSection
      │
2. LearnFoldingCommands.focusSection() called
      │
3. Get unique sections: LearnSectionParser.getUniqueSections()
      │
4. Show Quick Pick menu to user
      │
5. User selects: "zone: python"
      │
6. Find all sections of type="zone" with name="python"
      │
7. Get all sections of type="zone"
      │
8. For each section not matching "python":
      │
      └─► Execute: editor.fold command at section.startLine
      │
9. For each section matching "python":
      │
      └─► Execute: editor.unfold command at section.startLine
      │
10. Show notification: "Focused on: zone: python (3 section(s))"
```

## Configuration Flow

```
User changes setting
      │
      ▼
VS Code fires onDidChangeConfiguration event
      │
      ▼
Extension checks: event.affectsConfiguration('markdownRegionBuddy')
      │
      ▼
DecorationManager.onConfigurationChanged()
      │
      ├─► Load new settings
      ├─► Dispose old decoration types
      ├─► Create new decoration types with new settings
      └─► Reapply decorations to active editor
```
