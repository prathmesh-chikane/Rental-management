import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { CurrentOrganizationId } from '../tenants/current-organization-id.decorator.js';
import { AssignUnitDto } from './dto/assign-unit.dto.js';
import { SyncUnitsDto } from './dto/sync-units.dto.js';
import { UnitsService } from './units.service.js';

@Controller('properties/:propertyId/units')
export class UnitsController {
    constructor(private readonly unitsService: UnitsService) { }

    // GET /trishul/properties/:propertyId/units
    @Get()
    list(@CurrentOrganizationId() organizationId: string, @Param('propertyId') propertyId: string) {
        return this.unitsService.listForProperty(organizationId, propertyId);
    }

    // PUT /trishul/properties/:propertyId/units
    // Body: { units: [{ unitNumber, floor, type, rentAmount, depositAmount, status: 'vacant' }] }
    @Put()
    sync(
        @CurrentOrganizationId() organizationId: string,
        @Param('propertyId') propertyId: string,
        @Body() dto: SyncUnitsDto,
    ) {
        return this.unitsService.syncForProperty(organizationId, propertyId, dto.units);
    }

    // POST /trishul/properties/:propertyId/units/A-101/assign   body: { tenantId }
    // Puts the tenant in this unit (409 if the unit is not vacant)
    @Post(':unitNumber/assign')
    @HttpCode(200)
    assign(
        @CurrentOrganizationId() organizationId: string,
        @Param('propertyId') propertyId: string,
        @Param('unitNumber') unitNumber: string,
        @Body() dto: AssignUnitDto,
    ) {
        return this.unitsService.assign(organizationId, propertyId, unitNumber, dto.tenantId);
    }

    // POST /trishul/properties/:propertyId/units/A-101/release   body: { tenantId }
    // Frees the unit again (tenant left or was deleted)
    @Post(':unitNumber/release')
    @HttpCode(200)
    release(
        @CurrentOrganizationId() organizationId: string,
        @Param('propertyId') propertyId: string,
        @Param('unitNumber') unitNumber: string,
        @Body() dto: AssignUnitDto,
    ) {
        return this.unitsService.release(organizationId, propertyId, unitNumber, dto.tenantId);
    }
}