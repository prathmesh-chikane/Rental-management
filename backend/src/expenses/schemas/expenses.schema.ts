import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ExpensesDocument = Expenses & Document;

export const EXPENSES_CATEGORIES = ['Maintenance', 'Utilities', 'Taxes', 'Insurance', 'Housekeeping', 'Security', 'Supplies', 'Other'] as const;
export type ExpensesCategory = (typeof EXPENSES_CATEGORIES)[number];

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

@Schema({ timestamps: true })
export class Expenses {
    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: true, enum: EXPENSES_CATEGORIES, default: 'Maintenance' })
    category: ExpensesCategory;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({
        type: Types.ObjectId,
        ref: 'Property',
        required: true,
    })
    property: Types.ObjectId

    @Prop({ required: true, default: () => new Date() })
    date: Date;

    @Prop({ required: true, enum: PAYMENT_METHODS, default: 'UPI' })
    paymentMethod: PaymentMethod;

    @Prop({ required: true, enum: ['Paid', 'Pending'], default: 'Paid' })
    status: 'Paid' | 'Pending';

    @Prop({ default: '' })
    paidTo: string;

    @Prop({ default: '' })
    notes?: string;
}

export const ExpensesSchema = SchemaFactory.createForClass(Expenses);