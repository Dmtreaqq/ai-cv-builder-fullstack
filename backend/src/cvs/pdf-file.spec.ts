import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { MAX_PDF_BYTES } from './cv-limits.js';
import { assertPdf } from './pdf-file.js';

function upload(buffer: Buffer, size = buffer.length) {
  return { buffer, size, originalname: 'cv.pdf' };
}

describe('assertPdf', () => {
  it('accepts a file that starts with the PDF signature', () => {
    expect(() => assertPdf(upload(Buffer.from('%PDF-1.7\n...')))).not.toThrow();
  });

  it('rejects files without the signature, whatever their name', () => {
    expect(() => assertPdf(upload(Buffer.from('PK\u0003\u0004 zip')))).toThrow(
      new BadRequestException('Attach a PDF file.'),
    );
    expect(() => assertPdf(upload(Buffer.from('%PD')))).toThrow(BadRequestException);
    expect(() => assertPdf(upload(Buffer.alloc(0)))).toThrow(BadRequestException);
  });

  it('rejects files over 5 MB', () => {
    const big = Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(MAX_PDF_BYTES)]);

    expect(() => assertPdf(upload(big))).toThrow(
      new BadRequestException('The PDF must be 5 MB or smaller.'),
    );
  });
});
