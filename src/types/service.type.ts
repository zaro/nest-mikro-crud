import { Type } from "@nestjs/common";
import { MikroCrudService } from "../service/mikro-crud-service.class";


type ExtractEntityGeneric<T> = T extends MikroCrudService<infer A, any, any> ? A : never;

export interface ServiceType<T = any> extends Type<T> {
    entityClass: Type<ExtractEntityGeneric<T>>; 
}
