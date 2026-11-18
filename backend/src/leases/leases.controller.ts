import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeasesService } from './leases.service.js';
import { CreateLeaseDto } from './dto/create-lease.dto.js';
import { UpdateLeaseDto } from './dto/update-lease.dto.js';

// =============================================================================
// LeasesController (भाडे करारांच्या API एंडपॉईंट्स)
//
// Routes:
// 1. GET    /trishul/leases       -> सर्व करार मिळवणे
// 2. POST   /trishul/leases/seed  -> डिफॉल्ट करार सीड करणे
// 3. GET    /trishul/leases/:id   -> विशिष्ट करार पाहणे
// 4. POST   /trishul/leases       -> नवीन करार तयार करणे
// 5. PUT    /trishul/leases/:id   -> करार अपडेट करणे
// 6. DELETE /trishul/leases/:id   -> करार हटवणे
// =============================================================================

@Controller('leases')
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Get()
  async findAll() {
    return this.leasesService.findAll();
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seed() {
    return this.leasesService.seedDefaults();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leasesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLeaseDto: CreateLeaseDto) {
    return this.leasesService.create(createLeaseDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeaseDto: UpdateLeaseDto,
  ) {
    return this.leasesService.update(id, updateLeaseDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.leasesService.remove(id);
  }
}
