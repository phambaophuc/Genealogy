import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TreeService } from './tree.service';
import { TreeGraphResponseDto } from './dto/tree-graph-response.dto';
import { createHash } from 'crypto';
import type { Response } from 'express';
import {
  ApiCommonErrorResponses,
  ApiOkEnvelopeResponse,
} from 'src/common/decorators/api-response.decorator';

@ApiTags('Tree Controller')
@ApiBearerAuth('access-token')
@Controller('tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @Get('graph')
  @ApiOperation({
    summary: 'Get the complete family graph',
    description:
      'Returns flat person, parent-child and spouse collections. ' +
      'Soft-deleted persons and their relationships are excluded.',
  })
  @ApiOkEnvelopeResponse(TreeGraphResponseDto)
  @ApiCommonErrorResponses()
  async getGraph(
    @Res({ passthrough: true }) response: Response,
  ): Promise<TreeGraphResponseDto> {
    const graph = await this.treeService.getGraph();

    const etag = createHash('sha256')
      .update(JSON.stringify(graph))
      .digest('hex');

    response.setHeader('ETag', `"${etag}"`);

    return graph;
  }
}
