import { Type as NestType } from "@nestjs/common";
import { ApiOperation, ApiOperationOptions, ApiParam, ApiParamOptions, ApiProperty, ApiQuery, ApiQueryOptions, ApiResponse, ApiResponseOptions } from '@nestjs/swagger'
import { Type } from "class-transformer";
import { QueryParams } from "../dto";
import type { FilterQueryParam, OrderQueryParam, PopulateParameters } from "../types";



interface ApiDecoratorsOptions {
  operation?: ApiOperationOptions | undefined;
  query?: ApiQueryOptions | undefined;
  path?: ApiParamOptions | undefined;
  response?: ApiResponseOptions | undefined;
}
export function appendApiDecorators(
  decorators: MethodDecorator[],
  options: ApiDecoratorsOptions
) {
  
  if (options.operation) {
    decorators.push(ApiOperation(options.operation));
  }
  if (options.query) {
    decorators.push(ApiQuery(options.query));
  }
  if (options.path) {
    decorators.push(ApiParam(options.path));
  }
  if (options.response) {
    decorators.push(ApiResponse(options.response));
  }
  return decorators;
}


export function listDto<T=any>(dto: NestType<T>) {
      class ListResponseDto {
        @ApiProperty({ type: dto, isArray: true })
        @Type(() => dto)
        results!: any[];

        @ApiProperty({ type: 'number' })
        total!: number;
    }

    return ListResponseDto;
}

export function queryParamsDtoList<Entity=any>(dto: NestType<Entity>) {
      class ListQueryDto implements QueryParams<Entity>{
        
        @ApiProperty({ type: 'number' })
        limit?: number;
        
        @ApiProperty({ type: 'number' })
        offset?: number;
        
        @ApiProperty({ type: 'string', isArray: true })
        order?: OrderQueryParam<Entity>[];

        @ApiProperty({ type: 'string', isArray: true })
        filter?: FilterQueryParam<Entity>[];

        @ApiProperty({ type: 'string', isArray: true })
        expand?: PopulateParameters<Entity>;
    }

    return ListQueryDto;
}

export function queryParamsDto<Entity=any>(dto: NestType<Entity>) {
      class QueryDto implements QueryParams<Entity>{

        @ApiProperty({ type: 'string', isArray: true })
        expand?: PopulateParameters<Entity>;
    }

    return QueryDto;
}

export const SwaggerApiProperty = ApiProperty;