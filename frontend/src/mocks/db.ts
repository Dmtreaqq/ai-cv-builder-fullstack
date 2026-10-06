import type { Cv } from '@/features/cvs/cv-types';

export interface StoredCv extends Cv {
  sourceText: string;
  sourceFileName: string | null;
  retried: boolean;
}

interface MockDb {
  cvs: StoredCv[];
}

export const DB_KEY = 'cvb:mock-db';

function readDb(): MockDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    const db = raw ? (JSON.parse(raw) as Partial<MockDb>) : {};
    return { cvs: Array.isArray(db.cvs) ? db.cvs : [] };
  } catch {
    return { cvs: [] };
  }
}

function writeDb(db: MockDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function listCvs(ownerId: string) {
  return readDb().cvs.filter((cv) => cv.ownerId === ownerId);
}

export function findCv(id: string, ownerId: string) {
  return readDb().cvs.find((cv) => cv.id === id && cv.ownerId === ownerId) ?? null;
}

export function saveCv(cv: StoredCv) {
  const db = readDb();
  const index = db.cvs.findIndex((item) => item.id === cv.id);
  if (index === -1) {
    db.cvs.push(cv);
  } else {
    db.cvs[index] = cv;
  }
  writeDb(db);
  return cv;
}

export function removeCv(id: string) {
  const db = readDb();
  writeDb({ cvs: db.cvs.filter((cv) => cv.id !== id) });
}
