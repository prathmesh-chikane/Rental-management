
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

import { StaffService } from './staff.service.js';
import {
    createStaffSchema,
    CreateStaffDto,
} from './dto/create-staff.dto.js';

@Controller('staff')
export class StaffController {
    constructor(
        private readonly staffService: StaffService,
    ) { }

    // GET /trishul/staff
    // Get all staff members
    @Get()
    async getAll() {
        return this.staffService.findAll();
    }

    // GET /trishul/staff/category/:category
    // Get staff by category
    @Get('category/:category')
    async getByCategory(
        @Param('category') category: string,
    ) {
        return this.staffService.findByCategory(category);
    }

    // GET /trishul/staff/:id
    // Get single staff member
    @Get(':id')
    async getOne(
        @Param('id') id: string,
    ) {
        return this.staffService.findOne(id);
    }

    // POST /trishul/staff
    // Create new staff member
    @Post()
    async create(
        @Body() body: unknown,
    ) {
        const result = createStaffSchema.safeParse(body);

        if (!result.success) {
            throw new BadRequestException({
                message: 'Validation failed',
                errors: result.error.issues,
            });
        }

        return this.staffService.create(
            result.data as CreateStaffDto,
        );
    }

    // PATCH /trishul/staff/:id
    // Update staff details
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: unknown,
    ) {
        const result = createStaffSchema.partial().safeParse(body);

        if (!result.success) {
            throw new BadRequestException({
                message: 'Validation failed',
                errors: result.error.issues,
            });
        }

        return this.staffService.update(
            id,
            result.data as Partial<CreateStaffDto>,
        );
    }

    // PATCH /trishul/staff/:id/status
    // Update staff status
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: string,
    ) {
        if (!['Available', 'Busy', 'Inactive'].includes(status)) {
            throw new BadRequestException(
                'Invalid staff status',
            );
        }

        return this.staffService.updateStatus(id, status);
    }

    // DELETE /trishul/staff/:id
    // Delete staff member
    @Delete(':id')
    async remove(
        @Param('id') id: string,
    ) {
        return this.staffService.remove(id);
    }
}
