
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Staff, StaffDocument } from './schemas/staff.schema.js';
import type { CreateStaffDto } from './dto/create-staff.dto.js';

@Injectable()
export class StaffService {
    constructor(
        @InjectModel(Staff.name)
        private readonly staffModel: Model<StaffDocument>,
    ) { }

    // १. सर्व स्टाफ / व्हेंडर्स मिळवणे
    async findAll() {
        return this.staffModel
            .find()
            .sort({ createdAt: -1 })
            .exec();
    }

    // २. विशिष्ट स्टाफ शोधणे
    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid Staff ID');
        }

        const staff = await this.staffModel.findById(id).exec();

        if (!staff) {
            throw new NotFoundException('Staff member not found');
        }

        return staff;
    }

    // ३. विशिष्ट Category चे Available स्टाफ शोधणे
    async findByCategory(category: string) {
        return this.staffModel
            .find({
                category,
                status: 'Available',
            })
            .exec();
    }

    // ४. नवीन स्टाफ सेव्ह करणे
    async create(data: CreateStaffDto) {
        return this.staffModel.create(data);
    }

    // ५. स्टेटस बदलणे
    async updateStatus(id: string, status: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid Staff ID');
        }

        const updated = await this.staffModel
            .findByIdAndUpdate(
                id,
                { status },
                {
                    returnDocument: 'after',
                    runValidators: true,
                },
            )
            .exec();

        if (!updated) {
            throw new NotFoundException('Staff not found');
        }

        return updated;
    }

    // ६. स्टाफ डिलीट करणे
    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid Staff ID');
        }

        const deleted = await this.staffModel
            .findByIdAndDelete(id)
            .exec();

        if (!deleted) {
            throw new NotFoundException('Staff not found');
        }

        return {
            success: true,
            message: 'Staff deleted successfully',
        };
    }

    // ७. स्टाफची माहिती एडिट / अपडेट करणे
    async update(id: string, data: Partial<CreateStaffDto>) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid Staff ID');
        }

        const updated = await this.staffModel
            .findByIdAndUpdate(
                id,
                { $set: data },
                {
                    returnDocument: 'after',
                    runValidators: true,
                },
            )
            .exec();

        if (!updated) {
            throw new NotFoundException('Staff member not found');
        }

        return updated;
    }
}
