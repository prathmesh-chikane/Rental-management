import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;   //आपण OrganizationDocument नावाचा TypeScript type तयार करत आहोत.

@Schema({ timestamps: true, versionKey: false })
export class Organization {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    })
    slug: string;

    @Prop({    //MongoDB field define करतो.
        required: true,
        lowercase: true,
        trim: true,   //सुरुवातीचे आणि शेवटचे extra spaces काढतो.
    })
    email: string;

    // Phone Number
    @Prop({
        type: String,
        trim: true,
        default: null,
    })
    phone: string | null;

    // Address
    @Prop({
        type: String,
        trim: true,
        default: null,
    })
    address: string | null;


    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    ownerId: Types.ObjectId;

    @Prop({ default: true })
    isActive: boolean;
}

export const OrganizationSchema =
    SchemaFactory.createForClass(Organization);