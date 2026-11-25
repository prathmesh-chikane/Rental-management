import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// =============================================================================
// Lease Mongoose Schema (भाडे करार डेटाबेस स्कीमा)
//
// यात खालील महत्त्वाच्या बाबी साठवल्या जातात:
// 1. leaseNumber: कराराचा युनिक आयडी (उदा. LSE-2026-081)
// 2. tenantName: भाडेकरूचे नाव
// 3. propertyName & unit: इमारत आणि फ्लॅट/शॉप नंबर
// 4. startDate & endDate: करार कधी सुरू झाला आणि कधी संपणार
// 5. monthlyRent & deposit: मासिक भाडे आणि डिपॉझिट
// 6. status: Active (चालू), Expiring Soon (लवकरच संपणारा), Terminated (संपलेला)
// =============================================================================

export type LeaseDocument = HydratedDocument<Lease>;

@Schema({ timestamps: true })
export class Lease {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  leaseNumber: string;

  @Prop({ required: true, trim: true })
  tenantName: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  propertyName: string;

  @Prop({ type: Types.ObjectId, ref: 'Property', index: true })
  propertyId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  unit: string;

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true })
  endDate: string;

  @Prop({ required: true, min: 0 })
  monthlyRent: number;

  @Prop({ default: 0, min: 0 })
  deposit: number;

  @Prop({ default: 5, min: 1, max: 31 })
  rentDueDay: number; // दर महिन्याच्या कोणत्या तारखेला भाडे देय आहे (उदा. 5 तारीख)

  @Prop({
    default: 'Active',
    enum: ['Active', 'Expiring Soon', 'Expired'],
  })
  status: 'Active' | 'Expiring Soon' | 'Expired';

  @Prop({ default: '' })
  documentUrl?: string;

  @Prop({ default: '' })
  terms?: string;
}

export const LeaseSchema = SchemaFactory.createForClass(Lease);

// tenantName आणि propertyName साठी सर्च इंडेक्स (leaseNumber ला @Prop unique: true वरून आपोआप युनिक इंडेक्स मिळतो)
LeaseSchema.index({ tenantName: 1 });
LeaseSchema.index({ propertyName: 1 });
