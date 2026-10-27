import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../dto/api-error-response.dto';
import { ApiSuccessResponseDto } from '../dto/api-response.dto';
import { PageMetaDto } from '../dto/page-meta.dto';

const dataPropertySchema = (model: Type<unknown>, isArray = false) =>
  isArray
    ? {
        type: 'array',
        items: { $ref: getSchemaPath(model) },
      }
    : { $ref: getSchemaPath(model) };

const successEnvelopeSchema = (model: Type<unknown>, isArray = false) => ({
  allOf: [
    { $ref: getSchemaPath(ApiSuccessResponseDto) },
    {
      properties: {
        data: dataPropertySchema(model, isArray),
      },
    },
  ],
});

/**
 * Documents a 200 response that follows the standard success envelope.
 */
export const ApiOkEnvelopeResponse = (
  model: Type<unknown>,
  options: { description?: string; isArray?: boolean } = {},
) =>
  applyDecorators(
    ApiExtraModels(ApiSuccessResponseDto, model),
    ApiOkResponse({
      description: options.description ?? 'Successful response',
      schema: successEnvelopeSchema(model, options.isArray),
    }),
  );

/**
 * Documents a 201 response that follows the standard success envelope.
 */
export const ApiCreatedEnvelopeResponse = (
  model: Type<unknown>,
  options: { description?: string; isArray?: boolean } = {},
) =>
  applyDecorators(
    ApiExtraModels(ApiSuccessResponseDto, model),
    ApiCreatedResponse({
      description: options.description ?? 'Resource created',
      schema: successEnvelopeSchema(model, options.isArray),
    }),
  );

/**
 * Documents a paginated 200 response using PaginatedResponseDto's shape.
 */
export const ApiPaginatedEnvelopeResponse = (
  model: Type<unknown>,
  description = 'Paginated response',
) =>
  applyDecorators(
    ApiExtraModels(ApiSuccessResponseDto, PageMetaDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessResponseDto) },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                  meta: { $ref: getSchemaPath(PageMetaDto) },
                },
                required: ['items', 'meta'],
              },
            },
          },
        ],
      },
    }),
  );

/**
 * Attaches the standard error responses to an endpoint.
 */
export const ApiCommonErrorResponses = () =>
  applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ApiBadRequestResponse({
      description: 'Invalid request payload or query parameters.',
      schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
    }),
    ApiUnauthorizedResponse({
      description: 'Missing, invalid or expired access token.',
      schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
    }),
    ApiForbiddenResponse({
      description: 'The authenticated user lacks the required role.',
      schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
    }),
    ApiNotFoundResponse({
      description: 'The requested resource was not found.',
      schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
    }),
    ApiTooManyRequestsResponse({
      description: 'Rate limit exceeded.',
      schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
    }),
    ApiInternalServerErrorResponse({
      description: 'Unexpected server error.',
      schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
    }),
  );
