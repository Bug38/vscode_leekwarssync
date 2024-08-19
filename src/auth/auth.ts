import * as vscode from 'vscode';


export default async function initSecrets(context: vscode.ExtensionContext) {
	if (!await context.secrets.get("leekwars_password")) {
		await getCredentials(context);
	}
	if (!await context.secrets.get("leekwars_cookie") || !await verifyToken(context)) {
		vscode.window.showWarningMessage("bad token, getting new token...");
		await getToken(context);
	}
	if (await context.secrets.get("leekwars_cookie")) { return true; }
	return false;
}

export async function getCredentials(context: vscode.ExtensionContext) {
	const username = await vscode.window.showInputBox({
		title: "LeekWars Credentials:",
		prompt: "Enter your username",
		placeHolder: "username",
		ignoreFocusOut: true
	});
	if (!username) { return false; }
	const password = await vscode.window.showInputBox({
		title: "LeekWars Credentials:",
		prompt: "Enter your password",
		placeHolder: "password",
		ignoreFocusOut: true,
		password: true
	});
	if (!password) { return false; }
	context.secrets.store('leekwars_username', username);
	context.secrets.store('leekwars_password', password);
	return true;
}
export async function getToken(context: vscode.ExtensionContext) {
	await fetch(
		"https://leekwars.com/api/farmer/login-token",
		{
			method: 'POST',
			body: JSON.stringify({ login: await context.secrets.get("leekwars_username"), password: await context.secrets.get("leekwars_password"), keep_connected: true }),
			headers: new Headers([["Content-Type", "application/json"]]),
		})
		.then(response => {
			const cookie = response.headers.getSetCookie().find(sc => sc.includes("token") && !sc.includes("Max-Age=0"));
			if (!cookie) {
				context.secrets.delete("leekwars_cookie");
				console.log("Error while authentifying to leekwars API!");
				return;
			}
			context.secrets.store("leekwars_cookie", cookie);
		});
}

export async function verifyToken(context: vscode.ExtensionContext) {
	return await fetch("https://leekwars.com/api/farmer/get-from-token", {
		method: 'GET',
		headers: new Headers([
			["Content-Type", "application/json"],
			['Cookie', await context.secrets.get("leekwars_cookie") || ""]
		])
	}).then(async response => {
		const jsonResponse = JSON.parse(await response.text());
		if (jsonResponse.error === 'wrong_token') {return false;}
		return true;
	});
}