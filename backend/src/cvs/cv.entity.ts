import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';
import type { CvContent, CvStatus, Question, StageId } from './cv-types.js';

@Entity({ name: 'cvs' })
export class Cv {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  targetRole: string;

  @Column({ type: 'varchar', length: 16 })
  status: CvStatus;

  @Column({ type: 'varchar', length: 16, nullable: true })
  stage: StageId | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  error: string | null;

  @Column({ type: 'text', nullable: true })
  sourceText: string | null;

  @Column({ type: 'bytea', nullable: true, select: false })
  sourcePdf?: Buffer | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceFileName: string | null;

  @Column({ type: 'jsonb', nullable: true })
  content: CvContent | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  questions: Question[];

  @Column({ type: 'timestamptz' })
  generationStartedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
