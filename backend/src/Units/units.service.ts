import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Property, PropertyDocument } from '../properties/schemas/property.schema.js';
import { UnitItemDto } from './dto/sync-units.dto.js';
import { Unit, UnitDocument } from './Unit.schema.js';

@Injectable()
export class UnitsService {
    constructor(
        @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>,
        @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    ) { }

    // All active units of one property, sorted A-101, A-102, A-201 ...
    async listForProperty(organizationId: string, propertyId: string): Promise<UnitDocument[]> {
        this.checkId(propertyId);

        const filter: Record<string, unknown> = {
            propertyId: new Types.ObjectId(propertyId),
            isDeleted: false,
        };
        if (organizationId && isValidObjectId(organizationId)) {
            filter.organizationId = new Types.ObjectId(organizationId);
        }

        return this.unitModel
            .find(filter)
            .sort({ wing: 1, floor: 1, unitNumber: 1 })
            .exec();
    }

    // Makes the database match the list sent by the form:
    //   - new numbers      -> created
    //   - existing numbers -> updated
    //   - missing numbers  -> soft deleted
    async syncForProperty(
        organizationId: string,
        propertyId: string,
        items: UnitItemDto[],
    ): Promise<UnitDocument[]> {
        this.checkId(propertyId);

        // STEP 1: no duplicate numbers inside the list (A-101 and a-101 are the same)
        const duplicates = this.findDuplicates(items);
        if (duplicates.length > 0) {
            throw new BadRequestException(`Duplicate unit number: ${duplicates.join(', ')}`);
        }

        const orgId = organizationId && isValidObjectId(organizationId) ? new Types.ObjectId(organizationId) : new Types.ObjectId();
        const propId = new Types.ObjectId(propertyId);

        // STEP 2: what is already saved?
        const existing = await this.unitModel.find({ propertyId: propId, isDeleted: false }).exec();
        const existingByNumber = new Map(existing.map((unit) => [unit.unitNumber, unit]));
        const wantedNumbers = new Set(items.map((item) => this.normalize(item.unitNumber)));

        // A unit that has a tenant can never be removed from the list
        const blocked = existing
            .filter((unit) => unit.tenantId && !wantedNumbers.has(unit.unitNumber))
            .map((unit) => unit.unitNumber);
        if (blocked.length > 0) {
            throw new BadRequestException(`Cannot remove ${blocked.join(', ')}: a tenant is living there`);
        }

        // STEP 3: build the database operations
        const operations: Parameters<Model<UnitDocument>['bulkWrite']>[0] = [];

        for (const item of items) {
            const unitNumber = this.normalize(item.unitNumber);
            const values = {
                wing: (item.wing ?? '').trim().toUpperCase(),
                floor: item.floor ?? 0,
                type: (item.type ?? '').trim(),
                rentAmount: Number(item.rentAmount) || 0,
                depositAmount: Number(item.depositAmount) || 0,
                status: item.status ?? 'vacant',
            };

            const current = existingByNumber.get(unitNumber);

            if (current) {
                // A unit with a tenant keeps its status. Only the tenant flow can change it.
                const { status, ...withoutStatus } = values;
                operations.push({
                    updateOne: {
                        filter: { _id: current._id },
                        update: { $set: current.tenantId ? withoutStatus : { ...withoutStatus, status } },
                    },
                });
            } else {
                operations.push({
                    insertOne: {
                        document: { organizationId: orgId, propertyId: propId, unitNumber, ...values, isDeleted: false },
                    },
                });
            }
        }

        for (const unit of existing) {
            if (!wantedNumbers.has(unit.unitNumber)) {
                operations.push({ updateOne: { filter: { _id: unit._id }, update: { $set: { isDeleted: true } } } });
            }
        }

        // STEP 4: run them. The unique index is the last safety net.
        if (operations.length > 0) {
            try {
                await this.unitModel.bulkWrite(operations);
            } catch (error) {
                if ((error as { code?: number }).code === 11000) {
                    throw new ConflictException('This unit number already exists in this property');
                }
                throw error;
            }
        }

        await this.refreshPropertyCounts(propId);
        return this.listForProperty(organizationId, propertyId);
    }

    // Puts a tenant into a Vacant unit. Two people can never get the same unit.
    async assign(
        organizationId: string,
        propertyId: string,
        unitNumber: string,
        tenantId: string,
    ): Promise<UnitDocument> {
        this.checkId(propertyId);
        const number = this.normalize(unitNumber);
        const filter: any = {
            propertyId: new Types.ObjectId(propertyId),
            unitNumber: number,
            isDeleted: false,
        };
        if (organizationId && isValidObjectId(organizationId)) {
            filter.organizationId = new Types.ObjectId(organizationId);
        }
        const tenant = new Types.ObjectId(tenantId);

        // One single database step: "if the unit is vacant (or already this tenant's), take it".
        const unit = await this.unitModel
            .findOneAndUpdate(
                { ...filter, $or: [{ status: 'vacant' }, { tenantId: tenant }] },
                { $set: { status: 'occupied', tenantId: tenant } },
                { new: true },
            )
            .exec();

        if (!unit) {
            const exists = await this.unitModel.exists(filter);
            if (!exists) throw new NotFoundException(`Unit ${number} not found in this property`);
            throw new ConflictException(`Unit ${number} is not vacant`);
        }

        await this.refreshPropertyCounts(new Types.ObjectId(propertyId));
        return unit as UnitDocument;
    }

    // Frees a unit when its tenant leaves. Safe to call twice.
    async release(
        organizationId: string,
        propertyId: string,
        unitNumber: string,
        tenantId: string,
    ): Promise<{ released: boolean }> {
        this.checkId(propertyId);
        const propId = new Types.ObjectId(propertyId);

        const filter: any = {
            propertyId: propId,
            unitNumber: this.normalize(unitNumber),
            tenantId: new Types.ObjectId(tenantId),
            isDeleted: false,
        };
        if (organizationId && isValidObjectId(organizationId)) {
            filter.organizationId = new Types.ObjectId(organizationId);
        }

        const result = await this.unitModel
            .updateOne(
                filter,
                { $set: { status: 'vacant' }, $unset: { tenantId: 1 } },
            )
            .exec();

        await this.refreshPropertyCounts(propId);
        return { released: result.modifiedCount > 0 };
    }

    // ---------- small helpers ----------

    // Keeps the property's "units", "occupied" and "status" in step with its units.
    private async refreshPropertyCounts(propertyId: Types.ObjectId): Promise<void> {
        const [units, occupied] = await Promise.all([
            this.unitModel.countDocuments({ propertyId, isDeleted: false }),
            this.unitModel.countDocuments({ propertyId, isDeleted: false, status: 'occupied' }),
        ]);
        const vacant = units - occupied;

        await this.propertyModel
            .updateOne(
                { _id: propertyId },
                { $set: { units, occupied, status: vacant <= 0 ? 'Fully Leased' : `${vacant} Vacant` } },
            )
            .exec();
    }

    private normalize(unitNumber: string): string {
        return unitNumber.trim().toUpperCase();
    }

    private findDuplicates(items: UnitItemDto[]): string[] {
        const seen = new Set<string>();
        const duplicates = new Set<string>();

        for (const item of items) {
            const unitNumber = this.normalize(item.unitNumber);
            if (seen.has(unitNumber)) duplicates.add(unitNumber);
            seen.add(unitNumber);
        }
        return [...duplicates];
    }

    private checkId(propertyId: string): void {
        if (!isValidObjectId(propertyId)) throw new NotFoundException('Property not found');
    }
}