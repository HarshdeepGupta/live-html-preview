'use strict';
import * as vscode from 'vscode';
import Utilities from './Utilities'
import StatusBarItem from './StatusBarItem'
import HTMLPreviewCustomEditorProvider from './HTMLPreviewCustomEditorProvider'
import * as Constants from './Constants'
import * as PreviewTheme from './PreviewTheme'

export function activate(context: vscode.ExtensionContext) {

    const statusBarItem = new StatusBarItem();
    statusBarItem.updateStatusbar();
    context.subscriptions.push(statusBarItem);

    const onPreviewPanelViewStateChange = (active: boolean) => statusBarItem.setPreviewPanelActive(active);
    const utilities = new Utilities(onPreviewPanelViewStateChange);

    context.subscriptions.push(HTMLPreviewCustomEditorProvider.register(onPreviewPanelViewStateChange));

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(statusBarItem.updateStatusbar, statusBarItem)
    );

    // Single reactive sync point: whichever surface changes the theme (cycle
    // icon, submenu, status bar, or a direct settings.json edit), the context
    // key (submenu checkmarks) and status bar text refresh from here.
    PreviewTheme.syncContextKey();
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (!PreviewTheme.isThemeChange(e)) { return; }
            PreviewTheme.syncContextKey();
            statusBarItem.refreshThemeItem();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.sidePreview', (uri?: vscode.Uri) => {
            utilities.init(vscode.ViewColumn.Two, context, uri);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.fullPreview', (uri?: vscode.Uri) => {
            utilities.init(vscode.ViewColumn.One, context, uri);
        })
    );

    context.subscriptions.push(
        // uri is only supplied when invoked from explorer/context (right-clicking
        // a file that may not be the active editor); other invocations (editor
        // context menu, keybinding, Command Palette) fall back to the active editor.
        vscode.commands.registerCommand('extension.inBrowser', async (uri?: vscode.Uri) => {
            const document = await utilities.resolveHtmlDocument(uri, true);
            if (!document) { return; }

            const targetUri = document.uri;
            const isRemote = vscode.env.remoteName !== undefined || vscode.env.uiKind === vscode.UIKind.Web;
            if (isRemote) {
                // openExternal(file://) is unreliable over Remote-SSH/WSL/Codespaces,
                // since there's no local browser that can resolve a remote file path.
                // VS Code's built-in Simple Browser is documented for http/https URLs;
                // local-file support isn't documented, so this is a best-effort try
                // before falling back to the (likely broken, but not worse) default.
                try {
                    await vscode.commands.executeCommand('simpleBrowser.show', targetUri.toString());
                    return;
                } catch {
                    // fall through to openExternal
                }
            }
            await vscode.env.openExternal(targetUri);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.setPreviewTheme', async () => {
            const current = PreviewTheme.getTheme();

            const options: (vscode.QuickPickItem & { value: string })[] = [
                { label: "Auto", description: "Show the page as authored (default)", value: Constants.PreviewTheme.AUTO },
                { label: "Light", description: "Force white background / black text", value: Constants.PreviewTheme.LIGHT },
                { label: "Dark", description: "Force black background / white text", value: Constants.PreviewTheme.DARK }
            ];
            options.find(o => o.value === current)!.description += " (current)";

            const pick = await vscode.window.showQuickPick(options, { placeHolder: "Select a preview theme" });
            if (!pick) { return; }

            await PreviewTheme.setTheme(pick.value);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.cyclePreviewTheme', () => PreviewTheme.cycleTheme())
    );

    // Backs the right-click "Preview" submenu: each entry both sets the theme
    // (global, so it also re-renders any already-open preview instantly) and
    // opens/reveals the requested view - one click starts a preview in a
    // specific mode instead of needing to set the theme first separately.
    const openPreviewWithTheme = async (viewColumn: vscode.ViewColumn, theme: string, uri?: vscode.Uri) => {
        await PreviewTheme.setTheme(theme);
        utilities.init(viewColumn, context, uri);
    };
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.sidePreviewAuto', (uri?: vscode.Uri) => openPreviewWithTheme(vscode.ViewColumn.Two, Constants.PreviewTheme.AUTO, uri))
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.sidePreviewLight', (uri?: vscode.Uri) => openPreviewWithTheme(vscode.ViewColumn.Two, Constants.PreviewTheme.LIGHT, uri))
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.sidePreviewDark', (uri?: vscode.Uri) => openPreviewWithTheme(vscode.ViewColumn.Two, Constants.PreviewTheme.DARK, uri))
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.fullPreviewAuto', (uri?: vscode.Uri) => openPreviewWithTheme(vscode.ViewColumn.One, Constants.PreviewTheme.AUTO, uri))
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.fullPreviewLight', (uri?: vscode.Uri) => openPreviewWithTheme(vscode.ViewColumn.One, Constants.PreviewTheme.LIGHT, uri))
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.fullPreviewDark', (uri?: vscode.Uri) => openPreviewWithTheme(vscode.ViewColumn.One, Constants.PreviewTheme.DARK, uri))
    );
}

export function deactivate() {}
