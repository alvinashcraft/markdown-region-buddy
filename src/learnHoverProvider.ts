import * as vscode from 'vscode';
import { LearnSectionParser } from './learnSectionParser';

/**
 * Provides hover information for Learn sections
 */
export class LearnHoverProvider implements vscode.HoverProvider {
    private static readonly MAX_PREVIEW_LINES = 20;

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const section = LearnSectionParser.findSectionAtLine(document, position.line);
        
        if (!section) {
            return undefined;
        }

        // Only show hover on the start line
        if (position.line !== section.startLine) {
            return undefined;
        }

        // Check if the section is collapsed by looking at visible ranges
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== document) {
            return undefined;
        }

        // Check if the section appears to be collapsed
        // A section is considered collapsed if there's more than one line but 
        // the lines after the first are not in the visible ranges
        if (section.endLine > section.startLine) {
            const isCollapsed = this.isSectionCollapsed(editor, section);
            if (!isCollapsed) {
                return undefined;
            }
        }

        const contents = this.getSectionPreview(document, section);
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown(`**${this.getSectionLabel(section)}**\n\n`);
        markdown.appendCodeblock(contents, 'markdown');
        
        return new vscode.Hover(markdown);
    }

    private isSectionCollapsed(
        editor: vscode.TextEditor, 
        section: { startLine: number, endLine: number }
    ): boolean {
        // Check if any line within the section (except the first) is visible
        for (const visibleRange of editor.visibleRanges) {
            for (let line = section.startLine + 1; line <= section.endLine; line++) {
                if (visibleRange.contains(new vscode.Position(line, 0))) {
                    // Found a visible line within the section, so it's not collapsed
                    return false;
                }
            }
        }
        // No lines found within the section, so it's collapsed
        return true;
    }

    private getSectionLabel(section: { type: string, name: string }): string {
        const typeLabels: Record<string, string> = {
            'moniker': 'Moniker Range',
            'zone': 'Zone Pivot',
            'tab': 'Tab'
        };
        
        return `${typeLabels[section.type] || section.type}: ${section.name}`;
    }

    private getSectionPreview(
        document: vscode.TextDocument, 
        section: { startLine: number, endLine: number }
    ): string {
        const lines: string[] = [];
        const totalLines = section.endLine - section.startLine + 1;
        const linesToShow = Math.min(totalLines, LearnHoverProvider.MAX_PREVIEW_LINES);
        
        for (let i = section.startLine; i < section.startLine + linesToShow; i++) {
            if (i <= section.endLine) {
                lines.push(document.lineAt(i).text);
            }
        }
        
        if (totalLines > LearnHoverProvider.MAX_PREVIEW_LINES) {
            lines.push(`... (${totalLines - LearnHoverProvider.MAX_PREVIEW_LINES} more lines)`);
        }
        
        return lines.join('\n');
    }
}
