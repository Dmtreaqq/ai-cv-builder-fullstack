import { Catch, HttpStatus, PayloadTooLargeException } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { PDF_TOO_LARGE_MESSAGE } from './pdf-file.js';

// Multer rejects oversized uploads before our code runs; give them the same message as assertPdf.
@Catch(PayloadTooLargeException)
export class PdfUploadFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message: PDF_TOO_LARGE_MESSAGE,
      error: 'Payload Too Large',
    });
  }
}
