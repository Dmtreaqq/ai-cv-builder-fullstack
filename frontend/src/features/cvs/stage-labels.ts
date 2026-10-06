import type { StageId } from './cv-types';

export const STAGE_LABELS: Record<StageId, string> = {
  reading: 'Reading your background',
  analyzing: 'Analyzing the target role',
  drafting: 'Drafting your experience',
  tailoring: 'Tailoring it to the role',
  reviewing: 'Checking for gaps',
};
