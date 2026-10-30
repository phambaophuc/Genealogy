import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableIndex,
} from 'typeorm';

export class CreatePersonsTable1793106949332 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'persons',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk_persons',
            default: 'gen_random_uuid()',
          },
          { name: 'full_name', type: 'varchar', length: '150' },
          {
            name: 'common_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'gender',
            type: 'varchar',
            length: '10',
            default: `'UNKNOWN'`,
          },
          { name: 'avatar_url', type: 'text', isNullable: true },
          {
            name: 'generation',
            type: 'smallint',
            isNullable: true,
          },
          {
            name: 'birth_order',
            type: 'smallint',
            isNullable: true,
          },
          {
            name: 'is_blood_line',
            type: 'boolean',
            default: true,
          },
          { name: 'birth_date', type: 'date', isNullable: true },
          {
            name: 'birth_date_precision',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          { name: 'death_date', type: 'date', isNullable: true },
          {
            name: 'death_date_precision',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'death_lunar_date',
            type: 'varchar',
            length: '6',
            isNullable: true,
          },
          { name: 'is_deceased', type: 'boolean', default: false },
          {
            name: 'hometown',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'current_address', type: 'text', isNullable: true },
          { name: 'phone', type: 'varchar', length: '20', isNullable: true },
          {
            name: 'occupation',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          { name: 'bio', type: 'text', isNullable: true },
          { name: 'burial_place', type: 'text', isNullable: true },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_persons_gender',
            expression: `"gender" IN ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN')`,
          }),
          new TableCheck({
            name: 'chk_persons_generation',
            expression: `"generation" >= 1`,
          }),
          new TableCheck({
            name: 'chk_persons_birth_order',
            expression: `"birth_order" >= 1`,
          }),
          new TableCheck({
            name: 'chk_persons_birth_date_precision',
            expression: `"birth_date_precision" IN ('FULL', 'YEAR', 'APPROX')`,
          }),
          new TableCheck({
            name: 'chk_persons_death_date_precision',
            expression: `"death_date_precision" IN ('FULL', 'YEAR', 'APPROX')`,
          }),
          new TableCheck({
            name: 'chk_persons_death_lunar_date',
            expression: `"death_lunar_date" ~ '^(0[1-9]|[12][0-9]|30)/(0[1-9]|1[0-2])N?$'`,
          }),
          new TableCheck({
            name: 'chk_persons_death_after_birth',
            expression: `"death_date" IS NULL OR "birth_date" IS NULL OR "death_date" >= "birth_date"`,
          }),
          new TableCheck({
            name: 'chk_persons_death_implies_deceased',
            expression: `"death_date" IS NULL OR "is_deceased" = true`,
          }),
        ],
        indices: [
          new TableIndex({
            name: 'idx_persons_generation',
            columnNames: ['generation'],
          }),
          new TableIndex({
            name: 'idx_persons_deleted_at',
            columnNames: ['deleted_at'],
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('persons', true, true, true);
  }
}
