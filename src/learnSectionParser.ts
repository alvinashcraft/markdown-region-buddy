import * as vscode from 'vscode';

/**
 * Represents a Learn section (moniker, zone pivot, or tab)
 */
export interface LearnSection {
    type: 'moniker' | 'zone' | 'tab';
    name: string;
    startLine: number;
    endLine: number;
    indentLevel: number;
    range: vscode.Range;
}

/**
 * Parses Learn sections from a markdown document
 */
export class LearnSectionParser {
    private static readonly MONIKER_START = /^(\s*):::\s*moniker range="([^"]+)"/;
    private static readonly MONIKER_END = /^(\s*):::\s*moniker-end/;
    private static readonly ZONE_START = /^(\s*):::\s*zone pivot="([^"]+)"/;
    private static readonly ZONE_END = /^(\s*):::\s*zone-end/;
    private static readonly TAB_HEADER = /^(\s*)# \[([^\]]+)\]\(#tab\/([^)]+)\)/;
    private static readonly TAB_END = /^(\s*)---\s*$/;

    /**
     * Parse all Learn sections in a document
     */
    public static parseSections(document: vscode.TextDocument): LearnSection[] {
        const sections: LearnSection[] = [];
        const lineCount = document.lineCount;
        
        // Parse all sections including nested ones
        for (let i = 0; i < lineCount; i++) {
            const line = document.lineAt(i).text;
            
            // Check for moniker
            const monikerMatch = line.match(this.MONIKER_START);
            if (monikerMatch) {
                const section = this.parseMonikerSection(document, i, monikerMatch);
                if (section) {
                    sections.push(section);
                }
            }
            
            // Check for zone pivot
            const zoneMatch = line.match(this.ZONE_START);
            if (zoneMatch) {
                const section = this.parseZoneSection(document, i, zoneMatch);
                if (section) {
                    sections.push(section);
                }
            }
            
            // Check for tab
            const tabMatch = line.match(this.TAB_HEADER);
            if (tabMatch) {
                const section = this.parseTabSection(document, i, tabMatch);
                if (section) {
                    sections.push(section);
                }
            }
        }
        
        return sections;
    }

    /**
     * Find the section at a specific line
     * If there are nested sections, returns the innermost (most specific) one
     */
    public static findSectionAtLine(document: vscode.TextDocument, lineNumber: number): LearnSection | undefined {
        const sections = this.parseSections(document);
        
        // Find all sections that contain this line
        const containingSections = sections.filter(section => 
            lineNumber >= section.startLine && lineNumber <= section.endLine
        );
        
        if (containingSections.length === 0) {
            return undefined;
        }
        
        // Return the most specific section (smallest range = innermost)
        return containingSections.reduce((innermost, current) => {
            const innermostSize = innermost.endLine - innermost.startLine;
            const currentSize = current.endLine - current.startLine;
            return currentSize < innermostSize ? current : innermost;
        });
    }

    /**
     * Find all sections with a specific type and name
     */
    public static findSectionsByName(document: vscode.TextDocument, type: string, name: string): LearnSection[] {
        const sections = this.parseSections(document);
        return sections.filter(section => section.type === type && section.name === name);
    }

    /**
     * Get all unique section types and names in the document
     */
    public static getUniqueSections(document: vscode.TextDocument): Array<{ type: string, name: string, label: string }> {
        const sections = this.parseSections(document);
        const uniqueMap = new Map<string, { type: string, name: string, label: string }>();
        
        for (const section of sections) {
            const key = `${section.type}:${section.name}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, {
                    type: section.type,
                    name: section.name,
                    label: `${section.type}: ${section.name}`
                });
            }
        }
        
        return Array.from(uniqueMap.values());
    }

    private static parseMonikerSection(
        document: vscode.TextDocument, 
        startLine: number, 
        match: RegExpMatchArray
    ): LearnSection | undefined {
        const indent = match[1];
        const name = match[2];
        const indentLevel = indent.length;
        
        // Find the matching end
        for (let i = startLine + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            const endMatch = line.match(this.MONIKER_END);
            
            if (endMatch && endMatch[1].length === indentLevel) {
                return {
                    type: 'moniker',
                    name,
                    startLine,
                    endLine: i,
                    indentLevel,
                    range: new vscode.Range(startLine, 0, i, document.lineAt(i).text.length)
                };
            }
        }
        
        return undefined;
    }

    private static parseZoneSection(
        document: vscode.TextDocument, 
        startLine: number, 
        match: RegExpMatchArray
    ): LearnSection | undefined {
        const indent = match[1];
        const name = match[2];
        const indentLevel = indent.length;
        
        // Find the matching end
        for (let i = startLine + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            const endMatch = line.match(this.ZONE_END);
            
            if (endMatch && endMatch[1].length === indentLevel) {
                return {
                    type: 'zone',
                    name,
                    startLine,
                    endLine: i,
                    indentLevel,
                    range: new vscode.Range(startLine, 0, i, document.lineAt(i).text.length)
                };
            }
        }
        
        return undefined;
    }

    private static parseTabSection(
        document: vscode.TextDocument, 
        startLine: number, 
        match: RegExpMatchArray
    ): LearnSection | undefined {
        const indent = match[1];
        const label = match[2];
        const tabId = match[3];
        const indentLevel = indent.length;
        
        // Find the end (either another tab header or horizontal rule)
        for (let i = startLine + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            
            // Check for horizontal rule (end of tab group)
            const endMatch = line.match(this.TAB_END);
            if (endMatch) {
                return {
                    type: 'tab',
                    name: tabId,
                    startLine,
                    endLine: i,
                    indentLevel,
                    range: new vscode.Range(startLine, 0, i, document.lineAt(i).text.length)
                };
            }
            
            // Check for next tab header (end of current tab)
            const nextTabMatch = line.match(this.TAB_HEADER);
            if (nextTabMatch && nextTabMatch[1].length === indentLevel) {
                return {
                    type: 'tab',
                    name: tabId,
                    startLine,
                    endLine: i - 1,
                    indentLevel,
                    range: new vscode.Range(startLine, 0, i - 1, document.lineAt(i - 1).text.length)
                };
            }
        }
        
        // If we reach the end of the document
        return {
            type: 'tab',
            name: tabId,
            startLine,
            endLine: document.lineCount - 1,
            indentLevel,
            range: new vscode.Range(startLine, 0, document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length)
        };
    }
}
