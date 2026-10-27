import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateSpousesTable1793107969925 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'spouses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk_spouses',
            default: 'gen_random_uuid()',
          },
          {
            name: 'person_a_id',
            type: 'uuid',
          },
          {
            name: 'person_b_id',
            type: 'uuid',
          },
          { name: 'marriage_date', type: 'date', isNullable: true },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'end_reason',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_spouses_end_reason',
            expression: `"end_reason" IN ('DIVORCED', 'WIDOWED')`,
          }),
          new TableCheck({
            name: 'chk_spouses_not_self',
            expression: `"person_a_id" <> "person_b_id"`,
          }),
          new TableCheck({
            name: 'chk_spouses_end_after_marriage',
            expression: `"end_date" IS NULL OR "marriage_date" IS NULL OR "end_date" >= "marriage_date"`,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_spouses_person_a',
            columnNames: ['person_a_id'],
            referencedTableName: 'persons',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
          new TableForeignKey({
            name: 'fk_spouses_person_b',
            columnNames: ['person_b_id'],
            referencedTableName: 'persons',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'idx_spouses_a',
            columnNames: ['person_a_id'],
          }),
          new TableIndex({
            name: 'idx_spouses_b',
            columnNames: ['person_b_id'],
          }),
        ],
      }),
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_spouses_pair" ON "spouses" (
        LEAST("person_a_id", "person_b_id"),
        GREATEST("person_a_id", "person_b_id"),
        COALESCE("marriage_date", DATE '0001-01-01')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_spouses_pair"`);
    await queryRunner.dropTable('spouses', true, true, true);
  }
}
