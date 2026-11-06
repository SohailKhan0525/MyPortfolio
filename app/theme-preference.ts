export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "light";
export const THEME_STORAGE_KEY = "portfolio-theme";
export const THEME_COLORS: Record<Theme, string> = {
  light: "#f2f1e9",
  dark: "#111a15",
};

export function resolveThemePreference(saved: string | null): Theme {
  return saved === "dark" ? "dark" : DEFAULT_THEME;
}

export function readThemePreference(): Theme {
  try {
    return resolveThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // Browsers may deny storage access; visitors still get the light default.
    return DEFAULT_THEME;
  }
}

export function applyDocumentTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

// Runs in <head>, before content is painted or React hydrates. Keep this tiny
// script independent of the client bundle so saved dark mode never flashes light.
export const themeBootstrapScript = `(() => {
  var theme = ${JSON.stringify(DEFAULT_THEME)};
  try {
    if (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "dark") theme = "dark";
  } catch {}
  var root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", ${JSON.stringify(THEME_COLORS)}[theme]);
})();`;
