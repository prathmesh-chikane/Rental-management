import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { Property, PropertyDocument } from '../properties/schemas/property.schema.js';

@Injectable()
export class TenantsService implements OnModuleInit {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.tenantModel.countDocuments().exec();
      if (count === 0) {
        this.logger.log('No tenants found in DB. Seeding initial tenants...');
        await this.seedDefaults();
      }
    } catch (err) {
      this.logger.warn(`Could not seed tenants: ${(err as Error).message}`);
    }
  }

  async seedDefaults() {
    const defaults = [
      {
        name: 'Vikram Joshi',
        email: 'vikram.joshi@example.com',
        phone: '+91 98201 12345',
        emergencyContact: '+91 98201 54321',
        propertyName: 'Greenfield Heights',
        unit: 'Flat 204',
        wing: 'Wing A',
        monthlyRent: 42000,
        securityDeposit: 126000,
        moveInDate: '2025-11-01',
        leaseEndDate: '2027-10-31',
        aadhaarNumber: '1234 5678 4589',
        policeVerification: 'Verified',
        status: 'active',
        notes: 'Senior Software Engineer. Pays on time.',
      },
      {
        name: 'Neha Kapoor',
        email: 'neha.kapoor@example.com',
        phone: '+91 98111 22334',
        emergencyContact: '+91 98111 44332',
        propertyName: 'Royal Palms Residency',
        unit: 'Villa 02',
        wing: 'Phase 1',
        monthlyRent: 85000,
        securityDeposit: 255000,
        moveInDate: '2026-01-15',
        leaseEndDate: '2028-01-14',
        aadhaarNumber: '9876 5432 9821',
        policeVerification: 'Verified',
        status: 'active',
        notes: 'Corporate Director.',
      },
      {
        name: 'Arjun Mehta',
        email: 'arjun.mehta@example.com',
        phone: '+91 98333 44556',
        emergencyContact: '+91 98333 66554',
        propertyName: 'Silver Oak Enclave',
        unit: 'Studio 105',
        wing: 'Block B',
        monthlyRent: 18500,
        securityDeposit: 55500,
        moveInDate: '2025-06-01',
        leaseEndDate: '2026-05-31',
        aadhaarNumber: '4567 8901 3341',
        policeVerification: 'In Progress',
        status: 'active',
        notes: 'Freelance Architect.',
      },
      {
        name: 'Sunita Verma',
        email: 'sunita.v@example.com',
        phone: '+91 98444 55667',
        emergencyContact: '+91 98444 77665',
        propertyName: 'Greenfield Heights',
        unit: 'Flat 101',
        wing: 'Wing B',
        monthlyRent: 18000,
        securityDeposit: 54000,
        moveInDate: '2024-12-01',
        leaseEndDate: '2026-11-30',
        aadhaarNumber: '7890 1234 1122',
        policeVerification: 'Verified',
        status: 'active',
        notes: 'Rent due follow-up required.',
      },
    ];

    return this.tenantModel.insertMany(defaults);
  }

  // 1. सर्व भाडेकरू आणणे
  async findAll(): Promise<Tenant[]> {
    return this.tenantModel.find().sort({ createdAt: -1 }).exec();
  }

  // 2. एक भाडेकरू शोधणे
  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  // 3. CREATE: नवीन भाडेकरू जोडणे आणि Property चे occupied count (+1) वाढवणे
  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const created = new this.tenantModel(createTenantDto);
    const savedTenant = await created.save();

    // संबंधित Property चे occupied count +1 करणे
    if (createTenantDto.propertyName) {
      await this.incrementPropertyOccupied(createTenantDto.propertyName, 1);
    }

    return savedTenant;
  }

  // 4. UPDATE: जर भाडेकरूची इमारत बदलली तर जुन्याचे (-1) आणि नवीनचे (+1) करणे
  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const oldTenant = await this.tenantModel.findById(id).exec();
    if (!oldTenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    const updated = await this.tenantModel
      .findByIdAndUpdate(id, updateTenantDto, { new: true })
      .exec();

    // जर Property बदलली असेल तर जुन्यात -1 आणि नवीनमध्ये +1
    if (
      updateTenantDto.propertyName &&
      updateTenantDto.propertyName !== oldTenant.propertyName
    ) {
      await this.incrementPropertyOccupied(oldTenant.propertyName, -1);
      await this.incrementPropertyOccupied(updateTenantDto.propertyName, 1);
    }

    // जर status active वरून inactive झाले तर occupied count -1 करणे
    if (oldTenant.status === 'active' && updateTenantDto.status === 'inactive') {
      await this.incrementPropertyOccupied(updated!.propertyName, -1);
    } else if (oldTenant.status === 'inactive' && updateTenantDto.status === 'active') {
      await this.incrementPropertyOccupied(updated!.propertyName, 1);
    }

    return updated!;
  }

  // 5. DELETE: भाडेकरू काढून टाकल्यावर Property चे occupied count (-1) कमी करणे
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    await this.tenantModel.findByIdAndDelete(id).exec();

    // जर तो active भाडेकरू होता, तर occupied count -1 करणे
    if (tenant.status === 'active' && tenant.propertyName) {
      await this.incrementPropertyOccupied(tenant.propertyName, -1);
    }

    return { success: true, message: 'Tenant deleted successfully' };
  }

  // Helper method: Property चा Occupancy count वाढवणे / कमी करणे
  private async incrementPropertyOccupied(propertyName: string, delta: number) {
    try {
      const property = await this.propertyModel.findOne({ name: propertyName }).exec();
      if (property) {
        const newOccupied = Math.max(0, Math.min(property.units, (property.occupied || 0) + delta));
        const vacant = property.units - newOccupied;
        const newStatus = vacant <= 0 ? 'Fully Leased' : `${vacant} Vacant`;

        await this.propertyModel
          .findByIdAndUpdate(property._id, {
            occupied: newOccupied,
            status: newStatus,
          })
          .exec();

        this.logger.log(
          `Updated property "${propertyName}" occupied units: ${property.occupied} -> ${newOccupied}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Could not update property units: ${(err as Error).message}`);
    }
  }
}
