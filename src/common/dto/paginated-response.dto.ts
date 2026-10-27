import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from './page-meta.dto';
import { PaginationQueryDto } from './pagination-query.dto';

/**
 * Standard paginated payload returned inside `data`:
 *
 * { success: true, data: { items, meta }, requestId, timestamp }
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true, description: 'Items on the current page.' })
  items!: T[];

  @ApiProperty({ type: () => PageMetaDto })
  meta!: PageMetaDto;

  constructor(
    items: T[],
    total: number,
    query: Pick<PaginationQueryDto, 'page' | 'limit'>,
  ) {
    this.items = items;
    this.meta = new PageMetaDto(query.page, query.limit, total);
  }
}
