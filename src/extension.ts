// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import initSecrets from './auth/auth';
import { downloadAIs, updateFarmerAI, uploadAIs } from './api/ai';

async function initialAsserts(context: vscode.ExtensionContext) {
	if (!vscode.workspace.workspaceFolders?.length) {
		vscode.window.showErrorMessage('Please open a folder before using the extension.');
		return false;
	}

	if (!await initSecrets(context)) {
		vscode.window.showErrorMessage("LeekWars Sync not connected to leekwars API!");
		return false;
	}
	return true;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	console.log("Leekwars Sync V0.1");

	const lwinit = vscode.commands.registerCommand('leekwarssync.init', async () => {
		if (await initialAsserts(context)) {
			vscode.window.showInformationMessage("LeekWars Sync initialized!");
		}
	});

	const lwfetch = vscode.commands.registerCommand('leekwarssync.fetch', async () => {
		if (!await initialAsserts(context)) {
			return;
		}
		vscode.window.withProgress({
			title: "Fetching farmer AIs...",
			location: vscode.ProgressLocation.Notification,
		}, () => updateFarmerAI(context)
		);
	});

	const lwpullall = vscode.commands.registerCommand('leekwarssync.pullall', async () => {
		if (!await initialAsserts(context)) {
			return;
		}
		vscode.window.withProgress({
			title: "Pulling farmer AIs...",
			location: vscode.ProgressLocation.Notification,
		}, () => downloadAIs(context));
	});

	const lwpushall = vscode.commands.registerCommand('leekwarssync.pushall', async () => {
		if (!await initialAsserts(context)) {
			return;
		}
		vscode.window.withProgress({
			title: "Pushing farmer AIs...",
			location: vscode.ProgressLocation.Notification,
		}, () => uploadAIs(context));
	});

	context.subscriptions.push(lwinit);
	context.subscriptions.push(lwpullall);
	context.subscriptions.push(lwpushall);
}

// This method is called when your extension is deactivated
export function deactivate() { }
