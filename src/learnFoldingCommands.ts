import * as vscode from 'vscode';
import { LearnSectionParser, LearnSection } from './learnSectionParser';

/**
 * Manages folding commands for Learn sections
 */
export class LearnFoldingCommands {
    /**
     * Toggle the current section (expand if collapsed, collapse if expanded)
     */
    public static async toggleCurrentSection(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const section = LearnSectionParser.findSectionAtLine(editor.document, editor.selection.active.line);
        if (!section) {
            vscode.window.showInformationMessage('No region found at cursor position.');
            return;
        }

        await this.toggleSection(editor, section);
    }

    /**
     * Expand the current section
     */
    public static async expandCurrentSection(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const section = LearnSectionParser.findSectionAtLine(editor.document, editor.selection.active.line);
        if (!section) {
            vscode.window.showInformationMessage('No region found at cursor position.');
            return;
        }

        await this.expandSection(editor, section);
    }

    /**
     * Collapse the current section
     */
    public static async collapseCurrentSection(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const section = LearnSectionParser.findSectionAtLine(editor.document, editor.selection.active.line);
        if (!section) {
            vscode.window.showInformationMessage('No region found at cursor position.');
            return;
        }

        await this.collapseSection(editor, section);
    }

    /**
     * Expand all foldable regions in the document (Learn sections, headings, code blocks, etc.)
     */
    public static async expandAll(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        await vscode.commands.executeCommand('editor.unfoldAll');
    }

    /**
     * Collapse all foldable regions in the document (Learn sections, headings, code blocks, etc.)
     */
    public static async collapseAll(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        await vscode.commands.executeCommand('editor.foldAll');
    }

    /**
     * Expand only Learn sections (monikers, zone pivots, tabs) in the document
     */
    public static async expandAllRegions(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const sections = LearnSectionParser.parseSections(editor.document);
        for (const section of sections) {
            await this.expandSection(editor, section);
        }
    }

    /**
     * Collapse only Learn sections (monikers, zone pivots, tabs) in the document
     */
    public static async collapseAllRegions(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const sections = LearnSectionParser.parseSections(editor.document);
        for (const section of sections) {
            await this.collapseSection(editor, section);
        }
    }

    /**
     * Expand all sections with a specific name
     */
    public static async expandNamedSection(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const section = LearnSectionParser.findSectionAtLine(editor.document, editor.selection.active.line);
        if (!section) {
            vscode.window.showInformationMessage('No region found at cursor position.');
            return;
        }

        const sections = LearnSectionParser.findSectionsByName(editor.document, section.type, section.name);
        for (const s of sections) {
            await this.expandSection(editor, s);
        }

        vscode.window.showInformationMessage(`Expanded ${sections.length} section(s): ${section.type} "${section.name}"`);
    }

    /**
     * Collapse all sections with a specific name
     */
    public static async collapseNamedSection(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const section = LearnSectionParser.findSectionAtLine(editor.document, editor.selection.active.line);
        if (!section) {
            vscode.window.showInformationMessage('No region found at cursor position.');
            return;
        }

        const sections = LearnSectionParser.findSectionsByName(editor.document, section.type, section.name);
        for (const s of sections) {
            await this.collapseSection(editor, s);
        }

        vscode.window.showInformationMessage(`Collapsed ${sections.length} section(s): ${section.type} "${section.name}"`);
    }

    /**
     * Focus on a specific section (expand it and collapse others of the same type)
     */
    public static async focusSection(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            return;
        }

        const uniqueSections = LearnSectionParser.getUniqueSections(editor.document);
        if (uniqueSections.length === 0) {
            vscode.window.showInformationMessage('No regions found in this document.');
            return;
        }

        const selected = await vscode.window.showQuickPick(
            uniqueSections.map(s => ({
                label: s.label,
                description: `${s.type}`,
                section: s
            })),
            {
                placeHolder: 'Select a section to focus on',
                matchOnDescription: true
            }
        );

        if (!selected) {
            return;
        }

        // Get all sections of this type
        const allSectionsOfType = LearnSectionParser.parseSections(editor.document)
            .filter(s => s.type === selected.section.type);

        // Collapse all sections of this type
        for (const section of allSectionsOfType) {
            await this.collapseSection(editor, section);
        }

        // Expand only the selected ones
        const sectionsToExpand = LearnSectionParser.findSectionsByName(
            editor.document, 
            selected.section.type, 
            selected.section.name
        );
        
        for (const section of sectionsToExpand) {
            await this.expandSection(editor, section);
        }

        vscode.window.showInformationMessage(
            `Focused on: ${selected.label} (${sectionsToExpand.length} section(s))`
        );
    }

    /**
     * Toggle a specific section's fold state
     */
    private static async toggleSection(editor: vscode.TextEditor, section: LearnSection): Promise<void> {
        // Use selectionLines to explicitly tell VS Code which line to fold
        await vscode.commands.executeCommand('editor.toggleFold', {
            selectionLines: [section.startLine]
        });
    }

    /**
     * Expand a specific section
     */
    private static async expandSection(editor: vscode.TextEditor, section: LearnSection): Promise<void> {
        await vscode.commands.executeCommand('editor.unfold', {
            selectionLines: [section.startLine]
        });
    }

    /**
     * Collapse a specific section
     */
    private static async collapseSection(editor: vscode.TextEditor, section: LearnSection): Promise<void> {
        await vscode.commands.executeCommand('editor.fold', {
            selectionLines: [section.startLine]
        });
    }
}
