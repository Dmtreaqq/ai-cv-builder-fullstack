import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module.js';
import { Cv } from './cv.entity.js';
import { CvsController } from './cvs.controller.js';
import { CvsService } from './cvs.service.js';
import { CvGenerationProcessor } from './generation/cv-generation.processor.js';
import { CV_GENERATION_QUEUE } from './generation/cv-generation.queue.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cv]),
    BullModule.registerQueue({ name: CV_GENERATION_QUEUE }),
    AiModule,
  ],
  controllers: [CvsController],
  providers: [CvsService, CvGenerationProcessor],
})
export class CvsModule {}
