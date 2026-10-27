import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateUsersTable1793106949332 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk_users',
            default: 'gen_random_uuid()',
          },
          { name: 'email', type: 'varchar', length: '255' },
          { name: 'password_hash', type: 'text' },
          {
            name: 'role',
            type: 'varchar',
            length: '10',
            default: `'MEMBER'`,
          },
          {
            name: 'person_id',
            type: 'uuid',
            isNullable: true,
          },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'must_change_password', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
        checks: [
          new TableCheck({
            name: 'chk_users_role',
            expression: `"role" IN ('ADMIN', 'MEMBER')`,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_users_person',
            columnNames: ['person_id'],
            referencedTableName: 'persons',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'uq_users_person',
            columnNames: ['person_id'],
            isUnique: true,
            where: `"person_id" IS NOT NULL`,
          }),
        ],
      }),
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email_lower" ON "users" (lower("email"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_email_lower"`);
    await queryRunner.dropTable('users', true, true, true);
  }
}
