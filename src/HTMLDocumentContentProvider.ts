"use strict"
import * as vscode from 'vscode'
import * as path from "path";
import * as Constants from './Constants'
import * as PreviewTheme from './PreviewTheme'

export default class HTMLDocumentContentProvider {

    private _document: vscode.TextDocument;
    private _webview: vscode.Webview;
    // Caches the (expensive, whole-document-regex) link-rewritten body keyed
    // by document version, so a re-render triggered by a config-only change
    // (theme/customCss toggle) doesn't redundantly re-run it - only the two
    // appended style/link lines actually depend on that kind of change.
    private _cachedBody: string | undefined;
    private _cachedVersion: number | undefined;

    constructor(document: vscode.TextDocument, webview: vscode.Webview) {
        this._document = document;
        this._webview = webview;
    }

    generateHTML(): string {
        if (this._cachedVersion !== this._document.version) {
            this._cachedBody = this.fixLinks(this._document.getText());
            this._cachedVersion = this._document.version;
        }
        return this.addStyles(this._cachedBody!);
    }

    // Rewrite relative src/href attributes to webview-safe URIs so local
    // images, scripts, and stylesheets load inside the sandboxed webview.
    // Leaves in-page anchors (#section), mailto:, and tel: links untouched -
    // they aren't filesystem paths and would otherwise be corrupted into
    // broken webview-resource URIs.
    private fixLinks(html: string): string {
        const documentFileName = this._document.fileName;
        return html.replace(
            new RegExp("((?:src|href)=['\"])((?!https?:|//|data:|#|mailto:|tel:|\\/).*?)(['\"])", "gmi"),
            (_match: string, p1: string, p2: string, p3: string): string => {
                const absPath = path.join(path.dirname(documentFileName), p2);
                const uri = this._webview.asWebviewUri(vscode.Uri.file(absPath));
                return p1 + uri.toString() + p3;
            }
        );
    }

    private addStyles(html: string): string {
        return html + this.themeOverrideStyle() + this.customStylesheetLink();
    }

    // "auto" (default) injects nothing, so the page's own CSS - including any
    // dark-mode styling it defines - renders exactly as a real browser would.
    // "light"/"dark" are an explicit, user-chosen override (liveHtmlPreview.previewTheme
    // setting, or the "Set preview theme" command) that force a plain background,
    // via !important so they win regardless of the page's own rules.
    private themeOverrideStyle(): string {
        const theme = PreviewTheme.getTheme();

        if (theme === Constants.PreviewTheme.LIGHT) {
            return `\n<style>html, body { background: #fff !important; color: #000 !important; }</style>`;
        }
        if (theme === Constants.PreviewTheme.DARK) {
            return `\n<style>html, body { background: #000 !important; color: #fff !important; }</style>`;
        }
        return "";
    }

    private customStylesheetLink(): string {
        const config = vscode.workspace.getConfiguration(Constants.Configuration.SECTION);
        if (!config.get<boolean>(Constants.Configuration.CUSTOM_CSS_ENABLED, true)) {
            return "";
        }

        const customPath = config.get<string>(Constants.Configuration.CUSTOM_CSS_PATH, "");
        const styleUri = customPath
            ? this.resolveWorkspaceRelativeUri(customPath)
            : this.resolveBundledStyleUri();
        if (!styleUri) { return ""; }

        return `\n<link href="${styleUri}" rel="stylesheet" />`;
    }

    private resolveBundledStyleUri(): vscode.Uri | undefined {
        const ext = vscode.extensions.getExtension(Constants.ExtensionConstants.EXTENSION_ID);
        if (!ext) { return undefined; }
        return this._webview.asWebviewUri(
            vscode.Uri.joinPath(ext.extensionUri, Constants.ExtensionConstants.CUSTOM_CSS_PATH)
        );
    }

    // Only resolves correctly if `customPath` falls under a workspace folder,
    // since that's what's included in the webview's localResourceRoots.
    private resolveWorkspaceRelativeUri(customPath: string): vscode.Uri | undefined {
        const folder = vscode.workspace.getWorkspaceFolder(this._document.uri);
        if (!folder) { return undefined; }
        return this._webview.asWebviewUri(vscode.Uri.joinPath(folder.uri, customPath));
    }
}
