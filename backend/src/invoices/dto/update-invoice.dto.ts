import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInvoiceDto {
  @IsString()
  @IsOptional()
  invoiceNo?: string;

  @IsString()
  @IsOptional()
  leaseId?: string;

  @IsString()
  @IsOptional()
  tenantName?: string;

  @IsString()
  @IsOptional()
  tenantEmail?: string;

  @IsString()
  @IsOptional()
  tenantPhone?: string;

  @IsString()
  @IsOptional()
  propertyName?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

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
  @IsOptional()
  dueDate?: string;

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
