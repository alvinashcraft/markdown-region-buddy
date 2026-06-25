# Security Notes

This document summarizes common security concerns for VS Code extensions and how Markdown Region Buddy handles them.

## Scope and threat model

Markdown Region Buddy is a local editor-assist extension. It parses markdown text and triggers folding, hover, and decoration behavior through the VS Code API.

The extension does not:

- execute shell commands
- call external services or open network connections
- read or write files outside normal editor/document access
- download or run scripts

Primary risks are therefore input-handling and UI-surface risks (for example, unsafe rendering in hovers), not remote code execution pipelines.

## Common extension security concerns and project status

### 1. Command injection / arbitrary process execution

Concern:

- Extensions that call terminals, shell commands, or child processes can be abused if untrusted input is passed through.

Markdown Region Buddy:

- No use of terminal/process APIs.
- Commands are limited to VS Code folding operations such as `editor.fold`, `editor.unfold`, and `editor.toggleFold`.

Result:

- This extension avoids command-injection and process-execution risk classes.

### 2. Network exfiltration / telemetry overreach

Concern:

- Extensions may exfiltrate workspace content via HTTP clients, telemetry, or third-party SDKs.

Markdown Region Buddy:

- No HTTP/network client usage.
- No custom telemetry pipeline.
- Works fully offline.

Result:

- No network exfiltration path in current implementation.

### 3. Unsafe file-system access

Concern:

- Broad file reads/writes can expose secrets or alter source unexpectedly.

Markdown Region Buddy:

- Operates on currently opened markdown documents through VS Code document APIs.
- Does not persist transformed copies of content.
- Settings writes are limited to explicit folding-provider configuration initiated by user action or setting.

Result:

- Minimal file-system attack surface.

### 4. Unsafe webview / HTML script execution

Concern:

- Webviews can introduce XSS or script-injection risk if CSP and sanitization are weak.

Markdown Region Buddy:

- No webviews are used.
- UI surfaces are native VS Code primitives (hover, quick pick, context menu, decorations).

Result:

- Avoids webview-specific security risks.

### 5. Hover content trust and markdown injection

Concern:

- Trusted markdown in hover/tooltips can enable command links if untrusted text is rendered without sanitization.

Markdown Region Buddy:

- Hover previews are generated from local document text.
- Content body is rendered as a markdown code block.
- Current implementation sets `MarkdownString.isTrusted = true` in the hover provider.

Result:

- Practical risk is limited because this extension does not add command URIs itself and content is local.
- However, setting trusted markdown is a hardening point to review over time.

Hardening recommendation:

- Prefer `isTrusted = false` unless a trusted capability is explicitly required.
- If trusted markdown is required in future features, sanitize interpolated fields and block command/link schemes from user-derived values.

### 6. Denial of service (performance abuse)

Concern:

- Complex parsing on every keystroke can degrade editor responsiveness.

Markdown Region Buddy:

- Decoration updates are debounced.
- Parsing is deterministic line scanning with bounded behavior.

Result:

- Lower risk of editor lockup from normal usage patterns.

## Dependency and supply-chain posture

Current posture:

- Runtime dependency surface is intentionally small (no runtime npm dependencies beyond VS Code platform APIs and bundled extension code).
- Build-time tooling is standard TypeScript/ESLint/Webpack.

Recommended maintenance:

- Run `npm audit` before releases.
- Keep dev tooling versions current.
- Use a lockfile in source control and review dependency updates before publish.

## Data handling and privacy

- Parsed content stays in-process inside VS Code.
- No outbound transmission of document content.
- No authentication tokens or credentials are requested by the extension.

## Responsible disclosure

If you find a vulnerability, please report it privately before public disclosure:

- Open a GitHub issue requesting a private security contact path, or
- Contact the publisher directly through the repository profile.

If this repository enables GitHub Security Advisories in the future, prefer that channel.
