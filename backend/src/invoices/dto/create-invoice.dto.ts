import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// =============================================================================
// CreateInvoiceDto (नवीन बिल जनरेट करण्यासाठी डेटा ट्रान्सफर ऑब्जेक्ट)
// =============================================================================

export class CreateInvoiceDto {
  @IsString()
  @IsOptional()
  invoiceNo?: string;

  @IsString()
  @IsOptional()
  leaseId?: string;

  @IsString()
  tenantName: string;

  @IsString()
  @IsOptional()
  tenantEmail?: string;

  @IsString()
  @IsOptional()
  tenantPhone?: string;

  @IsString()
  propertyName: string;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rentAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maintenanceCharges?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  utilityCharges?: number;

  @IsString()
  @IsOptional()
  issueDate?: string;

  @IsString()
  dueDate: string;

  @IsString()
  @IsOptional()
  paidDate?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsEnum(['Paid', 'Unpaid', 'Overdue'])
  @IsOptional()
  status?: 'Paid' | 'Unpaid' | 'Overdue';

  @IsString()
  @IsOptional()
  notes?: string;
}
