import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiCommonErrorResponses,
  ApiCreatedEnvelopeResponse,
  ApiOkEnvelopeResponse,
  ApiPaginatedEnvelopeResponse,
} from '../../common/decorators/api-response.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonRelationsDto } from './dto/person-relations.dto';
import { PersonResponseDto } from './dto/person-response.dto';
import { QueryPersonsDto } from './dto/query-persons.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonService } from './person.service';

@ApiTags('persons')
@ApiBearerAuth('access-token')
@Controller('persons')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a person' })
  @ApiCreatedEnvelopeResponse(PersonResponseDto)
  @ApiCommonErrorResponses()
  create(@Body() dto: CreatePersonDto): Promise<PersonResponseDto> {
    return this.personService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List persons',
    description:
      'Paginated list. `search` matches full name and common name, ignoring ' +
      'Vietnamese diacritics.',
  })
  @ApiPaginatedEnvelopeResponse(PersonResponseDto)
  @ApiCommonErrorResponses()
  findAll(
    @Query() query: QueryPersonsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<PersonResponseDto>> {
    return this.personService.findAll(query, {
      allowDeleted: user.roles.includes(Role.ADMIN),
    });
  }

  @Get(':id/relations')
  @ApiOperation({ summary: 'Get parents, children and spouses of a person' })
  @ApiOkEnvelopeResponse(PersonRelationsDto)
  @ApiCommonErrorResponses()
  findRelations(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PersonRelationsDto> {
    return this.personService.findRelations(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a person by id' })
  @ApiOkEnvelopeResponse(PersonResponseDto)
  @ApiCommonErrorResponses()
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PersonResponseDto> {
    return this.personService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update a person',
    description:
      'Partial update. Omit a field to keep it, send null to clear it.',
  })
  @ApiOkEnvelopeResponse(PersonResponseDto)
  @ApiCommonErrorResponses()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePersonDto,
  ): Promise<PersonResponseDto> {
    return this.personService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a person' })
  @ApiNoContentResponse({ description: 'Person soft-deleted.' })
  @ApiCommonErrorResponses()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.personService.remove(id);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted person' })
  @ApiOkEnvelopeResponse(PersonResponseDto)
  @ApiCommonErrorResponses()
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<PersonResponseDto> {
    return this.personService.restore(id);
  }
}
