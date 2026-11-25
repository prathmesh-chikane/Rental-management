import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLeaseDto {
  @IsString()
  @IsOptional()
  leaseNumber?: string;

  @IsString()
  @IsOptional()
  tenantName?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  propertyName?: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyRent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit?: number;

  @IsNumber()
  @IsOptional()
  rentDueDay?: number;

  @IsEnum(['Active', 'Expiring Soon', 'Expired'])
  @IsOptional()
  status?: 'Active' | 'Expiring Soon' | 'Expired';

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  terms?: string;
}
