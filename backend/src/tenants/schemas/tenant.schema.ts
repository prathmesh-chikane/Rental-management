import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true })
export class Tenant {
  // Step 1: Personal Details
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ default: '' })
  emergencyContact: string;

  // Step 2: Property & Unit Details
  @Prop({ required: true, default: 'Greenfield Heights' })
  propertyName: string;

  @Prop({ required: true, default: 'Flat 101' })
  unit: string;

  @Prop({ default: '' })
  wing: string;

  // Step 3: Financial & Lease Details
  @Prop({ default: 0 })
  monthlyRent: number;

  @Prop({ default: 0 })
  securityDeposit: number;

  @Prop({ default: '01 Nov 2026' })
  moveInDate: string;

  @Prop({ default: '31 Oct 2027' })
  leaseEndDate: string;

  // Step 4: Verification & Status
  @Prop({ default: '' })
  aadhaarNumber: string;

  @Prop({ default: 'Pending', enum: ['Verified', 'Pending', 'In Progress'] })
  policeVerification: string;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status: string;

  @Prop({ default: '' })
  notes: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
