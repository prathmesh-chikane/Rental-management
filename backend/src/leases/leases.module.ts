import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeasesController } from './leases.controller.js';
import { LeasesService } from './leases.service.js';
import { Lease, LeaseSchema } from './schemas/lease.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lease.name, schema: LeaseSchema }]),
  ],
  controllers: [LeasesController],
  providers: [LeasesService],
  exports: [LeasesService],
})
export class LeasesModule {}
