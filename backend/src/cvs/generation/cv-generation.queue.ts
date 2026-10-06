import type { JobsOptions } from 'bullmq';

export const CV_GENERATION_QUEUE = 'cv-generation';
export const GENERATE_CV_JOB = 'generate';

export type CvGenerationJob = { cvId: string };

// jobId = cvId keeps one job per CV; removing finished jobs lets Retry reuse the id.
export function generationJobOptions(cvId: string): JobsOptions {
  return {
    jobId: cvId,
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: true,
    removeOnFail: true,
  };
}
