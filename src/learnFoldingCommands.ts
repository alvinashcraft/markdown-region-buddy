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
     * Expand only regions (monikers, zone pivots, tabs) in the document
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
     * Collapse only regions (monikers, zone pivots, tabs) in the document
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
     * Focus on one or more sections (expand them and collapse others of the same type).
     * Supports multi-select and automatically includes compound zone pivots
     * (e.g., selecting "python" also includes "python, typescript").
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
                placeHolder: 'Select one or more sections to focus on',
                matchOnDescription: true,
                canPickMany: true
            }
        );

        if (!selected || selected.length === 0) {
            return;
        }

        // Build the set of selected names per type
        const selectedByType = new Map<string, Set<string>>();
        for (const item of selected) {
            const type = item.section.type;
            if (!selectedByType.has(type)) {
                selectedByType.set(type, new Set());
            }
            selectedByType.get(type)!.add(item.section.name);
        }

        // For zone pivots, auto-include compound zones that contain any selected value.
        // E.g., if "python" is selected, also match "python, typescript".
        const selectedZoneNames = selectedByType.get('zone');
        if (selectedZoneNames) {
            const allZoneSections = uniqueSections.filter(s => s.type === 'zone');
            for (const zoneSection of allZoneSections) {
                if (selectedZoneNames.has(zoneSection.name)) {
                    continue;
                }
                // Split compound name on comma and check for overlap
                const parts = zoneSection.name.split(',').map(p => p.trim());
                const hasOverlap = parts.some(part => selectedZoneNames.has(part));
                if (hasOverlap) {
                    selectedZoneNames.add(zoneSection.name);
                }
            }
        }

        const allSections = LearnSectionParser.parseSections(editor.document);
        const typesToProcess = new Set(selectedByType.keys());

        // Collapse all sections of the selected types
        for (const section of allSections) {
            if (typesToProcess.has(section.type)) {
                await this.collapseSection(editor, section);
            }
        }

        // Expand sections that match any of the selected names
        let expandedCount = 0;
        for (const section of allSections) {
            const names = selectedByType.get(section.type);
            if (names && names.has(section.name)) {
                await this.expandSection(editor, section);
                expandedCount++;
            }
        }

        const labels = selected.map(s => s.label).join(', ');
        vscode.window.showInformationMessage(
            `Focused on: ${labels} (${expandedCount} section(s))`
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
