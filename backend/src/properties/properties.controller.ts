import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PropertiesService } from './properties.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // 1. सर्व Properties मिळवणे: GET /trishul/properties
  @Get()
  async findAll() {
    return this.propertiesService.findAll();
  }

  // 2. Demo data database मध्ये seed करणे: POST /trishul/properties/seed
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seed() {
    return this.propertiesService.seedDefaults();
  }

  // 3. विशिष्ट Property शोधणे: GET /trishul/properties/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  // 4. नवीन Property तयार करणे: POST /trishul/properties
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  // 5. Property अपडेट करणे: PUT किंवा PATCH /trishul/properties/:id
  @Put(':id')
  async updatePut(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Patch(':id')
  async updatePatch(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  // 6. Property हटवणे: DELETE /trishul/properties/:id
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
