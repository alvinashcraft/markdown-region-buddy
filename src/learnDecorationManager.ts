import * as vscode from 'vscode';
import { LearnSectionParser, LearnSection } from './learnSectionParser';

/**
 * Manages decorations for Learn sections
 */
export class LearnDecorationManager {
    private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
    private enabled: boolean = false;
    private opacity: number = 0.05;

    constructor(private context: vscode.ExtensionContext) {
        this.loadConfiguration();
        this.initializeDecorationTypes();
    }

    /**
     * Load configuration settings
     */
    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('markdownRegionBuddy');
        this.enabled = config.get<boolean>('enableDecorations', false);
        this.opacity = config.get<number>('decorationOpacity', 0.05);
    }

    /**
     * Initialize decoration types for each section type
     */
    private initializeDecorationTypes(): void {
        // Clear existing decorations
        this.decorationTypes.forEach(type => type.dispose());
        this.decorationTypes.clear();

        if (!this.enabled) {
            return;
        }

        // Define colors for each section type (using theme-aware colors)
        const sectionColors = {
            'moniker': { light: '135, 206, 250', dark: '70, 130, 180' }, // Light sky blue / Steel blue
            'zone': { light: '144, 238, 144', dark: '34, 139, 34' },     // Light green / Forest green
            'tab': { light: '255, 182, 193', dark: '178, 34, 34' }        // Light pink / Firebrick
        };

        for (const [type, colors] of Object.entries(sectionColors)) {
            const decorationType = vscode.window.createTextEditorDecorationType({
                isWholeLine: true,
                backgroundColor: {
                    id: `markdownRegionBuddy.${type}Background`
                },
                light: {
                    backgroundColor: `rgba(${colors.light}, ${this.opacity})`
                },
                dark: {
                    backgroundColor: `rgba(${colors.dark}, ${this.opacity})`
                }
            });

            this.decorationTypes.set(type, decorationType);
        }
    }

    /**
     * Apply decorations to the active editor
     */
    public updateDecorations(editor: vscode.TextEditor | undefined): void {
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        if (!this.enabled) {
            // Clear all decorations if disabled
            this.decorationTypes.forEach(type => {
                editor.setDecorations(type, []);
            });
            return;
        }

        const sections = LearnSectionParser.parseSections(editor.document);
        
        // Group sections by type
        const sectionsByType = new Map<string, LearnSection[]>();
        for (const section of sections) {
            if (!sectionsByType.has(section.type)) {
                sectionsByType.set(section.type, []);
            }
            sectionsByType.get(section.type)!.push(section);
        }

        // Apply decorations for each type
        for (const [type, decorationType] of this.decorationTypes) {
            const sectionsOfType = sectionsByType.get(type) || [];
            const ranges = sectionsOfType.map(section => section.range);
            editor.setDecorations(decorationType, ranges);
        }
    }

    /**
     * Toggle decorations on/off
     */
    public async toggleDecorations(): Promise<void> {
        this.enabled = !this.enabled;
        
        const config = vscode.workspace.getConfiguration('markdownRegionBuddy');
        await config.update('enableDecorations', this.enabled, vscode.ConfigurationTarget.Global);
        
        this.initializeDecorationTypes();
        
        if (vscode.window.activeTextEditor) {
            this.updateDecorations(vscode.window.activeTextEditor);
        }

        vscode.window.showInformationMessage(
            `Region decorations ${this.enabled ? 'enabled' : 'disabled'}.`
        );
    }

    /**
     * Update decorations when configuration changes
     */
    public onConfigurationChanged(): void {
        this.loadConfiguration();
        this.initializeDecorationTypes();
        
        if (vscode.window.activeTextEditor) {
            this.updateDecorations(vscode.window.activeTextEditor);
        }
    }

    /**
     * Dispose all decoration types
     */
    public dispose(): void {
        this.decorationTypes.forEach(type => type.dispose());
        this.decorationTypes.clear();
    }
}
