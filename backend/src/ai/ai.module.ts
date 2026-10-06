import { Module } from '@nestjs/common';
import { aiModelProvider, anthropicClientProvider } from './anthropic-client.js';
import { AnswerApplierService } from './answer-applier.service.js';
import { CvGeneratorService } from './cv-generator.service.js';

@Module({
  providers: [anthropicClientProvider, aiModelProvider, CvGeneratorService, AnswerApplierService],
  exports: [CvGeneratorService, AnswerApplierService],
})
export class AiModule {}
