import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableUnaccentExtension1793107697144 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
