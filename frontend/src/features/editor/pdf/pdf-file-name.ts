function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function pdfFileName(fullName: string, targetRole: string) {
  const slug = [fullName, targetRole].map(slugify).filter(Boolean).join('-');
  return `${slug || 'cv'}.pdf`;
}
