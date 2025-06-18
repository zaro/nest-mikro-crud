import { Type as NestType } from "@nestjs/common";
import { ApiOperation, ApiOperationOptions, ApiParam, ApiParamOptions, ApiProperty, ApiQuery, ApiQueryOptions, ApiResponse, ApiResponseOptions } from '@nestjs/swagger'
import { Type } from "class-transformer";
import { QueryParams } from "../dto";
import type { FilterQueryParam, OrderQueryParam, PopulateParameters } from "../types";


class ErrorResponse {
  @ApiProperty({type: 'number'})
  statusCode!: number;
  @ApiProperty({type: 'string'})
  message!:string;
}


interface ApiDecoratorsOptions {
  operation?: ApiOperationOptions | undefined;
  query?: ApiQueryOptions | undefined;
  path?: ApiParamOptions | undefined;
  responses?: ApiResponseOptions[] | undefined;
  noErrorResponses?: boolean;
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
  if (options.responses) {
    decorators.push(...options.responses?.map( r => ApiResponse(r)));
  }
  if(!options.noErrorResponses){
    decorators.push(ApiResponse({
      status: '4XX',
      type: ErrorResponse
    }));
    decorators.push(ApiResponse({
      status: '5XX',
      type: ErrorResponse
    }));
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

    Object.defineProperty(ListResponseDto, 'name', {
      value: `${dto.name}ListResponseDto`,
      configurable: false,
      writable: false
    });
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