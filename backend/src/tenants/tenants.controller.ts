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
import { TenantsService } from './tenants.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // 1. GET ALL TENANTS: GET /trishul/tenants
  @Get()
  async findAll() {
    return this.tenantsService.findAll();
  }

  // 2. SEED DEFAULT TENANTS: POST /trishul/tenants/seed
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seed() {
    return this.tenantsService.seedDefaults();
  }

  // 3. GET ONE TENANT: GET /trishul/tenants/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  // 4. CREATE NEW TENANT: POST /trishul/tenants
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  // 5. UPDATE TENANT: PUT /trishul/tenants/:id
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  // 6. DELETE TENANT: DELETE /trishul/tenants/:id
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
