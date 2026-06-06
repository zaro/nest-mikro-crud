import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreateBookDto {
  @IsString()
  name!: string;

  @Type()
  @IsInt()
  price!: number;

  @Type()
  @IsInt()
  summary!: number;

  @IsBoolean()
  @IsOptional()
  favorite!: boolean;
}
