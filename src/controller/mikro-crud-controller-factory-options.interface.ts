import {
  AnyEntity,
  EntityData,
  EntityKey,
  RequiredEntityData,
} from '@mikro-orm/core';
import { Type, ValidationPipeOptions } from '@nestjs/common';
import { QueryParams } from '../dto';
import { MikroCrudService } from '../service';
import { ActionName, LookupableField, PkType } from '../types';
import { ServiceType } from '../types/service.type';

export interface MikroCrudControllerFactoryOptions<
  Entity extends AnyEntity<Entity> = any,
  CreateDto extends RequiredEntityData<Entity> = RequiredEntityData<Entity>,
  UpdateDto extends EntityData<Entity> = EntityData<Entity>,
  LookupField extends EntityKey<Entity> = EntityKey<Entity>,
  Service extends MikroCrudService<
    Entity,
    CreateDto,
    UpdateDto
  > = MikroCrudService<Entity, CreateDto, UpdateDto>,
> {
  /**
   * The service will be auto-injected for db CRUD actions.
   */
  service: ServiceType<Service>;
  /**
   * Specify which actions should be enabled.
   */
  actions: ActionName[];
  /**
   * Be used to validate query params.
   */
  params?: Type<QueryParams<Entity>>;
  lookup: {
    /**
     * Choose the field used for entity lookup.
     */
    field: LookupField;
    /**
     * Specify the data type of field to lookup. Will be inferred from the metadata
     * type if not specified: Number -> "number", String -> "uuid"
     */
    type?: PkType;
    /**
     * Specify the parameter name for entity lookup in the URL
     */
    name?: string;
  };
  requestUser?: { type?: Type; decorators: ParameterDecorator[] };
  /**
   * - `transform` will be forced to be `true`
   * - `transformOptions.exposeDefaultValues` will be forced to be `true`
   */
  validationPipeOptions?: ValidationPipeOptions;
}
