import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// User document type
export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: true, // createdAt आणि updatedAt automatically add होतील
    versionKey: false, // __v field disable
})
export class User {
    // User चे पूर्ण नाव
    @Prop({
        required: true,
        trim: true,
    })
    name: string;

    // Email unique असणे आवश्यक आहे
    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    })
    email: string;

    // Password database मध्ये hash करूनच save करायचा
    @Prop({
        required: true,
        select: false, // Default queries मध्ये password return होणार नाही
    })
    password: string;

    // User ची भूमिका
    @Prop({
        required: true,
        enum: ['superadmin', 'admin', 'staff', 'tenant'],
        default: 'tenant',
    })
    role: string;

    // User कोणत्या Organization मध्ये आहे
    @Prop({
        type: Types.ObjectId,
        ref: 'Organization',
        default: null,
    })
    organizationId: Types.ObjectId | null;

    // Account active आहे की नाही
    @Prop({
        type: Boolean,
        default: true,
    })
    isActive: boolean;
}

// MongoDB Schema तयार करणे
export const UserSchema = SchemaFactory.createForClass(User);