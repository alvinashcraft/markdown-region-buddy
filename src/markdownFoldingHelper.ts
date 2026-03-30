import * as vscode from 'vscode';

/**
 * Provides standard markdown folding ranges (headings, code blocks, tables,
 * front matter, blockquotes, HTML blocks, region markers, and lists)
 * to replace the built-in markdown folding provider when this extension
 * is configured as the default folding range provider.
 */
export class MarkdownFoldingHelper {
    private static readonly HEADING = /^(#{1,6})\s/;
    private static readonly FENCE_OPEN = /^(\s*)(```|~~~)/;
    private static readonly TABLE_ROW = /^\s*\|/;
    private static readonly TABLE_SEPARATOR = /^\s*\|[\s-:|]+\|\s*$/;
    private static readonly TAB_HEADER = /^(\s*)#{1,6} \[([^\]]+)\]\(#tab\/([^)]+)\)/;
    private static readonly FRONT_MATTER_DELIMITER = /^---\s*$/;
    private static readonly BLOCKQUOTE_LINE = /^\s*>/;
    private static readonly REGION_START = /^\s*<!--\s*#region\b/;
    private static readonly REGION_END = /^\s*<!--\s*#endregion\b/;
    private static readonly LIST_ITEM = /^(\s*)([-*+]|\d+[.)]) /;
    private static readonly HTML_BLOCK_OPEN = /^(\s*)<(address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hgroup|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|pre|script|search|section|source|style|summary|table|tbody|td|template|tfoot|th|thead|title|tr|track|ul)\b[^>]*>/i;
    private static readonly HTML_COMMENT_OPEN = /^(\s*)<!--/;

    /**
     * Parse standard markdown folding ranges from a document.
     * Detects headings, fenced code blocks, tables, front matter,
     * blockquotes, HTML blocks, region markers, and lists.
     * Skips tab header lines to avoid conflicting with LearnSectionParser.
     *
     * Detection order matters — earlier detections feed into the excluded
     * set so later parsers don't produce false positives.
     */
    public static getFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
        const lineCount = document.lineCount;
        const lines: string[] = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(document.lineAt(i).text);
        }

        const ranges: vscode.FoldingRange[] = [];

        // 1. Code blocks
        const codeBlockRanges = this.parseCodeBlocks(lines);
        const excludedLines = this.buildLineSet(codeBlockRanges);
        for (const cb of codeBlockRanges) {
            if (cb.endLine > cb.startLine) {
                ranges.push(new vscode.FoldingRange(cb.startLine, cb.endLine));
            }
        }

        // 2. Front matter — must come before headings so # comments are excluded
        const frontMatter = this.parseFrontMatter(lines);
        if (frontMatter) {
            this.addToLineSet(excludedLines, frontMatter.startLine, frontMatter.endLine);
            if (frontMatter.endLine > frontMatter.startLine) {
                ranges.push(new vscode.FoldingRange(frontMatter.startLine, frontMatter.endLine));
            }
        }

        // 3. HTML blocks — add to excluded set so headings/tables inside aren't misdetected
        const htmlBlockRanges = this.parseHtmlBlocks(lines, excludedLines);
        for (const hb of htmlBlockRanges) {
            this.addToLineSet(excludedLines, hb.startLine, hb.endLine);
            if (hb.endLine > hb.startLine) {
                ranges.push(new vscode.FoldingRange(hb.startLine, hb.endLine));
            }
        }

        // 4. Region markers
        const regionRanges = this.parseRegionMarkers(lines, excludedLines);
        for (const rr of regionRanges) {
            ranges.push(rr);
        }

        // 5. Blockquotes
        const blockquoteRanges = this.parseBlockquotes(lines, excludedLines);
        for (const bq of blockquoteRanges) {
            ranges.push(bq);
        }

        // 6. Lists
        const listRanges = this.parseLists(lines, excludedLines);
        for (const lr of listRanges) {
            ranges.push(lr);
        }

        // 7. Headings (existing — now skips front matter + HTML blocks too)
        const headingRanges = this.parseHeadings(lines, excludedLines);
        for (const hr of headingRanges) {
            ranges.push(hr);
        }

        // 8. Tables (existing — now skips front matter + HTML blocks too)
        const tableRanges = this.parseTables(lines, excludedLines);
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
     * Build a Set of line numbers from start/end pairs.
     */
    private static buildLineSet(ranges: Array<{ startLine: number; endLine: number }>): Set<number> {
        const set = new Set<number>();
        for (const r of ranges) {
            for (let i = r.startLine; i <= r.endLine; i++) {
                set.add(i);
            }
        }
        return set;
    }

    /**
     * Add a range of lines to an existing exclusion set.
     */
    private static addToLineSet(set: Set<number>, startLine: number, endLine: number): void {
        for (let i = startLine; i <= endLine; i++) {
            set.add(i);
        }
    }

    /**
     * Detect YAML front matter at the start of the document.
     * Front matter must begin at line 0 with `---` (no leading whitespace)
     * and end with a subsequent `---` line.
     */
    private static parseFrontMatter(lines: string[]): { startLine: number; endLine: number } | null {
        if (lines.length < 2 || !this.FRONT_MATTER_DELIMITER.test(lines[0])) {
            return null;
        }

        for (let i = 1; i < lines.length; i++) {
            if (this.FRONT_MATTER_DELIMITER.test(lines[i])) {
                return { startLine: 0, endLine: i };
            }
        }

        return null;
    }

    /**
     * Detect multi-line HTML blocks.
     * Recognizes block-level HTML elements and HTML comments.
     * Does NOT match region markers (<!-- #region --> / <!-- #endregion -->).
     */
    private static parseHtmlBlocks(lines: string[], excludedLines: Set<number>): Array<{ startLine: number; endLine: number }> {
        const blocks: Array<{ startLine: number; endLine: number }> = [];
        let i = 0;

        while (i < lines.length) {
            if (excludedLines.has(i)) {
                i++;
                continue;
            }

            // Check for HTML comment (but not region markers)
            const commentMatch = lines[i].match(this.HTML_COMMENT_OPEN);
            if (commentMatch && !this.REGION_START.test(lines[i]) && !this.REGION_END.test(lines[i])) {
                // Check for single-line comment
                if (lines[i].includes('-->')) {
                    i++;
                    continue;
                }
                const startLine = i;
                i++;
                while (i < lines.length) {
                    if (lines[i].includes('-->')) {
                        blocks.push({ startLine, endLine: i });
                        i++;
                        break;
                    }
                    i++;
                }
                continue;
            }

            // Check for block-level HTML element
            const htmlMatch = lines[i].match(this.HTML_BLOCK_OPEN);
            if (htmlMatch) {
                const tagName = htmlMatch[2].toLowerCase();
                const startLine = i;

                // Self-closing or single-line element
                if (lines[i].match(new RegExp(`</${tagName}\\s*>`, 'i')) || lines[i].match(/\/>\s*$/)) {
                    i++;
                    continue;
                }

                const closePattern = new RegExp(`</${tagName}\\s*>`, 'i');
                i++;
                while (i < lines.length) {
                    if (closePattern.test(lines[i])) {
                        blocks.push({ startLine, endLine: i });
                        i++;
                        break;
                    }
                    // End on blank line (CommonMark type 6/7 behavior)
                    if (lines[i].trim() === '') {
                        if (i - 1 > startLine) {
                            blocks.push({ startLine, endLine: i - 1 });
                        }
                        i++;
                        break;
                    }
                    i++;
                }
                continue;
            }

            i++;
        }

        return blocks;
    }

    /**
     * Detect HTML-style region markers: <!-- #region --> / <!-- #endregion -->.
     * Supports nesting via a stack.
     */
    private static parseRegionMarkers(lines: string[], excludedLines: Set<number>): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const stack: number[] = [];

        for (let i = 0; i < lines.length; i++) {
            if (excludedLines.has(i)) {
                continue;
            }

            if (this.REGION_START.test(lines[i])) {
                stack.push(i);
            } else if (this.REGION_END.test(lines[i])) {
                if (stack.length > 0) {
                    const startLine = stack.pop()!;
                    ranges.push(new vscode.FoldingRange(startLine, i, vscode.FoldingRangeKind.Region));
                }
            }
        }

        return ranges;
    }

    /**
     * Detect blockquote regions (lines starting with >).
     * A blockquote is a contiguous run of lines starting with >.
     * Only folds blockquotes spanning 2+ lines.
     */
    private static parseBlockquotes(lines: string[], excludedLines: Set<number>): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        let i = 0;

        while (i < lines.length) {
            if (excludedLines.has(i) || !this.BLOCKQUOTE_LINE.test(lines[i])) {
                i++;
                continue;
            }

            const startLine = i;
            i++;

            // Continue the blockquote through > lines and blank lines
            // followed by more > lines (lazy continuation)
            while (i < lines.length && !excludedLines.has(i)) {
                if (this.BLOCKQUOTE_LINE.test(lines[i])) {
                    i++;
                } else if (lines[i].trim() === '' && i + 1 < lines.length && this.BLOCKQUOTE_LINE.test(lines[i + 1])) {
                    // Blank line followed by another blockquote line — continue
                    i++;
                } else {
                    break;
                }
            }

            const endLine = i - 1;
            // Trim trailing blank lines
            let trimmedEnd = endLine;
            while (trimmedEnd > startLine && lines[trimmedEnd].trim() === '') {
                trimmedEnd--;
            }

            if (trimmedEnd > startLine) {
                ranges.push(new vscode.FoldingRange(startLine, trimmedEnd));
            }
        }

        return ranges;
    }

    /**
     * Detect list items and nested sublists.
     * Folds multi-line list items and sublists.
     * List items start with `- `, `* `, `+ `, or `1. ` (ordered).
     */
    private static parseLists(lines: string[], excludedLines: Set<number>): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const items: Array<{ line: number; indent: number; contentIndent: number }> = [];

        // Collect all list item positions
        for (let i = 0; i < lines.length; i++) {
            if (excludedLines.has(i)) {
                continue;
            }
            const match = lines[i].match(this.LIST_ITEM);
            if (match) {
                const indent = match[1].length;
                const marker = match[2];
                // Content starts after the marker and its trailing space
                const contentIndent = indent + marker.length + 1;
                items.push({ line: i, indent, contentIndent });
            }
        }

        // For each list item, find where it ends
        for (let idx = 0; idx < items.length; idx++) {
            const current = items[idx];
            let endLine = current.line;

            // Scan forward through subsequent lines
            for (let i = current.line + 1; i < lines.length; i++) {
                if (excludedLines.has(i)) {
                    // Skip excluded lines but don't break the list item
                    endLine = i;
                    continue;
                }

                const trimmed = lines[i].trim();

                // Another list item at same or lesser indent ends this item
                const nextItem = lines[i].match(this.LIST_ITEM);
                if (nextItem && nextItem[1].length <= current.indent) {
                    break;
                }

                // A non-blank, non-indented line that isn't a deeper list item ends the item
                if (trimmed !== '' && !nextItem) {
                    const lineIndent = lines[i].length - lines[i].trimStart().length;
                    if (lineIndent < current.contentIndent) {
                        break;
                    }
                }

                // Blank line: only continue if the next non-blank line is indented enough
                if (trimmed === '') {
                    let nextNonBlank = i + 1;
                    while (nextNonBlank < lines.length && lines[nextNonBlank].trim() === '') {
                        nextNonBlank++;
                    }
                    if (nextNonBlank >= lines.length) {
                        break;
                    }
                    const nextIndent = lines[nextNonBlank].length - lines[nextNonBlank].trimStart().length;
                    const nextIsListItem = this.LIST_ITEM.test(lines[nextNonBlank]);
                    if (nextIndent < current.contentIndent && !(nextIsListItem && nextIndent > current.indent)) {
                        break;
                    }
                }

                endLine = i;
            }

            // Trim trailing blank lines
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
     * Detect ATX headings (# through ######).
     * Each heading folds from its line to the last non-blank line before
     * the next heading of the same or higher level, or EOF.
     * Skips headings inside excluded regions and tab header lines.
     */
    private static parseHeadings(lines: string[], excludedLines: Set<number>): vscode.FoldingRange[] {
        // Collect all heading positions and levels
        const headings: Array<{ line: number; level: number }> = [];
        for (let i = 0; i < lines.length; i++) {
            if (excludedLines.has(i)) {
                continue;
            }
            // Skip tab headers — these are handled by LearnSectionParser
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
    private static parseTables(lines: string[], excludedLines: Set<number>): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        let i = 0;

        while (i < lines.length) {
            if (excludedLines.has(i) || !this.TABLE_ROW.test(lines[i])) {
                i++;
                continue;
            }

            // Potential table start — look for separator on next line
            const tableStart = i;
            if (i + 1 < lines.length && !excludedLines.has(i + 1) && this.TABLE_SEPARATOR.test(lines[i + 1])) {
                // Found header + separator — scan for end of table
                i += 2;
                while (i < lines.length && !excludedLines.has(i) && this.TABLE_ROW.test(lines[i])) {
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
