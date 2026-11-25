import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MaintenanceDocument = HydratedDocument<Maintenance>;

@Schema({ timestamps: true })
export class Maintenance {
    @Prop({ required: true, unique: true })
    ticketNo: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    propertyName: string;

    @Prop({ required: true })
    unit: string;

    @Prop({ required: true })
    category: string;

    @Prop({
        required: true,
        enum: ['Urgent', 'High', 'Medium', 'Low'],
        default: 'Medium',
    })
    priority: string;

    @Prop({ default: '' })
    assignedTo: string;


    @Prop({
        required: true,
        enum: ['Open', 'In Progress', 'Resolved'],
        default: 'Open',
    })
    status: string;

    @Prop()
    reportedBy: string;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);

