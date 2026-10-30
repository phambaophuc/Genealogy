import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DatePrecision, PersonGender } from './genealogy.enums';
import { ParentChild } from './parent-child.entity';
import { Spouse } from './spouse.entity';
import { User } from './user.entity';

@Entity({ name: 'persons' })
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({
    name: 'common_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  commonName!: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    default: PersonGender.UNKNOWN,
  })
  gender!: PersonGender;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'birth_order', type: 'smallint', nullable: true })
  birthOrder!: number | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({
    name: 'birth_date_precision',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  birthDatePrecision!: DatePrecision | null;

  @Column({ name: 'death_date', type: 'date', nullable: true })
  deathDate!: string | null;

  @Column({
    name: 'death_date_precision',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  deathDatePrecision!: DatePrecision | null;

  @Column({
    name: 'death_lunar_date',
    type: 'varchar',
    length: 6,
    nullable: true,
  })
  deathLunarDate!: string | null;

  @Column({
    name: 'is_deceased',
    type: 'boolean',
    default: false,
  })
  isDeceased!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hometown!: string | null;

  @Column({ name: 'current_address', type: 'text', nullable: true })
  currentAddress!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  occupation!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'burial_place', type: 'text', nullable: true })
  burialPlace!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

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

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt!: Date | null;

  @OneToMany(() => ParentChild, (parentChild) => parentChild.parent)
  childrenRelations!: ParentChild[];

  @OneToMany(() => ParentChild, (parentChild) => parentChild.child)
  parentRelations!: ParentChild[];

  @OneToMany(() => Spouse, (spouse) => spouse.personA)
  spousesAsA!: Spouse[];

  @OneToMany(() => Spouse, (spouse) => spouse.personB)
  spousesAsB!: Spouse[];

  @OneToOne(() => User, (user) => user.person)
  user!: User | null;
}
