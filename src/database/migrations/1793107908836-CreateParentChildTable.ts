import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateParentChildTable1793107908836 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'parent_child',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk_parent_child',
            default: 'gen_random_uuid()',
          },
          { name: 'parent_id', type: 'uuid' },
          { name: 'child_id', type: 'uuid' },
          {
            name: 'kind',
            type: 'varchar',
            length: '12',
            default: `'BIOLOGICAL'`,
          },
          { name: 'parent_role', type: 'varchar', length: '6' },
        ],
        uniques: [
          new TableUnique({
            name: 'uq_parent_child_pair',
            columnNames: ['parent_id', 'child_id'],
          }),
        ],
        checks: [
          new TableCheck({
            name: 'chk_parent_child_kind',
            expression: `"kind" IN ('BIOLOGICAL', 'ADOPTED', 'STEP')`,
          }),
          new TableCheck({
            name: 'chk_parent_child_role',
            expression: `"parent_role" IN ('FATHER', 'MOTHER')`,
          }),
          new TableCheck({
            name: 'chk_parent_child_not_self',
            expression: `"parent_id" <> "child_id"`,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_parent_child_parent',
            columnNames: ['parent_id'],
            referencedTableName: 'persons',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
          new TableForeignKey({
            name: 'fk_parent_child_child',
            columnNames: ['child_id'],
            referencedTableName: 'persons',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'uq_parent_child_bio_role',
            columnNames: ['child_id', 'parent_role'],
            isUnique: true,
            where: `"kind" = 'BIOLOGICAL'`,
          }),
          new TableIndex({
            name: 'idx_parent_child_parent',
            columnNames: ['parent_id'],
          }),
          new TableIndex({
            name: 'idx_parent_child_child',
            columnNames: ['child_id'],
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('parent_child', true, true, true);
  }
}
