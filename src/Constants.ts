export module ErrorMessages {
    export const NO_HTML = "The current editor doesn't show a HTML document.";
}

export module ExtensionConstants {
    export const EXTENSION_ID = "hdg.live-html-previewer";
    export const CUSTOM_CSS_PATH = "Resources/custom_style.css";
}

export module Configuration {
    export const SECTION = "liveHtmlPreview";
    export const DEBOUNCE_DELAY = "debounceDelay";
    export const DEBOUNCE_DELAY_DEFAULT = 200;
    export const CUSTOM_CSS_ENABLED = "customCss.enabled";
    export const CUSTOM_CSS_PATH = "customCss.path";
    export const PREVIEW_THEME = "previewTheme";
    export const PREVIEW_THEME_DEFAULT = "auto";
}

export module PreviewTheme {
    export const AUTO = "auto";
    export const LIGHT = "light";
    export const DARK = "dark";
}