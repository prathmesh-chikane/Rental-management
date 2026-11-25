import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Injectable()
export class PropertiesService implements OnModuleInit {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) { }

  // Backend start झाल्यावर जर Database मध्ये एकही Property नसेल तर Demo Properties auto-seed करणे
  async onModuleInit() {
    try {
      const count = await this.propertyModel.countDocuments().exec();
      if (count === 0) {
        this.logger.log('Database empty! Seeding initial properties...');
        await this.seedDefaults();
      }
    } catch (err) {
      this.logger.warn(`Could not seed initial properties: ${(err as Error).message}`);
    }
  }

  // सुरुवातीचा Portfolio Data Database मध्ये सेव्ह करणे
  async seedDefaults() {
    const defaults = [
      {
        name: 'shree heights',
        location: 'nerul, navi mumbai',
        type: 'Luxury Residential',
        units: 4,
        occupied: 2,
        rent: 110000,
        monthlyRevenue: 110000,
        status: '2 Vacant',
        image: 'https://i0.wp.com/goelgangadevelopments.com/wp-content/uploads/2019/10/Image-1-1.jpg?fit=742%2C494&ssl=1',
        tags: ['Sea View', 'Smart Home', 'Private Elevator'],
      },
    ];

    const inserted = await this.propertyModel.insertMany(defaults);
    this.logger.log(`Successfully seeded ${inserted.length} properties into MongoDB!`);
    return inserted;
  }

  // 1. सर्व Properties MongoDB मधून आणा
  async findAll(): Promise<PropertyDocument[]> {
    try {
      const list = await this.propertyModel
        .find()
        .sort({ createdAt: -1 })
        .exec();

      this.logger.log(`🔍 Fetched ${list.length} properties from MongoDB.`);
      return list;
    } catch (error) {
      this.logger.error(
        '❌ Failed to fetch properties.',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  // 2. एका विशिष्ट Property चा Data ID वरून शोधणे
  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
    return property;
  }

  // 3. नवीन Property तयार करून Database मध्ये साठवणे
  async create(createPropertyDto: CreatePropertyDto): Promise<PropertyDocument> {
    const property = new this.propertyModel(createPropertyDto);
    const saved = await property.save();
    return saved;
  }

  // 4. Property अपडेट करणे
  async update(id: string, updatePropertyDto: UpdatePropertyDto): Promise<PropertyDocument> {
    const property = await this.propertyModel
      .findByIdAndUpdate(id, updatePropertyDto, { new: true, runValidators: true })
      .exec();

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  // 5. Property हटवणे
  async remove(id: string): Promise<{ message: string; id: string }> {
    const property = await this.propertyModel.findByIdAndDelete(id).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return {
      message: 'Property deleted successfully from database',
      id,
    };
  }
}
