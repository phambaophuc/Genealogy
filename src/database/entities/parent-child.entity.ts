import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ParentChildKind, ParentRole } from './genealogy.enums';
import { Person } from './person.entity';

@Entity({ name: 'parent_child' })
export class ParentChild {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'parent_id', type: 'uuid' })
  parentId!: string;

  @Column({ name: 'child_id', type: 'uuid' })
  childId!: string;

  @Column({
    type: 'varchar',
    length: 12,
    default: ParentChildKind.BIOLOGICAL,
  })
  kind!: ParentChildKind;

  @Column({
    name: 'parent_role',
    type: 'varchar',
    length: 6,
  })
  parentRole!: ParentRole;

  @ManyToOne(() => Person, (person) => person.childrenRelations, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'parent_id',
    foreignKeyConstraintName: 'fk_parent_child_parent',
  })
  parent!: Person;

  @ManyToOne(() => Person, (person) => person.parentRelations, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'child_id',
    foreignKeyConstraintName: 'fk_parent_child_child',
  })
  child!: Person;
}
