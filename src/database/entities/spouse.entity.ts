import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { SpouseEndReason } from './genealogy.enums';
import { Person } from './person.entity';

@Entity({ name: 'spouses' })
export class Spouse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'person_a_id', type: 'uuid' })
  personAId!: string;

  @Column({ name: 'person_b_id', type: 'uuid' })
  personBId!: string;

  @Column({ name: 'marriage_date', type: 'date', nullable: true })
  marriageDate!: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({
    name: 'end_reason',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  endReason!: SpouseEndReason | null;

  @ManyToOne(() => Person, (person) => person.spousesAsA, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'person_a_id' })
  personA!: Person;

  @ManyToOne(() => Person, (person) => person.spousesAsB, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'person_b_id' })
  personB!: Person;
}
