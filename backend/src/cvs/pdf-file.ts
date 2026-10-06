import { BadRequestException } from '@nestjs/common';
import { MAX_PDF_BYTES } from './cv-limits.js';

export type UploadedPdf = {
  buffer: Buffer;
  size: number;
  originalname: string;
};

const PDF_MAGIC = Buffer.from('%PDF-', 'latin1');

export const PDF_UPLOAD_LIMITS = { fileSize: MAX_PDF_BYTES, files: 1 };
export const PDF_TOO_LARGE_MESSAGE = 'The PDF must be 5 MB or smaller.';

export function assertPdf(file: UploadedPdf): void {
  if (file.size > MAX_PDF_BYTES || file.buffer.length > MAX_PDF_BYTES) {
    throw new BadRequestException(PDF_TOO_LARGE_MESSAGE);
  }
  if (file.size === 0 || !file.buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    throw new BadRequestException('Attach a PDF file.');
  }
}
