
import {
    Controller,
    Get,
    Param,
} from '@nestjs/common';

// Organization Service import करतो
import { OrganizationsService } from './organizations.service.js';

// या Controller चे सर्व API routes /organizations पासून सुरू होतील
@Controller('organizations')
export class OrganizationsController {
    // OrganizationsService Inject करतो
    constructor(
        private readonly organizationsService: OrganizationsService,
    ) { }

    // GET /trishul/organizations
    // सर्व Organizations मिळवण्यासाठी API
    @Get()
    async findAll() {
        return await this.organizationsService.findAll();
    }

    // GET /trishul/organizations/:id
    // ID वापरून एक Organization मिळवण्यासाठी API
    @Get(':id')
    async findOne(
        // URL मधून Organization ची ID मिळवतो
        @Param('id') id: string,
    ) {
        return await this.organizationsService.findOne(id);
    }
}
