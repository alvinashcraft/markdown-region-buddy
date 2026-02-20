import * as vscode from 'vscode';
import { LearnFoldingProvider } from './learnFoldingProvider';
import { LearnHoverProvider } from './learnHoverProvider';
import { LearnFoldingCommands } from './learnFoldingCommands';
import { LearnDecorationManager } from './learnDecorationManager';

const EXTENSION_ID = 'your-publisher-name.learn-area-manager';

let decorationManager: LearnDecorationManager;

/**
 * Activates the Learn Area Manager extension
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Learn Area Manager extension is now active!');

    // Register folding provider for markdown files
    // Use pattern to increase selector specificity, which can give this provider
    // higher priority than the built-in markdown folding provider
    const foldingProvider = vscode.languages.registerFoldingRangeProvider(
        [
            { language: 'markdown', scheme: 'file', pattern: '**/*.md' },
            { language: 'markdown', scheme: 'file', pattern: '**/*.markdown' },
            { language: 'markdown', scheme: 'untitled' }
        ],
        new LearnFoldingProvider()
    );
    context.subscriptions.push(foldingProvider);

    // Register hover provider for markdown files
    const hoverProvider = vscode.languages.registerHoverProvider(
        { language: 'markdown', scheme: 'file' },
        new LearnHoverProvider()
    );
    context.subscriptions.push(hoverProvider);

    // Initialize decoration manager
    decorationManager = new LearnDecorationManager(context);
    context.subscriptions.push({
        dispose: () => decorationManager.dispose()
    });

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.toggleCurrentSection', () => 
            LearnFoldingCommands.toggleCurrentSection()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.expandCurrentSection', () => 
            LearnFoldingCommands.expandCurrentSection()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.collapseCurrentSection', () => 
            LearnFoldingCommands.collapseCurrentSection()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.expandAll', () => 
            LearnFoldingCommands.expandAll()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.collapseAll', () => 
            LearnFoldingCommands.collapseAll()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.expandNamedSection', () => 
            LearnFoldingCommands.expandNamedSection()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.collapseNamedSection', () => 
            LearnFoldingCommands.collapseNamedSection()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.focusSection', () => 
            LearnFoldingCommands.focusSection()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.toggleDecorations', () => 
            decorationManager.toggleDecorations()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('learnAreaManager.configureAsDefaultProvider', async () => {
            const choice = await vscode.window.showInformationMessage(
                'Set Learn Area Manager as the default folding provider for Markdown files? ' +
                'This resolves folding conflicts with VS Code\'s built-in markdown provider.',
                'Yes', 'No'
            );
            if (choice === 'Yes') {
                const config = vscode.workspace.getConfiguration('editor', { languageId: 'markdown' });
                await config.update('defaultFoldingRangeProvider', EXTENSION_ID, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('Learn Area Manager is now the default folding provider for Markdown files.');
            }
        })
    );

    // Update decorations on editor change
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                decorationManager.updateDecorations(editor);
            }
        })
    );

    // Update decorations on document change
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                decorationManager.updateDecorations(editor);
            }
        })
    );

    // Update decorations on configuration change
    // Also handle overrideFoldingProvider being toggled at runtime
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('learnAreaManager')) {
                decorationManager.onConfigurationChanged();

                if (event.affectsConfiguration('learnAreaManager.overrideFoldingProvider')) {
                    const cfg = vscode.workspace.getConfiguration('learnAreaManager');
                    const editorCfg = vscode.workspace.getConfiguration('editor', { languageId: 'markdown' });
                    if (cfg.get<boolean>('overrideFoldingProvider', false)) {
                        editorCfg.update('defaultFoldingRangeProvider', EXTENSION_ID, vscode.ConfigurationTarget.Global);
                    } else {
                        const current = editorCfg.get<string>('defaultFoldingRangeProvider');
                        if (current === EXTENSION_ID) {
                            editorCfg.update('defaultFoldingRangeProvider', undefined, vscode.ConfigurationTarget.Global);
                        }
                    }
                }
            }
        })
    );

    // Apply decorations to currently active editor
    if (vscode.window.activeTextEditor) {
        decorationManager.updateDecorations(vscode.window.activeTextEditor);
    }

    // If configured, set this extension as the default folding provider for markdown
    const learnConfig = vscode.workspace.getConfiguration('learnAreaManager');
    if (learnConfig.get<boolean>('overrideFoldingProvider', false)) {
        const editorConfig = vscode.workspace.getConfiguration('editor', { languageId: 'markdown' });
        const currentProvider = editorConfig.get<string>('defaultFoldingRangeProvider');
        if (currentProvider !== EXTENSION_ID) {
            editorConfig.update('defaultFoldingRangeProvider', EXTENSION_ID, vscode.ConfigurationTarget.Global);
        }
    }

    vscode.window.showInformationMessage('Learn Area Manager extension activated!');
}

/**
 * Deactivates the extension.
 * Note: We intentionally do NOT remove the defaultFoldingRangeProvider setting here.
 * deactivate() runs on every VS Code shutdown, not just on uninstall/disable.
 * Removing it here would force users to re-run the command every session.
 * Instead, the setting is managed via:
 *   - The overrideFoldingProvider config (auto-set on activate, removed when toggled off)
 *   - The configureAsDefaultProvider command (persists across sessions)
 * If the extension is uninstalled, the stale setting is harmless — VS Code
 * silently falls back to the built-in provider when the named provider is missing.
 */
export function deactivate() {
    console.log('Learn Area Manager extension is now deactivated.');
}
