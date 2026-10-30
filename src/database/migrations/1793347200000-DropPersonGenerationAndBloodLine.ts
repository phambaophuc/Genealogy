import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes `generation` and `is_blood_line` from persons.
 *
 * `generation` also carried a CHECK constraint and an index, and both are
 * dropped explicitly before the column so the migration stays readable and the
 * `down()` can recreate them under their original names.
 */
export class DropPersonGenerationAndBloodLine1793347200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" DROP CONSTRAINT IF EXISTS "chk_persons_generation"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_persons_generation"`);
    await queryRunner.query(
      `ALTER TABLE "persons" DROP COLUMN IF EXISTS "generation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" DROP COLUMN IF EXISTS "is_blood_line"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "generation" smallint`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "is_blood_line" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" ADD CONSTRAINT "chk_persons_generation" CHECK ("generation" >= 1)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_persons_generation" ON "persons" ("generation")`,
    );
  }
}
