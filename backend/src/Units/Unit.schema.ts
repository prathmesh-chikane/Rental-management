import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UnitDocument = HydratedDocument<Unit>;

export const UNIT_STATUSES = ['vacant', 'occupied', 'maintenance'] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

// One flat / shop / office, for example "A-101".
@Schema({ timestamps: true, collection: 'units' })
export class Unit {
    // Which landlord (organization) owns this unit
    @Prop({ type: Types.ObjectId, required: true, index: true })
    organizationId: Types.ObjectId;

    // Which property (building) this unit is inside
    @Prop({ type: Types.ObjectId, required: true, index: true })
    propertyId: Types.ObjectId;

    // "A-101". Always saved in CAPITAL letters, so "a-101" and "A-101" are the same unit.
    @Prop({ type: String, required: true, trim: true, uppercase: true, maxlength: 20 })
    unitNumber: string;

    // "A", "B" ... (can be empty for a building without wings)
    @Prop({ type: String, trim: true, uppercase: true, default: '' })
    wing: string;

    @Prop({ type: Number, default: 0, min: 0 })
    floor: number;

    // "1 BHK", "2 BHK", "Shop" ...
    @Prop({ type: String, trim: true, default: '' })
    type: string;

    @Prop({ type: Number, default: 0, min: 0 })
    rentAmount: number;

    @Prop({ type: Number, default: 0, min: 0 })
    depositAmount: number;

    @Prop({ type: String, enum: UNIT_STATUSES, default: 'vacant' })
    status: UnitStatus;

    // The tenant living in this unit (empty when the unit is Vacant)
    @Prop({ type: Types.ObjectId, index: true })
    tenantId?: Types.ObjectId;

    // Soft delete: we never really remove a unit, we only hide it
    @Prop({ type: Boolean, default: false, index: true })
    isDeleted: boolean;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);

// THE RULE: the same unit number can NEVER be used twice inside the same property.
// (Deleted units are ignored, so you can re-use a number after deleting it.)
UnitSchema.index(
    { propertyId: 1, unitNumber: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } },
);