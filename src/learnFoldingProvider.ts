import * as vscode from 'vscode';
import { LearnSectionParser, LearnSection } from './learnSectionParser';
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

        // Clip markdown ranges that overlap with Learn section boundaries.
        // VS Code requires folding ranges to be properly nested; overlapping
        // (non-nested) ranges from the same provider cause fold indicators
        // to disappear.
        //
        // Two cases:
        //   1. Range starts INSIDE a section and extends past its end
        //      → clip to one line before the section's end marker.
        //   2. Range starts OUTSIDE all sections and partially overlaps one
        //      (enters it but doesn't fully contain it)
        //      → clip to one line before the partially overlapped section's start.
        //      If the range fully contains a section, that's proper nesting — no clip.
        const clippedMarkdownRanges = markdownRanges.map(range => {
            const container = this.findContainingSection(sections, range.start);
            if (container) {
                // Case 1 — started inside a section, extends past it
                if (range.end > container.endLine) {
                    const clippedEnd = container.endLine - 1;
                    if (clippedEnd <= range.start) {
                        return null;
                    }
                    return new vscode.FoldingRange(range.start, clippedEnd, range.kind);
                }
            } else {
                // Case 2 — started outside all sections; check for partial overlap
                const overlapped = this.findFirstPartiallyOverlappedSection(sections, range.start, range.end);
                if (overlapped) {
                    const clippedEnd = overlapped.startLine - 1;
                    if (clippedEnd <= range.start) {
                        return null;
                    }
                    return new vscode.FoldingRange(range.start, clippedEnd, range.kind);
                }
            }
            return range;
        }).filter(range => range !== null) as vscode.FoldingRange[];

        return [...learnRanges, ...clippedMarkdownRanges];
    }

    /**
     * Find the innermost Learn section that contains the given line.
     */
    private findContainingSection(
        sections: LearnSection[],
        line: number
    ): LearnSection | undefined {
        let best: LearnSection | undefined;
        for (const section of sections) {
            if (line > section.startLine && line < section.endLine) {
                if (!best || (section.endLine - section.startLine) < (best.endLine - best.startLine)) {
                    best = section;
                }
            }
        }
        return best;
    }

    /**
     * Find the first Learn section that a markdown range partially overlaps.
     * "Partially overlaps" means the range enters the section (crosses its
     * startLine) but does NOT fully contain it (ends before its endLine).
     * If the range fully contains a section, that's proper nesting — no clip needed.
     */
    private findFirstPartiallyOverlappedSection(
        sections: LearnSection[],
        rangeStart: number,
        rangeEnd: number
    ): LearnSection | undefined {
        let first: LearnSection | undefined;
        for (const section of sections) {
            if (section.startLine > rangeStart && section.startLine <= rangeEnd && rangeEnd < section.endLine) {
                if (!first || section.startLine < first.startLine) {
                    first = section;
                }
            }
        }
        return first;
    }
}
