// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import initSecrets from './auth/auth';

async function initialAsserts(context: vscode.ExtensionContext) {
	if (!vscode.workspace.workspaceFolders?.length) {
		vscode.window.showErrorMessage('Please open a folder before using the extension.');
		return false;
	}

	if (!await initSecrets(context)) {
		vscode.window.showErrorMessage("LeekWars Sync not connected to leekwars API!");
		return false;
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	const lwinit = vscode.commands.registerCommand('leekwarssync.init', async () => {
		if (await initialAsserts(context)) {
			vscode.window.showInformationMessage("LeekWars Sync initialized!");
		}
	});

	const lwfetch = vscode.commands.registerCommand('leekwarssync.fetch', async () => {
		if (!initialAsserts(context)) {
			return;
		}
		// here we fetch the data and make it an AIStructure object, stored in workspace storage
		// same for ais ?
	});

	const disposable = vscode.commands.registerCommand('leekwarssync.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from LeekWarsSync!');
	});

	context.subscriptions.push(lwinit);
	context.subscriptions.push(lwfetch);
}

// This method is called when your extension is deactivated
export function deactivate() { }
