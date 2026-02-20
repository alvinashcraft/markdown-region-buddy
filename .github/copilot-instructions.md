# Copilot Instructions for Learn Area Manager

## Project Overview

Learn Area Manager is a VS Code extension that helps authors manage **Microsoft Learn** markdown sections — monikers, zone pivots, and tabs — with folding, hover previews, focus commands, and optional background decorations. It activates on `markdown` files and targets VS Code `^1.85.0`.

## Architecture

The extension follows a modular component-based architecture:

- **`extension.ts`** — Entry point. Registers providers, commands, event listeners, and the decoration manager. All registrations are pushed to `context.subscriptions` for proper lifecycle management.
- **`learnSectionParser.ts`** — Core parser. Uses regex to detect moniker (`:::\s*moniker range="..."`), zone pivot (`:::\s*zone pivot="..."`), and tab (`# [Label](#tab/id)`) sections. Returns `LearnSection[]`. All methods are static.
- **`learnFoldingProvider.ts`** — Implements `vscode.FoldingRangeProvider`. Combines Learn section ranges from `LearnSectionParser` with standard markdown fold ranges from `MarkdownFoldingHelper`. Learn sections use `FoldingRangeKind.Region`; standard markdown folds use `undefined`.
- **`markdownFoldingHelper.ts`** — Static class providing standard markdown fold detection (headings, fenced code blocks, tables). Tracks code-fence state to avoid false positives. Skips Learn tab header lines (`# [Label](#tab/id)`) to avoid conflicts with `LearnSectionParser`.
- **`learnHoverProvider.ts`** — Implements `vscode.HoverProvider`. Shows a preview of collapsed section content (max 20 lines) on hover over the section start line.
- **`learnFoldingCommands.ts`** — Static class with all command implementations (toggle, expand, collapse, focus, named operations). Uses VS Code's `editor.fold`/`editor.unfold` commands with `selectionLines`.
- **`learnDecorationManager.ts`** — Manages section background colors using `TextEditorDecorationType`. Theme-aware (light/dark), configurable opacity, togglable at runtime.

### Data model

```typescript
interface LearnSection {
    type: 'moniker' | 'zone' | 'tab';
    name: string;
    startLine: number;   // 0-based
    endLine: number;     // 0-based
    indentLevel: number;
    range: vscode.Range;
}
```

### Section regex patterns

| Type | Start Pattern | End Pattern |
|------|--------------|-------------|
| Moniker | `/^(\s*):::\s*moniker range="([^"]+)"/` | `/^(\s*):::\s*moniker-end/` |
| Zone Pivot | `/^(\s*):::\s*zone pivot="([^"]+)"/` | `/^(\s*):::\s*zone-end/` |
| Tab | `/^(\s*)#{1,6} \[([^\]]+)\]\(#tab\/([^)]+)\)/` | `/^(\s*)---\s*$/` or next tab header |

### Tab section rules

- Basic syntax: `# [Tab Display Name](#tab/tab-id)` (any heading level `#` through `######`)
- Dependent tab syntax: `# [Tab Display Name](#tab/tab-id/tab-condition)` — makes a tab conditional on a previous tab selection. Only one level of dependency is allowed.
- A tab group must be terminated with three dashes (`---`).
- A tab group must contain at least two tabs and no more than four tabs.
- The `name` field in `LearnSection` captures everything after `#tab/` (i.e., `tab-id` or `tab-id/tab-condition`).

## Coding Conventions

### Language & Tooling

- **TypeScript** with `strict: true` (target ES2022, module Node16)
- **Webpack** bundles to `dist/extension.js` (commonjs2, node target)
- **ESLint** with `@typescript-eslint` — enforces camelCase/PascalCase imports, curly braces, `eqeqeq`, semicolons, no throw literals
- Tests use `@vscode/test-cli` and `@vscode/test-electron` with Mocha

### Naming Conventions

- **Command IDs**: `learnAreaManager.<camelCaseAction>` (e.g., `learnAreaManager.toggleCurrentSection`)
- **Configuration keys**: `learnAreaManager.<camelCaseSetting>` (e.g., `learnAreaManager.enableDecorations`)
- **Classes**: PascalCase, prefixed with `Learn` (e.g., `LearnSectionParser`, `LearnFoldingProvider`)
- **Files**: camelCase, prefixed with `learn` (e.g., `learnSectionParser.ts`, `learnFoldingCommands.ts`)
- **Interfaces**: PascalCase (e.g., `LearnSection`)

