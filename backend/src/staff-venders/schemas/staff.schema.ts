import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StaffDocument = HydratedDocument<Staff>;

@Schema({ timestamps: true })
export class Staff {
    @Prop({ required: true })
    name: string;

    @Prop({
        required: true,
        enum: [
            'Plumbing',
            'Electrical',
            'Carpentry',
            'Appliance',
            'Cleaning',
            'Painting',
            'Security',
            'Other',
        ],
    })
    category: string; // त्याचा कामाचा प्रकार

    @Prop({ required: true })
    phone: string;

    @Prop({ default: '' })
    email: string;

    @Prop({
        required: true,
        enum: ['Available', 'Busy', 'Inactive'],
        default: 'Available',
    })
    status: string;

    @Prop({ default: '' })
    propertyName: string; // कोणत्या सोसायटी / प्रॉपर्टीसाठी काम करतो
}

export const StaffSchema = SchemaFactory.createForClass(Staff);