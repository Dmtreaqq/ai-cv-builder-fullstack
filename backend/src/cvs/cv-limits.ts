// Shared by the update DTO and the AI draft parser, so a generated CV always passes autosave.
export const CV_LIMITS = {
  title: 120,
  targetRole: { min: 2, max: 100 },
  sourceText: 30_000,
  answer: 1_000,
  id: 64,
  contact: {
    fullName: 100,
    headline: 150,
    email: 254,
    phone: 50,
    location: 100,
    links: 10,
    linkLabel: 50,
    linkUrl: 300,
  },
  summary: 3_000,
  experience: {
    entries: 30,
    role: 150,
    company: 150,
    location: 100,
    date: 30,
    bullets: 20,
    bullet: 1_000,
  },
  education: {
    entries: 20,
    degree: 150,
    school: 150,
    date: 30,
    details: 2_000,
  },
  skills: { entries: 100, name: 60 },
  questions: { entries: 8, prompt: 300, hint: 200 },
} as const;

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
