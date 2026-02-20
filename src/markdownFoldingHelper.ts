import * as vscode from 'vscode';

/**
 * Provides standard markdown folding ranges (headings, code blocks, tables)
 * to replace the built-in markdown folding provider when this extension
 * is configured as the default folding range provider.
 */
export class MarkdownFoldingHelper {
    private static readonly HEADING = /^(#{1,6})\s/;
    private static readonly FENCE_OPEN = /^(\s*)(```|~~~)/;
    private static readonly TABLE_ROW = /^\s*\|/;
    private static readonly TABLE_SEPARATOR = /^\s*\|[\s-:|]+\|\s*$/;
    private static readonly TAB_HEADER = /^(\s*)#{1,6} \[([^\]]+)\]\(#tab\/([^)]+)\)/;

    /**
     * Parse standard markdown folding ranges from a document.
     * Detects headings, fenced code blocks, and tables.
     * Skips Learn tab header lines to avoid conflicting with LearnSectionParser.
     */
    public static getFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
        const lineCount = document.lineCount;
        const lines: string[] = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(document.lineAt(i).text);
        }

        const ranges: vscode.FoldingRange[] = [];
        const codeBlockRanges = this.parseCodeBlocks(lines);
        const codeBlockSet = this.buildCodeBlockLineSet(codeBlockRanges);

        // Add code block fold ranges
        for (const cb of codeBlockRanges) {
            if (cb.endLine > cb.startLine) {
                ranges.push(new vscode.FoldingRange(cb.startLine, cb.endLine));
            }
        }

        // Add heading fold ranges (skipping lines inside code blocks and Learn tab headers)
        const headingRanges = this.parseHeadings(lines, codeBlockSet);
        for (const hr of headingRanges) {
            ranges.push(hr);
        }

        // Add table fold ranges (skipping lines inside code blocks)
        const tableRanges = this.parseTables(lines, codeBlockSet);
        for (const tr of tableRanges) {
            ranges.push(tr);
        }

        return ranges;
    }

    /**
     * Detect fenced code blocks (``` or ~~~).
     * Returns start/end line pairs for each code block.
     */
    private static parseCodeBlocks(lines: string[]): Array<{ startLine: number; endLine: number }> {
        const blocks: Array<{ startLine: number; endLine: number }> = [];
        let i = 0;

        while (i < lines.length) {
            const openMatch = lines[i].match(this.FENCE_OPEN);
            if (openMatch) {
                const fence = openMatch[2];
                const indent = openMatch[1].length;
                const startLine = i;
                i++;

                // Scan for closing fence with same or less indentation and same delimiter
                while (i < lines.length) {
                    const closeMatch = lines[i].match(this.FENCE_OPEN);
                    if (closeMatch && closeMatch[2] === fence && closeMatch[1].length <= indent) {
                        // Back up endLine if the closing fence line is the end;
                        // fold shows opening fence, hides content, closing fence stays visible
                        blocks.push({ startLine, endLine: i });
                        i++;
                        break;
                    }
                    i++;
                }
                // If no closing fence found, don't create a range
            } else {
                i++;
            }
        }

        return blocks;
    }

    /**
     * Build a Set of line numbers that are inside fenced code blocks.
     */
    private static buildCodeBlockLineSet(codeBlocks: Array<{ startLine: number; endLine: number }>): Set<number> {
        const set = new Set<number>();
        for (const cb of codeBlocks) {
            for (let i = cb.startLine; i <= cb.endLine; i++) {
                set.add(i);
            }
        }
        return set;
    }

    /**
     * Detect ATX headings (# through ######).
     * Each heading folds from its line to the last non-blank line before
     * the next heading of the same or higher level, or EOF.
     * Skips headings inside fenced code blocks and Learn tab header lines.
     */
    private static parseHeadings(lines: string[], codeBlockLines: Set<number>): vscode.FoldingRange[] {
        // Collect all heading positions and levels
        const headings: Array<{ line: number; level: number }> = [];
        for (let i = 0; i < lines.length; i++) {
            if (codeBlockLines.has(i)) {
                continue;
            }
            // Skip Learn tab headers — these are handled by LearnSectionParser
            if (this.TAB_HEADER.test(lines[i])) {
                continue;
            }
            const match = lines[i].match(this.HEADING);
            if (match) {
                headings.push({ line: i, level: match[1].length });
            }
        }

        const ranges: vscode.FoldingRange[] = [];

        for (let h = 0; h < headings.length; h++) {
            const current = headings[h];

            // Find the boundary: next heading of same or higher (<=) level, or EOF
            let boundaryLine = lines.length;
            if (h + 1 < headings.length) {
                const next = headings[h + 1];
                if (next.level <= current.level) {
                    boundaryLine = next.line;
                } else {
                    // Find the next heading at same or higher level
                    for (let j = h + 1; j < headings.length; j++) {
                        if (headings[j].level <= current.level) {
                            boundaryLine = headings[j].line;
                            break;
                        }
                    }
                }
            }

            // endLine is the last non-blank line before boundaryLine
            let endLine = boundaryLine - 1;
            while (endLine > current.line && lines[endLine].trim() === '') {
                endLine--;
            }

            if (endLine > current.line) {
                ranges.push(new vscode.FoldingRange(current.line, endLine));
            }
        }

        return ranges;
    }

    /**
     * Detect pipe-delimited markdown tables.
     * A table is a run of consecutive lines starting with |, where the second
     * line is a separator row (|---|---|).
     */
    private static parseTables(lines: string[], codeBlockLines: Set<number>): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        let i = 0;

        while (i < lines.length) {
            if (codeBlockLines.has(i) || !this.TABLE_ROW.test(lines[i])) {
                i++;
                continue;
            }

            // Potential table start — look for separator on next line
            const tableStart = i;
            if (i + 1 < lines.length && !codeBlockLines.has(i + 1) && this.TABLE_SEPARATOR.test(lines[i + 1])) {
                // Found header + separator — scan for end of table
                i += 2;
                while (i < lines.length && !codeBlockLines.has(i) && this.TABLE_ROW.test(lines[i])) {
                    i++;
                }
                const tableEnd = i - 1;

                // Back up if trailing line is blank
                let endLine = tableEnd;
                while (endLine > tableStart && lines[endLine].trim() === '') {
                    endLine--;
                }

                if (endLine > tableStart) {
                    ranges.push(new vscode.FoldingRange(tableStart, endLine));
                }
            } else {
                i++;
            }
        }

        return ranges;
    }
}
