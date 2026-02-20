import * as vscode from 'vscode';
import { LearnSectionParser } from './learnSectionParser';
import { MarkdownFoldingHelper } from './markdownFoldingHelper';

/**
 * Provides folding ranges for Learn sections and standard markdown elements.
 * Combines Learn-specific folds (monikers, zone pivots, tabs) with standard
 * markdown folds (headings, code blocks, tables) so this extension can serve
 * as the sole folding provider for markdown files, avoiding conflicts with
 * VS Code's built-in markdown folding provider.
 */
export class LearnFoldingProvider implements vscode.FoldingRangeProvider {
    public provideFoldingRanges(
        document: vscode.TextDocument,
        context: vscode.FoldingContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.FoldingRange[]> {
        // Learn section folds (monikers, zone pivots, tabs)
        const sections = LearnSectionParser.parseSections(document);
        
        const learnRanges = sections.map(section => {
            if (section.endLine <= section.startLine) {
                return null;
            }
            
            const foldEnd = Math.max(section.startLine, section.endLine - 1);
            
            return new vscode.FoldingRange(
                section.startLine,
                foldEnd,
                vscode.FoldingRangeKind.Region
            );
        }).filter(range => range !== null) as vscode.FoldingRange[];

        // Standard markdown folds (headings, code blocks, tables)
        const markdownRanges = MarkdownFoldingHelper.getFoldingRanges(document);

        return [...learnRanges, ...markdownRanges];
    }
}
