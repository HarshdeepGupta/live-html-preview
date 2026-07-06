'use strict';
import * as vscode from 'vscode';
import Utilities from './Utilities'
import StatusBarItem from './StatusBarItem'
import HTMLPreviewCustomEditorProvider from './HTMLPreviewCustomEditorProvider'
import PreviewPanelRegistry, { PreviewMode } from './PreviewPanelRegistry'
import * as Constants from './Constants'
import * as PreviewTheme from './PreviewTheme'

export function activate(context: vscode.ExtensionContext) {

    const statusBarItem = new StatusBarItem();
    context.subscriptions.push(statusBarItem);

    // One registry shared by every way a preview can be opened (side/full
    // panels via Utilities, or "Reopen Editor With..." via
    // HTMLPreviewCustomEditorProvider), so they can see each other's open
    // panels instead of each tracking their own in isolation. The status bar
    // re-queries hasActivePanel() fresh on every registry event instead of
    // tracking a separately-pushed boolean, so it can't go stale on close.
    const registry = new PreviewPanelRegistry();
    statusBarItem.setPreviewPanelActiveQuery(() => registry.hasActivePanel());
    const refreshStatusBar = () => statusBarItem.updateStatusbar();
    const utilities = new Utilities(registry, refreshStatusBar);

    context.subscriptions.push(HTMLPreviewCustomEditorProvider.register(registry, refreshStatusBar));

    statusBarItem.updateStatusbar();
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(statusBarItem.updateStatusbar, statusBarItem)
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (PreviewTheme.isThemeChange(e)) { statusBarItem.refreshThemeItem(); }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.sidePreview', (uri?: vscode.Uri) => {
            utilities.init(vscode.ViewColumn.Two, 'side', uri);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.fullPreview', (uri?: vscode.Uri) => {
            utilities.init(vscode.ViewColumn.One, 'full', uri);
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
            const currentOption = options.find(o => o.value === current);
            if (currentOption) { currentOption.description += " (current)"; }

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
    const openPreviewWithTheme = async (viewColumn: vscode.ViewColumn, mode: PreviewMode, theme: string, uri?: vscode.Uri) => {
        await PreviewTheme.setTheme(theme);
        utilities.init(viewColumn, mode, uri);
    };
    const PREVIEW_THEME_COMMANDS: { id: string; viewColumn: vscode.ViewColumn; mode: PreviewMode; theme: string }[] = [
        { id: 'sidePreviewAuto', viewColumn: vscode.ViewColumn.Two, mode: 'side', theme: Constants.PreviewTheme.AUTO },
        { id: 'sidePreviewLight', viewColumn: vscode.ViewColumn.Two, mode: 'side', theme: Constants.PreviewTheme.LIGHT },
        { id: 'sidePreviewDark', viewColumn: vscode.ViewColumn.Two, mode: 'side', theme: Constants.PreviewTheme.DARK },
        { id: 'fullPreviewAuto', viewColumn: vscode.ViewColumn.One, mode: 'full', theme: Constants.PreviewTheme.AUTO },
        { id: 'fullPreviewLight', viewColumn: vscode.ViewColumn.One, mode: 'full', theme: Constants.PreviewTheme.LIGHT },
        { id: 'fullPreviewDark', viewColumn: vscode.ViewColumn.One, mode: 'full', theme: Constants.PreviewTheme.DARK }
    ];
    for (const { id, viewColumn, mode, theme } of PREVIEW_THEME_COMMANDS) {
        context.subscriptions.push(
            vscode.commands.registerCommand(`extension.${id}`, (uri?: vscode.Uri) => openPreviewWithTheme(viewColumn, mode, theme, uri))
        );
    }
}

export function deactivate() {}
