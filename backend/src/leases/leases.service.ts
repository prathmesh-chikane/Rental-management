import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lease, LeaseDocument } from './schemas/lease.schema.js';
import { CreateLeaseDto } from './dto/create-lease.dto.js';
import { UpdateLeaseDto } from './dto/update-lease.dto.js';

// =============================================================================
// LeasesService (भाडे करारांचे सर्व बिझनेस लॉजिक)
//
// काय करतो:
// 1. सर्व करार डेटाबेसमध्ये साठवणे आणि आणणे.
// 2. करार संपण्याची तारीख (End Date) ६० दिवसांपेक्षा जवळ असल्यास आपोआप "Expiring Soon" मार्क करणे.
// 3. नवीन करार जोडताना युनिक Lease Number (उदा. LSE-2026-101) ऑटो-जनरेट करणे.
// 4. सुरुवातीचा डेमो डेटा MongoDB मध्ये ऑटो-सीड (Seed Defaults) करणे.
// =============================================================================

@Injectable()
export class LeasesService implements OnModuleInit {
  private readonly logger = new Logger(LeasesService.name);

  constructor(
    @InjectModel(Lease.name)
    private readonly leaseModel: Model<LeaseDocument>,
  ) {}

  // सर्व्हर सुरू झाल्यावर जर DB मध्ये एकही करार नसेल तर आपोआप डीफॉल्ट डेटा भरणे
  async onModuleInit() {
    try {
      const count = await this.leaseModel.countDocuments().exec();
      if (count === 0) {
        this.logger.log('No leases found in DB. Seeding initial leases...');
        await this.seedDefaults();
      }
    } catch (err) {
      this.logger.warn(`Could not seed leases: ${(err as Error).message}`);
    }
  }

  // डीफॉल्ट करारांचा डेटा
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
      {
        leaseNumber: 'LSE-2026-082',
        tenantName: 'Neha Kapoor',
        propertyName: 'Royal Palms Residency',
        unit: 'Villa 02',
        startDate: '2026-01-15',
        endDate: '2028-01-14',
        monthlyRent: 85000,
        deposit: 255000,
        rentDueDay: 5,
        status: 'Active',
      },
      {
        leaseNumber: 'LSE-2026-083',
        tenantName: 'Arjun Mehta',
        propertyName: 'Silver Oak Enclave',
        unit: 'Studio 105',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        monthlyRent: 18500,
        deposit: 55500,
        rentDueDay: 1,
        status: 'Expiring Soon',
      },
      {
        leaseNumber: 'LSE-2026-084',
        tenantName: 'Sunita Verma',
        propertyName: 'Greenfield Heights',
        unit: 'Flat 101',
        startDate: '2024-12-01',
        endDate: '2026-11-30',
        monthlyRent: 18000,
        deposit: 54000,
        rentDueDay: 5,
        status: 'Active',
      },
      {
        leaseNumber: 'LSE-2025-045',
        tenantName: 'Rahul Sharma',
        propertyName: 'Sea Breeze Enclave',
        unit: 'Flat 402',
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        monthlyRent: 35000,
        deposit: 105000,
        rentDueDay: 10,
        status: 'Terminated',
      },
    ];

    return this.leaseModel.insertMany(defaults);
  }

  // 1. सर्व करार आणणे आणि तारखेनुसार Expiring Soon अपडेट करणे
  async findAll(): Promise<Lease[]> {
    const leases = await this.leaseModel.find().sort({ createdAt: -1 }).exec();

    const now = new Date();
    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(now.getDate() + 60);

    // प्रत्येक कराराची मुदत तपासून स्टेटस ठरवणे
    return leases.map((lease) => {
      const leaseObj = lease.toObject ? lease.toObject() : lease;
      if (leaseObj.status !== 'Terminated') {
        const end = new Date(leaseObj.endDate);
        if (!isNaN(end.getTime())) {
          if (end < now) {
            leaseObj.status = 'Terminated';
          } else if (end <= sixtyDaysLater) {
            leaseObj.status = 'Expiring Soon';
          }
        }
      }
      return leaseObj;
    });
  }

  // 2. एक विशिष्ट करार शोधणे
  async findOne(id: string): Promise<Lease> {
    const lease = await this.leaseModel.findById(id).exec();
    if (!lease) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }
    return lease;
  }

  // 3. नवीन करार तयार करणे
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

  // 4. करार अपडेट करणे (Update Lease in MongoDB)
  async update(id: string, updateLeaseDto: UpdateLeaseDto): Promise<Lease> {
    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { leaseNumber: id };
    const updated = await this.leaseModel
      .findOneAndUpdate(filter, updateLeaseDto, { returnDocument: 'after' })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return updated;
  }

  // 5. करार हटवणे (Delete Lease in MongoDB)
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { leaseNumber: id };
    const deleted = await this.leaseModel.findOneAndDelete(filter).exec();
    if (!deleted) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return { success: true, message: 'Lease deleted successfully' };
  }
}
