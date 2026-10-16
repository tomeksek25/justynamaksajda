// Dependency-free so client scripts can import it without pulling in the translations.

/** Fill `{name}` placeholders in a text; unknown placeholders are left as they are. */
export const format = (text: string, values: Record<string, string | number> = {}) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
