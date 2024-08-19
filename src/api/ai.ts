import * as vscode from 'vscode';

export interface AIProperties {
    id: number
    name: string
    valid: boolean
    folder: number
    version: number
    strict: boolean
    total_lines: number
    total_chars: number
    entrypoint: boolean
    entrypoints: number[]
    scenario: number | null
    includes_ids: number[]
}

export interface AISync {
    id: number
    modified: number
    code: string
}

export interface FolderProperties {
    id: number
    name: string
    folder: number
}

export interface FarmerAI {
    ais: AIProperties[]
    folders: FolderProperties[]
    leek_ais: Map<number, number>
    bin: AIProperties[]
}

export interface SaveResult {
    result: any
    modified: number
}

export async function updateFarmerAI(context: vscode.ExtensionContext) {
    return await fetch("https://leekwars.com/api/ai/get-farmer-ais", {
        method: 'GET',
        headers: new Headers([
            ["Content-Type", "application/json"],
            ['Cookie', await context.secrets.get("leekwars_cookie") || ""]
        ])
    }).then(async response => {
        const farmerAI = JSON.parse(await response.text()) as FarmerAI;
        context.workspaceState.update('leekwars_farmerAi', farmerAI);
        return farmerAI;
    });
}

export async function updateAIs(context: vscode.ExtensionContext, aisList: number[]) {
    const ids = Object.assign({}, ...aisList.map(id => ({ [id]: 0 })));
    return await fetch("https://leekwars.com/api/ai/sync/", {
        method: 'POST',
        headers: new Headers([
            ["Content-Type", "application/json"],
            ['Cookie', await context.secrets.get("leekwars_cookie") || ""]
        ]),
        body: JSON.stringify({
            ais: JSON.stringify(ids)
        }),
    }).then(async response => {
        const aisSync = JSON.parse(await response.text()) as AISync[];
        context.workspaceState.update('leekwars_cacheAi', aisSync);
        return aisSync;
    });
}

export async function downloadAIs(context: vscode.ExtensionContext) {

    function getFolderPath(ctx: vscode.ExtensionContext, folderId: number): string {
        const farmerAi = ctx.workspaceState.get('leekwars_farmerAi') as FarmerAI;
        const folder = farmerAi.folders.find(f => f.id === folderId);
        if (!folder) { return ""; }
        if (folder.folder !== 0) { return folder.name + "/" + getFolderPath(ctx, folder.folder); }
        return folder.name;
    }

    const farmerAi = await updateFarmerAI(context);
    const aisSync = await updateAIs(context, farmerAi.ais.map(ai => ai.id));

    const wsEdit = new vscode.WorkspaceEdit();
    aisSync.forEach(aiSync => {
        const aiInfo = farmerAi.ais.find(ai => ai.id === aiSync.id);
        if (!aiInfo) { return; }
        const aiUri = vscode.Uri.file(
            vscode.workspace.workspaceFolders![0].uri.fsPath
            + '/' + getFolderPath(context, aiInfo.folder)
            + '/' + aiInfo.name + '.leek'
        );
        wsEdit.createFile(
            aiUri,
            {
                contents: new TextEncoder().encode(aiSync.code),
                overwrite: true
            }
        );
    });
    vscode.workspace.applyEdit(wsEdit);
}

export async function uploadAIs(context: vscode.ExtensionContext) {

    const farmerAI = context.workspaceState.get('leekwars_farmerAi') as FarmerAI;
    const cacheAI = context.workspaceState.get('leekwars_cacheAi') as AISync[];

    [
        ...await vscode.workspace.findFiles('**/*.leek'),
        ...await vscode.workspace.findFiles('**/*.lk')
    ]
        .forEach(async doc => {
            const name = doc.fsPath.split("\\").at(-1)?.split(".")[0] || "";
            const foldername = doc.fsPath.split("\\").at(-2);
            const existingAI = farmerAI.ais.find(ai => ai.name === name);
            const existingFolder = existingAI?.folder === 0 ? <FolderProperties>{ folder: 0, id: 0, name: 'root' } : farmerAI.folders.find(folder => folder.name === foldername);
            if (!existingAI || !existingFolder) {
                // Create folder tree
                // Create file
                // set existing AI to this file, and create an empty cacheAI entry
                // continue
                return;
            }
            const code = new TextDecoder().decode(await vscode.workspace.fs.readFile(doc));
            const cachedAI = cacheAI.find(ai => ai.id === existingAI.id);
            if (cachedAI?.code === code) {
                // No diff, no upload
                return;
            }
            const saveResult = await fetch("https://leekwars.com/api/ai/save/", {
                method: 'POST',
                headers: new Headers([
                    ["Content-Type", "application/json"],
                    ['Cookie', await context.secrets.get("leekwars_cookie") || ""]
                ]),
                body: JSON.stringify({
                    ai_id: existingAI.id,
                    code: code
                })
            }).then(async response => (JSON.parse(await response.text()) as SaveResult));
            if (cachedAI) {
                cachedAI.code = code;
                cachedAI.modified = saveResult.modified;
                context.workspaceState.update('leekwars_cacheAi', cacheAI);
            }
        });
}
