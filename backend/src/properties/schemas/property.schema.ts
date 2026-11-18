import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PropertyDocument = HydratedDocument<Property>;

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({ default: 'Luxury Residential' })
  type: string;

  @Prop({ default: 1, min: 0 })
  units: number;

  @Prop({ default: 0, min: 0 })
  occupied: number;

  @Prop({ default: 0, min: 0 })
  rent: number;

  @Prop({ default: 0, min: 0 })
  monthlyRevenue: number;

  @Prop({ default: 'Available' })
  status: string;

  // @Prop({ default: 4.5, min: 0, max: 5 })
  // rating: number;

  @Prop({ default: '' })
  image: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ min: 1900, max: 2200 })
  constructionYear?: number;

  @Prop({ trim: true, uppercase: true, match: /^[A-Za-z0-9/-]{6,30}$/ })
  reraNumber?: string;

  @Prop({ trim: true })
  landmark?: string;

  @Prop({ min: 1 })
  carpetArea?: number;

  @Prop({ min: 1, max: 150 })
  totalFloors?: number;

  @Prop({ trim: true })
  managerName?: string;

  @Prop({ trim: true, match: /^[6-9][0-9]{9}$/ })
  managerPhone?: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

PropertySchema.pre('save', function () {
  if (this.rent && !this.monthlyRevenue) {
    this.monthlyRevenue = this.rent;
  } else if (this.monthlyRevenue && !this.rent) {
    this.rent = this.monthlyRevenue;
  }
});
