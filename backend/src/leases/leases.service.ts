
import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lease, LeaseDocument } from './schemas/lease.schema.js';
import { CreateLeaseDto } from './dto/create-lease.dto.js';
import { UpdateLeaseDto } from './dto/update-lease.dto.js';

@Injectable()
export class LeasesService implements OnModuleInit {
  private readonly logger = new Logger(LeasesService.name);

  constructor(
    @InjectModel(Lease.name)
    private readonly leaseModel: Model<LeaseDocument>,
  ) { }

  async onModuleInit() {
    try {
      const count = await this.leaseModel.countDocuments().exec();

      if (count === 0) {
        this.logger.log('No leases found in DB. Seeding initial leases...');
        await this.seedDefaults();
      }
    } catch (err) {
      this.logger.warn(
        `Could not seed leases: ${(err as Error).message}`,
      );
    }
  }

  async seedDefaults() {
    const defaults: Partial<Lease>[] = [
      {
        leaseNumber: 'LSE-2026-081',
        tenantName: 'Vikram Joshi',
        propertyName: 'Greenfield Heights',
        unit: 'Flat 204',
        startDate: '2025-11-01',
        endDate: '2027-10-31',
        monthlyRent: 42000,
        deposit: 126000,
        rentDueDay: 5,
        status: 'Active',
      },
    ];

    return this.leaseModel.insertMany(defaults);
  }

  // 1. Get all leases and calculate status
  async findAll(): Promise<Lease[]> {
    const leases = await this.leaseModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    const now = new Date();
    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(now.getDate() + 60);

    return leases.map((lease) => {
      const leaseObj = lease.toObject();

      const end = new Date(leaseObj.endDate);

      if (!isNaN(end.getTime())) {
        if (end < now) {
          leaseObj.status = 'Expired';
        } else if (end <= sixtyDaysLater) {
          leaseObj.status = 'Expiring Soon';
        } else {
          leaseObj.status = 'Active';
        }
      }

      return leaseObj;
    });
  }

  // 2. Get single lease
  async findOne(id: string): Promise<Lease> {
    const lease = await this.leaseModel.findById(id).exec();

    if (!lease) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return lease;
  }

  // 3. Create lease
  async create(createLeaseDto: CreateLeaseDto): Promise<Lease> {
    let leaseNumber = createLeaseDto.leaseNumber;

    if (!leaseNumber) {
      const year = new Date().getFullYear();
      const randomPart = Math.floor(100 + Math.random() * 900);
      leaseNumber = `LSE-${year}-${randomPart}`;
    }

    const created = new this.leaseModel({
      ...createLeaseDto,
      leaseNumber,
    });

    return created.save();
  }

  // 4. Update lease
  async update(
    id: string,
    updateLeaseDto: UpdateLeaseDto,
  ): Promise<Lease> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { leaseNumber: id };

    const updated = await this.leaseModel
      .findOneAndUpdate(filter, updateLeaseDto, {
        returnDocument: 'after',
      })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return updated;
  }

  // 5. Delete lease
  async remove(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { leaseNumber: id };

    const deleted = await this.leaseModel
      .findOneAndDelete(filter)
      .exec();

    if (!deleted) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Lease deleted successfully',
    };
  }
}
