import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// =============================================================================
// Invoice Mongoose Schema (भाडे बिल / इनव्हॉइस डेटाबेस स्कीमा)
//
// यात खालील महत्त्वाच्या बाबी साठवल्या जातात:
// 1. invoiceNo: बिलाचा युनिक नंबर (उदा. INV-2026-1101)
// 2. tenantName, propertyName, unit: कोणाचे, कोणत्या इमारतीचे आणि फ्लॅटचे बिल
// 3. amount: बिलाची एकूण रक्कम (भाडे + मेंटेनन्स + युटिलिटी)
// 4. issueDate & dueDate: बिल कधी निघाले आणि कधीपर्यंत भरायचे आहे
// 5. paidDate & paymentMethod: पैसे भरल्याची तारीख आणि पद्धत (UPI, Bank Transfer, Cash)
// 6. status: 'Paid' (भरले), 'Unpaid' (प्रलंबित), 'Overdue' (मुदत संपली तरी न भरलेले)
// =============================================================================

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  invoiceNo: string;

  @Prop({ type: Types.ObjectId, ref: 'Lease', index: true })
  leaseId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  tenantName: string;

  @Prop({ default: '' })
  tenantEmail?: string;

  @Prop({ default: '' })
  tenantPhone?: string;

  @Prop({ required: true, trim: true })
  propertyName: string;

  @Prop({ required: true, trim: true })
  unit: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: 0, min: 0 })
  rentAmount?: number;

  @Prop({ default: 0, min: 0 })
  maintenanceCharges?: number;

  @Prop({ default: 0, min: 0 })
  utilityCharges?: number;

  @Prop({ required: true })
  issueDate: string;

  @Prop({ required: true })
  dueDate: string;

  @Prop({ default: '' })
  paidDate?: string;

  @Prop({ default: '' })
  paymentMethod?: string; // UPI, Net Banking, Cash, Cheque

  @Prop({ default: '' })
  transactionId?: string;

  @Prop({
    default: 'Unpaid',
    enum: ['Paid', 'Unpaid', 'Overdue'],
  })
  status: 'Paid' | 'Unpaid' | 'Overdue';

  @Prop({ default: '' })
  notes?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// tenantName आणि status साठी सर्च इंडेक्स (invoiceNo ला @Prop unique: true वरून आपोआप युनिक इंडेक्स मिळतो)
InvoiceSchema.index({ tenantName: 1 });
InvoiceSchema.index({ status: 1 });
