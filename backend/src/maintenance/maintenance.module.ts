import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MaintenanceController } from './maintenance.controller.js';
import { MaintenanceService } from './maintenance.service.js';

import {
  Maintenance, MaintenanceSchema,
} from './schemas/maintenance.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Maintenance.name,
        schema: MaintenanceSchema,
      },
    ]),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule { }
