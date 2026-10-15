import type { CSSProperties } from "react";

// Keep shadcn's component tokens aligned with the existing Drexel palette.
// Apply this scope to portal content as well as the dashboard shell.
export const adminTheme = {
  "--font-sans": "var(--font-geist-sans), Arial, sans-serif",
  "--font-heading": "var(--font-geist-sans), Arial, sans-serif",
  "--background": "var(--drexel-panel)",
  "--foreground": "var(--drexel-ink)",
  "--card": "var(--drexel-panel)",
  "--card-foreground": "var(--drexel-ink)",
  "--popover": "var(--drexel-panel)",
  "--popover-foreground": "var(--drexel-ink)",
  "--primary": "var(--drexel-action)",
  "--primary-foreground": "#fff",
  "--secondary": "var(--drexel-soft)",
  "--secondary-foreground": "var(--drexel-ink)",
  "--muted": "var(--drexel-soft)",
  "--muted-foreground": "var(--drexel-subtle)",
  "--accent": "var(--drexel-soft)",
  "--accent-foreground": "var(--drexel-ink)",
  "--border": "var(--drexel-panel-border)",
  "--input": "var(--drexel-panel-border)",
  "--ring": "var(--drexel-focus)",
  "--sidebar": "var(--drexel-panel)",
  "--sidebar-foreground": "var(--drexel-ink)",
  "--sidebar-primary": "var(--drexel-action)",
  "--sidebar-primary-foreground": "#fff",
  "--sidebar-accent": "var(--drexel-selected)",
  "--sidebar-accent-foreground": "var(--drexel-selected-ink)",
  "--sidebar-border": "var(--drexel-panel-border)",
  "--sidebar-ring": "var(--drexel-focus)",
} as CSSProperties;
