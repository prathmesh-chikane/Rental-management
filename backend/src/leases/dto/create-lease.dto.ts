import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// =============================================================================
// CreateLeaseDto (नवीन भाडे करार तयार करण्यासाठी डेटा ट्रान्सफर ऑब्जेक्ट)
// =============================================================================

export class CreateLeaseDto {
  @IsString()
  @IsOptional()
  leaseNumber?: string;

  @IsString()
  tenantName: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  propertyName: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  unit: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit?: number;

  @IsNumber()
  @IsOptional()
  rentDueDay?: number;

  @IsEnum(['Active', 'Expiring Soon', 'Terminated', 'Draft'])
  @IsOptional()
  status?: 'Active' | 'Expiring Soon' | 'Terminated' | 'Draft';

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  terms?: string;
}
