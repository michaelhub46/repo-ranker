import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchRepositoriesDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  q: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  created?: string;

  @IsOptional()
  @IsIn(['stars', 'forks', 'help-wanted-issues', 'updated'])
  sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';

  @IsOptional()
  @IsIn(['desc', 'asc'])
  order?: 'desc' | 'asc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}