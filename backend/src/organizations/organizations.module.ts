import { Module } from '@nestjs/common';
// NestJS मधील Module decorator import करतो

// MongoDB सोबत NestJS connect करण्यासाठी MongooseModule import करतो
import { MongooseModule } from '@nestjs/mongoose';

// Organization Schema आणि Model import करतो
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema.js';

// Organization चे API requests handle करणारा Controller
import { OrganizationsController } from './organizations.controller.js';

// Organization संबंधित Business Logic handle करणारी Service
import { OrganizationsService } from './organizations.service.js';

@Module({
  // या Module मध्ये लागणारे दुसरे Modules किंवा Features
  imports: [
    // Organization साठी MongoDB Model register करतो
    MongooseModule.forFeature([
      {
        // MongoDB Model चे नाव Organization असेल
        name: Organization.name,

        // MongoDB मध्ये Organization ची रचना कशी असेल ते Schema ठरवते
        schema: OrganizationSchema,
      },
    ]),
  ],

  // API requests Controller कडे पाठवल्या जातील
  controllers: [OrganizationsController],

  // Business Logic साठी Service उपलब्ध करून देतो
  providers: [OrganizationsService],

  // दुसऱ्या Module ला Organization Model वापरता यावा म्हणून export करतो
  exports: [MongooseModule],
})

// हा Organization Module तयार करतो
export class OrganizationsModule { }
