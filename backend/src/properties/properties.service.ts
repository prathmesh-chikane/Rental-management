import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class PropertiesService implements OnModuleInit {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    // MongoDB मधील Property Model inject करणे
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    // Redis Cache Service inject करणे
    private readonly redisService: RedisService,
  ) {}

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
        name: 'Greenfield Heights',
        location: 'Koregaon Park, Pune',
        type: 'Luxury Residential',
        units: 8,
        occupied: 8,
        rent: 52000,
        monthlyRevenue: 52000,
        status: '100% Leased',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
        tags: ['Swimming Pool', 'Clubhouse', '24/7 Power'],
      },
      {
        name: 'Royal Palms Residency',
        location: 'Banjara Hills, Hyderabad',
        type: 'Gated Community Villas',
        units: 6,
        occupied: 5,
        rent: 45000,
        monthlyRevenue: 45000,
        status: '1 Villa Vacant',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
        tags: ['Private Lawn', 'EV Charging', 'Gym'],
      },
      {
        name: 'Skyline Tech Park',
        location: 'Whitefield, Bengaluru',
        type: 'Retail & Grade-A Offices',
        units: 10,
        occupied: 9,
        rent: 85000,
        monthlyRevenue: 85000,
        status: '90% Occupied',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
        tags: ['Fiber Internet', 'Valet Parking', 'Cafeteria'],
      },
      {
        name: 'Sea Breeze Enclave',
        location: 'Worli Sea Face, Mumbai',
        type: 'Luxury Residential',
        units: 4,
        occupied: 4,
        rent: 110000,
        monthlyRevenue: 110000,
        status: 'Fully Booked',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
        tags: ['Sea View', 'Smart Home', 'Private Elevator'],
      },
    ];

    const inserted = await this.propertyModel.insertMany(defaults);
    this.logger.log(`Successfully seeded ${inserted.length} properties into MongoDB!`);
    return inserted;
  }

  // 1. सर्व Properties आणणे (आधी Redis Cache तपासणे, नसेल तर DB मधून आणून Redis मध्ये सेव्ह करणे)
  async findAll(): Promise<PropertyDocument[]> {
    const cacheKey = 'properties:all';

    // १. Redis तपासा
    const cached = await this.redisService.get<PropertyDocument[]>(cacheKey);
    if (cached) {
      this.logger.log('⚡ [Redis HIT] Properties थेट Redis कॅशमधून लोड झाल्या!');
      return cached;
    }

    // २. जर Redis मध्ये नसेल तर DB मधून आणा
    const list = await this.propertyModel.find().sort({ createdAt: -1 }).exec();

    // ३. पुढील 5 मिनिटांसाठी (300 सेकंद) Redis मध्ये साठवा
    await this.redisService.set(cacheKey, list, 300);
    this.logger.log('💾 [Redis MISS] Properties MongoDB मधून आणल्या आणि Redis मध्ये सेव्ह केल्या.');

    return list;
  }

  // 2. एका विशिष्ट Property चा Data ID वरून शोधणे
  async findOne(id: string): Promise<PropertyDocument> {
    const cacheKey = `properties:${id}`;
    const cached = await this.redisService.get<PropertyDocument>(cacheKey);
    if (cached) {
      return cached;
    }

    const property = await this.propertyModel.findById(id).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    await this.redisService.set(cacheKey, property, 300);
    return property;
  }

  // 3. नवीन Property तयार करून Database मध्ये साठवणे आणि Redis कॅश उडवणे (Invalidate)
  async create(createPropertyDto: CreatePropertyDto): Promise<PropertyDocument> {
    const property = new this.propertyModel(createPropertyDto);
    const saved = await property.save();

    // जुनी कॅश उडवा जेणेकरून नवीन प्रॉपर्टी लिस्टमध्ये दिसेल
    await this.redisService.del('properties:all');

    return saved;
  }

  // 4. Property अपडेट करणे आणि संबंधित Redis कॅश रिफ्रेश करणे
  async update(id: string, updatePropertyDto: UpdatePropertyDto): Promise<PropertyDocument> {
    const property = await this.propertyModel
      .findByIdAndUpdate(id, updatePropertyDto, { new: true, runValidators: true })
      .exec();

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // कॅश इनव्हॅलिडेट करा
    await this.redisService.del('properties:all');
    await this.redisService.del(`properties:${id}`);

    return property;
  }

  // 5. Property हटवणे आणि Redis कॅश क्लिअर करणे
  async remove(id: string): Promise<{ message: string; id: string }> {
    const property = await this.propertyModel.findByIdAndDelete(id).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // कॅश उडवा
    await this.redisService.del('properties:all');
    await this.redisService.del(`properties:${id}`);

    return {
      message: 'Property deleted successfully from database',
      id,
    };
  }
}
