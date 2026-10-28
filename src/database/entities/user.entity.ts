import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserRole } from './genealogy.enums';
import { Person } from './person.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: UserRole.MEMBER,
  })
  role!: UserRole;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  personId!: string | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: 'must_change_password',
    type: 'boolean',
    default: true,
  })
  mustChangePassword!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;

  @OneToOne(() => Person, (person) => person.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'person_id',
    foreignKeyConstraintName: 'fk_users_person',
  })
  person!: Person | null;
}
