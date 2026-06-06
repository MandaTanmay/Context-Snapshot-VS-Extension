import * as vscode from 'vscode';

/**
 * Extension activation point
 * Called when the command is first invoked
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('Context Snapshot extension is now active');

	// Register the main command handler
	let disposable = vscode.commands.registerCommand('contextSnapshot.capture', async () => {
		await captureContextSnapshot();
	});

	context.subscriptions.push(disposable);
}

/**
 * Extension deactivation point
 */
export function deactivate() {
	// Cleanup logic here if needed
}

/**
 * Main function to capture and prepare the context snapshot
 */
async function captureContextSnapshot() {
	try {
		// Collect all necessary data
		const timestamp = new Date().toISOString();
		const workspaceInfo = getWorkspaceInfo();
		const vsCodeVersion = vscode.version;
		const openFilesData = await collectOpenFiles();
		const diagnosticsData = collectDiagnostics();
		const terminalInfo = getActiveTerminalInfo();

		// Build the markdown snapshot
		const markdown = buildMarkdownSnapshot(
			timestamp,
			workspaceInfo,
			vsCodeVersion,
			openFilesData,
			diagnosticsData,
			terminalInfo
		);

		// Copy to clipboard
		await vscode.env.clipboard.writeText(markdown);

		// Show success message
		vscode.window.showInformationMessage('Context snapshot copied to clipboard!');

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		vscode.window.showErrorMessage(`Failed to capture snapshot: ${errorMessage}`);
		console.error('Context Snapshot Error:', error);
	}
}

/**
 * Get workspace folder information
 */
function getWorkspaceInfo(): { name: string; path: string } | null {
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		return null;
	}

	const folder = vscode.workspace.workspaceFolders[0];
	return {
		name: folder.name,
		path: folder.uri.fsPath,
	};
}

/**
 * Collect all open file data including content, cursor position, and dirty status
 */
async function collectOpenFiles(): Promise<OpenFileData[]> {
	const openFiles: OpenFileData[] = [];

	// Iterate through all visible text editors
	for (const editor of vscode.window.visibleTextEditors) {
		const document = editor.document;
		const selection = editor.selection;

		// Skip unsupported schemes (like output panels, untitled, etc.)
		if (document.uri.scheme !== 'file') {
			continue;
		}

		const relativePath = vscode.workspace.asRelativePath(document.uri);
		const content = document.getText();
		const languageId = document.languageId;
		const isDirty = document.isDirty;
		const cursorLine = selection.active.line + 1; // Convert to 1-based line numbers
		const cursorColumn = selection.active.character + 1; // Convert to 1-based columns

		openFiles.push({
			path: relativePath,
			content,
			languageId,
			isDirty,
			cursorLine,
			cursorColumn,
		});
	}

	return openFiles;
}

/**
 * Collect all diagnostics (errors and warnings) across the workspace
 */
function collectDiagnostics(): DiagnosticData[] {
	const diagnosticsData: DiagnosticData[] = [];

	// Get all URIs with diagnostics
	const allDiagnostics = vscode.languages.getDiagnostics();

	for (const [uri, diagnostics] of allDiagnostics) {
		// Filter for only Errors and Warnings (skip Hints and Info)
		const filteredDiags = diagnostics.filter(
			diag => diag.severity === vscode.DiagnosticSeverity.Error ||
				diag.severity === vscode.DiagnosticSeverity.Warning
		);

		for (const diag of filteredDiags) {
			const relativePath = vscode.workspace.asRelativePath(uri);
			const lineNumber = diag.range.start.line + 1; // Convert to 1-based
			const severity = diag.severity === vscode.DiagnosticSeverity.Error ? 'Error' : 'Warning';
			const message = diag.message;

			diagnosticsData.push({
				file: relativePath,
				line: lineNumber,
				severity,
				message,
			});
		}
	}

	return diagnosticsData;
}

/**
 * Get information about the active terminal
 */
function getActiveTerminalInfo(): { name: string } | null {
	const activeTerminal = vscode.window.activeTerminal;
	if (!activeTerminal) {
		return null;
	}

	return {
		name: activeTerminal.name,
	};
}

/**
 * Build the final markdown snapshot string
 */
function buildMarkdownSnapshot(
	timestamp: string,
	workspaceInfo: { name: string; path: string } | null,
	vsCodeVersion: string,
	openFilesData: OpenFileData[],
	diagnosticsData: DiagnosticData[],
	terminalInfo: { name: string } | null
): string {
	let markdown = '# Context Snapshot\n\n';

	// Header with metadata
	markdown += `**Timestamp:** ${timestamp}  \n`;
	if (workspaceInfo) {
		markdown += `**Workspace:** ${workspaceInfo.name} (${workspaceInfo.path})  \n`;
	} else {
		markdown += `**Workspace:** No workspace open  \n`;
	}
	markdown += `**VS Code:** ${vsCodeVersion}\n\n`;
	markdown += '---\n\n';

	// Open Files Section
	markdown += '## Open Files\n\n';
	if (openFilesData.length === 0) {
		markdown += '*(No open files)*\n\n';
	} else {
		for (const file of openFilesData) {
			const dirtyIndicator = file.isDirty ? ' [UNSAVED]' : '';
			markdown += `### ${file.path} (${file.languageId}) — cursor at line ${file.cursorLine}, col ${file.cursorColumn}${dirtyIndicator}\n`;
			markdown += `\`\`\`${file.languageId}\n`;
			markdown += file.content;
			if (!file.content.endsWith('\n')) {
				markdown += '\n';
			}
			markdown += `\`\`\`\n\n`;
		}
	}

	markdown += '---\n\n';

	// Diagnostics Section (Errors & Warnings)
	markdown += '## Errors & Warnings\n\n';
	if (diagnosticsData.length === 0) {
		markdown += '*(No errors or warnings)*\n\n';
	} else {
		markdown += '| File | Line | Severity | Message |\n';
		markdown += '|------|------|----------|----------|\n';
		for (const diag of diagnosticsData) {
			// Escape pipe characters in the message
			const escapedMessage = diag.message.replace(/\|/g, '\\|');
			markdown += `| ${diag.file} | ${diag.line} | ${diag.severity} | ${escapedMessage} |\n`;
		}
		markdown += '\n';
	}

	markdown += '---\n\n';

	// Terminal Section
	markdown += '## Terminal\n\n';
	if (terminalInfo) {
		markdown += `**Active terminal:** ${terminalInfo.name}  \n`;
		markdown += '```\n';
		markdown += '// Terminal output not available without Shell Integration API.\n';
		markdown += '// Run: Enable terminal shell integration in VS Code settings.\n';
		markdown += '```\n\n';
	} else {
		markdown += '*(No active terminal)*\n\n';
	}

	return markdown;
}

/**
 * Interface for open file data
 */
interface OpenFileData {
	path: string;
	content: string;
	languageId: string;
	isDirty: boolean;
	cursorLine: number;
	cursorColumn: number;
}

/**
 * Interface for diagnostic data
 */
interface DiagnosticData {
	file: string;
	line: number;
	severity: 'Error' | 'Warning';
	message: string;
}
