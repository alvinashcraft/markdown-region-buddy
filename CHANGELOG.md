# Changelog

All notable changes to Markdown Region Buddy will be documented in this file.

## [0.0.4] - 2026-03-31

### Added
- Multi-select support in the **Focus on Section** picker — select multiple section types/names at once
- Compound zone pivot matching in Focus mode
- Installation and setup section in the Quick Reference guide

## [0.0.3] - 2026-03-30

### Added
- Folding support for blockquotes, front matter, HTML blocks, `<!-- #region -->` markers, and lists
- Standard markdown fold detection pipeline with excluded-line tracking to prevent false positives

### Changed
- Removed redundant Expand/Collapse All Sections commands; consolidated into region-scoped commands
- Clarified region naming in command titles

## [0.0.2] - 2026-03-30

### Added
- Separate expand/collapse commands for all sections vs. Learn-specific sections
- Configurable default folding provider setting and command
- Debounced decoration updates to avoid re-parsing on every keystroke

### Changed
- Renamed extension to Markdown Region Buddy
- Updated extension ID and repository URL
- Resized extension icons

## [0.0.1] - 2026-02-20

### Added
- Initial release
- Folding support for markdown regions (monikers, zone pivots, tabs)
- Hover previews for collapsed sections
- Context menu commands for expand/collapse operations
- Keyboard shortcuts for quick section management
- Focus mode to expand specific sections while collapsing others
- Optional background color decorations for section types
- Command Palette integration
