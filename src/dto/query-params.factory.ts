import { Type as NestType } from "@nestjs/common";
import { AnyEntity } from "@mikro-orm/core";
import { Exclude, Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  Matches,
  Max,
  Min,
} from "class-validator";
import { FILTER_OPERATORS } from "..";
import { AbstractFactory } from "../abstract.factory";
import { FACTORY } from "../symbols";
import { OrderQueryParam } from "../types";
import { QueryParamsFactoryOptions } from "./query-params-factory-options.interface";
import { QueryParams } from "./query-params.interface";
import { SwaggerApiProperty } from "../controller/swagger.helper";

const deduplicate = (arr: unknown[]) => [...new Set(arr)];

export class QueryParamsFactory<
  Entity = any,
> extends AbstractFactory<QueryParams<Entity>> {
  readonly options;
  readonly product:  NestType<QueryParams<Entity>>;

  constructor(options: QueryParamsFactoryOptions<Entity>) {
    super();
    this.options = this.standardizeOptions(options);
    this.product = this.createRawClass();
    this.defineValidations();
    this.excludeDisabled();
    Reflect.defineMetadata(FACTORY, this, this.product);
  }

  protected standardizeOptions(options: QueryParamsFactoryOptions<Entity>) {
    const { order } = options;

    return {
      ...options,
      order: order
        ? {
            ...order,
            in: deduplicate(
              order.in.flatMap((v) =>
                v.includes(":") ? v : [`${v}:asc`, `${v}:desc`]
              )
            ) as OrderQueryParam<Entity>[],
          }
        : undefined,
    };
  }

  protected createRawClass() {
    const { limit, offset, order, filter, expand } = this.options;

    class QueryParamsImpl implements QueryParams<Entity> {
      @SwaggerApiProperty({type: 'number', required: false})
      limit? = limit?.default;
      @SwaggerApiProperty({type: 'number', required: false})
      offset? = offset?.default;
      @SwaggerApiProperty({name: 'order[]', type: 'string', isArray: true, required: false})
      order? = order?.default;
      @SwaggerApiProperty({name: 'filter[]',type: 'string', isArray: true, required: false})
      filter? = filter?.default;
      @SwaggerApiProperty({name: 'expand[]',type: 'string', isArray: true, required: false})
      expand? = expand?.default;
    };
    return QueryParamsImpl;
  }

  protected defineValidations() {
    const { limit, offset, order, filter, expand } = this.options;

    if (limit)
      this.defineType("limit", Number).applyPropertyDecorators(
        "limit",
        Type(() => Number),
        IsOptional(),
        IsNumber(),
        Min(1),
        ...(limit.max ? [Max(limit.max)] : [])
      );

    if (offset)
      this.defineType("offset", Number).applyPropertyDecorators(
        "offset",
        Type(() => Number),
        IsOptional(),
        IsNumber(),
        Min(1),
        ...(offset.max ? [Max(offset.max)] : [])
      );

    if (order)
      this.defineType("order", Array).applyPropertyDecorators(
        "order",
        Type(() => String),
        IsOptional(),
        IsArray(),
        IsIn(order.in, { each: true })
      );

    if (filter)
      this.defineType("filter", Array).applyPropertyDecorators(
        "filter",
        Type(() => String),
        IsOptional(),
        IsArray(),
        Matches(
          `^(${filter.in.join("|")})\\|(${FILTER_OPERATORS.join("|")}):.*$`,
          undefined,
          { each: true }
        )
      );

    if (expand)
      this.defineType("expand", Array).applyPropertyDecorators(
        "expand",
        Type(() => String),
        IsOptional(),
        IsArray(),
        IsIn(Array.isArray(expand.in) ? expand.in : [expand.in], { each: true })
      );
  }

  protected excludeDisabled() {
    const names: (keyof QueryParamsFactoryOptions<Entity>)[] = [
      "order",
      "filter",
      "expand",
    ];
    for (const name of names)
      if (!this.options[name]) this.applyPropertyDecorators(name, Exclude());
  }
}
