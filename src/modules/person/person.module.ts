import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentChild } from '../../database/entities/parent-child.entity';
import { Person } from '../../database/entities/person.entity';
import { Spouse } from '../../database/entities/spouse.entity';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';

@Module({
  imports: [TypeOrmModule.forFeature([Person, ParentChild, Spouse])],
  controllers: [PersonController],
  providers: [PersonService],
  exports: [PersonService],
})
export class PersonModule {}
