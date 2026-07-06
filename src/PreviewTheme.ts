'use strict'
import * as vscode from 'vscode'
import * as Constants from './Constants'

// Single source of truth for the preview theme: everything (the editor/title
// cycle icon, the right-click submenu, the status bar item, and settings.json
// edits) reads/writes through the liveHtmlPreview.previewTheme setting, and
// vscode.workspace.onDidChangeConfiguration is what keeps every surface in
// sync - there's no separate in-memory state to fall out of date.
const CYCLE_ORDER = [Constants.PreviewTheme.AUTO, Constants.PreviewTheme.LIGHT, Constants.PreviewTheme.DARK];

export function getTheme(): string {
    return vscode.workspace
        .getConfiguration(Constants.Configuration.SECTION)
        .get<string>(Constants.Configuration.PREVIEW_THEME, Constants.Configuration.PREVIEW_THEME_DEFAULT);
}

export function setTheme(theme: string): Thenable<void> {
    return vscode.workspace
        .getConfiguration(Constants.Configuration.SECTION)
        .update(Constants.Configuration.PREVIEW_THEME, theme, vscode.ConfigurationTarget.Global);
}

export function cycleTheme(): Thenable<void> {
    const next = CYCLE_ORDER[(CYCLE_ORDER.indexOf(getTheme()) + 1) % CYCLE_ORDER.length];
    return setTheme(next);
}

export function isThemeChange(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration(`${Constants.Configuration.SECTION}.${Constants.Configuration.PREVIEW_THEME}`);
}
