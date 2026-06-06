# Context Snapshot

One command that packages your open files, cursor position, recent errors, and terminal output into a shareable markdown snapshot.

**GitHub:** https://github.com/YOUR_USERNAME/context-snapshot

## Features

- **Capture Open Files** — All open editor files with full content and cursor positions
- **Collect Diagnostics** — All errors and warnings in your workspace
- **Terminal Info** — Name of the active terminal (buffer content requires Shell Integration)
- **Workspace Metadata** — Workspace name, path, VS Code version, and timestamp

## Usage

### Keybinding
Press `Ctrl+Shift+Alt+S` (Windows/Linux) or `Cmd+Shift+Alt+S` (macOS) to capture your context.

### Command Palette
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. Search for "Snapshot Context"
3. Press Enter

The snapshot will be copied to your clipboard as a markdown document.

## Requirements

- VS Code 1.80.0 or later

## Known Limitations

- **Terminal Buffer Content**: Full terminal output requires the Shell Integration API (available in VS Code 1.93+). Currently, the extension captures the terminal name only with a placeholder message.
- **Unsupported URI Schemes**: Only files with the `file://` URI scheme are captured (excludes output panels, settings, etc.)

## Extension Settings

This extension does not require any configuration.

## Troubleshooting

- **"No data captured"**: Ensure you have at least one file open in an editor
- **Keybinding not working**: Check VS Code keybindings settings and ensure the command is not shadowed by another extension
- **Clipboard not updated**: Verify your system clipboard is accessible

## License

MIT

## Contributing

Contributions are welcome! Please submit issues and pull requests on GitHub.
