import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePropertyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  units?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  occupied?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyRevenue?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @Min(1900)
  @Max(2200)
  @IsOptional()
  constructionYear?: number;

  @Matches(/^[A-Za-z0-9/-]{6,30}$/)
  @IsOptional()
  reraNumber?: string;

  @IsString()
  @IsOptional()
  landmark?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  carpetArea?: number;

  @IsInt()
  @Min(1)
  @Max(150)
  @IsOptional()
  totalFloors?: number;

  @IsString()
  @IsOptional()
  managerName?: string;

  @Matches(/^[6-9][0-9]{9}$/)
  @IsOptional()
  managerPhone?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
