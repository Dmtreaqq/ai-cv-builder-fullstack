import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCvs1791298364474 implements MigrationInterface {
  name = 'CreateCvs1791298364474';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cvs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "title" character varying(120) NOT NULL, "targetRole" character varying(100) NOT NULL, "status" character varying(16) NOT NULL, "stage" character varying(16), "error" character varying(300), "sourceText" text, "sourcePdf" bytea, "sourceFileName" character varying(255), "content" jsonb, "questions" jsonb NOT NULL DEFAULT '[]', "generationStartedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e7d8a4d55eb4e7a2e43bea8d83a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_4fd87fe6ca0c1701dd320bbf64" ON "cvs" ("userId")`);
    await queryRunner.query(
      `ALTER TABLE "cvs" ADD CONSTRAINT "FK_4fd87fe6ca0c1701dd320bbf643" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cvs" DROP CONSTRAINT "FK_4fd87fe6ca0c1701dd320bbf643"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4fd87fe6ca0c1701dd320bbf64"`);
    await queryRunner.query(`DROP TABLE "cvs"`);
  }
}