### Code Patterns

- All source files live in `src/`. No nested directories.
- `LearnSectionParser` uses **static methods** exclusively — no instance state.
- `LearnFoldingCommands` uses **static async methods** — each command gets the active editor, validates it's markdown, then acts.
- Guard clauses: commands check `editor.document.languageId !== 'markdown'` and return early.
- Providers implement VS Code interfaces (`FoldingRangeProvider`, `HoverProvider`) and register for `{ language: 'markdown' }`.
- The parser is the single source of truth for section detection — all components delegate to it.
- User feedback uses `vscode.window.showInformationMessage()`.
- Configuration is read via `vscode.workspace.getConfiguration('learnAreaManager')`.

### Extension Manifest (`package.json`)

- All commands use the `learnAreaManager.` prefix
- Command titles follow the pattern: `Learn Area Manager: <Action Description>`
- Context menus are gated with `"when": "editorLangId == markdown"`
- Keybindings use `"when": "editorTextFocus && editorLangId == markdown"`
- The extension uses a `learnAreaManager.context` submenu in the editor context menu
- Activation event: `onLanguage:markdown`

## Build & Run

- `npm run compile` — One-time build via webpack
- `npm run watch` — Webpack watch mode for development
- `npm run lint` — Run ESLint on `src/`
- `npm run package` — Production build with hidden source maps
- `npm run compile-tests` — Compile tests to `out/`
- `npm test` — Runs `vscode-test` (requires `compile-tests`, `compile`, and `lint`)
- Press **F5** to launch the Extension Development Host for manual testing
- Use `docs/sample.md` as the test fixture in the development host

## Guidelines for New Features

### Adding a New Command

1. Add the command ID and title to `contributes.commands` in `package.json`, using the `learnAreaManager.<camelCaseAction>` naming pattern and the `Learn Area Manager: <Title>` display format.
2. Implement the command as a static async method in `LearnFoldingCommands` (or the appropriate existing module). Follow the existing guard-clause pattern: get active editor, check for markdown language, find section, act.
3. Register the command in `extension.ts` via `vscode.commands.registerCommand()` and push to `context.subscriptions`.
4. If the command needs a keybinding, add it to `contributes.keybindings` with `"when": "editorTextFocus && editorLangId == markdown"`.
5. If the command should appear in the context menu, add it to the `learnAreaManager.context` submenu with `"when": "editorLangId == markdown"`.

### Adding a New Section Type

1. Add regex patterns (start and end) as `private static readonly` properties in `LearnSectionParser`.
2. Add detection logic in `parseSections()` and a corresponding `parse<Type>Section()` private method.
3. Extend the `LearnSection.type` union type.
4. Add a color entry in `LearnDecorationManager.initializeDecorationTypes()`.
5. Add a type label in `LearnHoverProvider.getSectionLabel()`.

### Adding a New Configuration Setting

1. Add the property under `contributes.configuration.properties` in `package.json` with the `learnAreaManager.` prefix.
2. Read it in the appropriate module via `vscode.workspace.getConfiguration('learnAreaManager')`.
3. Handle changes in the `onDidChangeConfiguration` listener in `extension.ts`.

## Skills

The following VS Code extension development skills are available in `.github/skills/` for domain-specific guidance:

- **`vscode-ext-commands`** — Guidelines for contributing commands: naming (`learnAreaManager.<action>`), categories, visibility (Command Palette vs Side Bar), icons, `enablement`, `when` clauses, and ordering.
- **`vscode-ext-localization`** — Guidelines for localization: `package.nls.<langId>.json` for manifest strings, `bundle.l10n.<langId>.json` for source code strings, and per-language markdown files for walkthrough content.

When adding or modifying commands, reference the `vscode-ext-commands` skill. When localizing any user-facing strings, reference the `vscode-ext-localization` skill.

## Known Limitations

- Without configuring this extension as the default folding provider, VS Code's built-in markdown folding can conflict with Learn section folds when both start on the same line.
- Tab sections (`# [Label](#tab/id)`) are treated as H1 headers by VS Code's markdown parser, causing folding conflicts unless this extension is the default provider.
- Hover and decoration features work regardless of folding conflicts.
- List sub-item folding from the built-in provider is not yet replicated.
- Blockquotes and HTML block folding from the built-in provider are not yet replicated.
