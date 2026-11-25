import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    BadRequestException,
} from '@nestjs/common';

import { MaintenanceService } from './maintenance.service.js';

import { z } from 'zod';

import {
    createMaintenanceSchema,
    CreateMaintenanceDto,
} from './dto/create-maintenance.dto.js';

import {
    updateStatusSchema,
    UpdateStatusDto,
} from './dto/update-status.dto.js';

@Controller('maintenance')
export class MaintenanceController {

    constructor(
        private readonly maintenanceService: MaintenanceService,
    ) { }

    // GET: Get all maintenance tickets
    // http://localhost:3001/trishul/maintenance
    @Get()
    async getAll() {
        return this.maintenanceService.findAll();
    }

    // GET: Get single ticket by ID or Ticket Number
    // http://localhost:3001/trishul/maintenance/:id
    @Get(':id')
    async getOne(@Param('id') id: string) {
        return this.maintenanceService.findOne(id);
    }

    // POST: Create new maintenance ticket
    // http://localhost:3001/trishul/maintenance
    @Post()
    async create(@Body() body: unknown) {

        const result = createMaintenanceSchema.safeParse(body); //createMaintenanceSchema → आपण DTO file मध्ये बनवलेले validation rules. safeParse(body) → आलेला data त्या rules नुसार तपासतो.

        if (!result.success) {
            throw new BadRequestException({
                message: 'Validation failed',
                errors: result.error.issues,
            });
        }

        return this.maintenanceService.create(
            result.data as CreateMaintenanceDto,
        );
    }

 

    // PATCH: Update maintenance ticket status
    // http://localhost:3001/trishul/maintenance/:id/status
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: unknown,
    ) {

        const result = updateStatusSchema.safeParse(body);

        if (!result.success) {
            throw new BadRequestException({
                message: 'Validation failed',
                errors: result.error.issues,
            });
        }

        return this.maintenanceService.updateStatus(
            id,
            result.data.status,
        );
    }
    // PATCH /trishul/maintenance/:id/assign
    @Patch(':id/assign')
    async assignStaff(
        @Param('id') id: string,
        @Body('staffName') staffName: string,
        @Body('staffPhone') staffPhone?: string,
    ) {
        return this.maintenanceService.assignStaff(id, staffName, staffPhone);
    }
    // DELETE: Delete maintenance ticket
    // http://localhost:3001/trishul/maintenance/:id
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.maintenanceService.remove(id);
    }
}