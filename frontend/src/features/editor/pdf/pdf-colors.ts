export interface PdfColors {
  ink: string;
  muted: string;
  brand: string;
  rule: string;
}

// react-pdf can't read CSS variables, so resolve the theme tokens from index.css when exporting.
export function readPdfColors(): PdfColors {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return {
    ink: token('--foreground'),
    muted: token('--muted-foreground'),
    brand: token('--brand'),
    rule: token('--border'),
  };
}
