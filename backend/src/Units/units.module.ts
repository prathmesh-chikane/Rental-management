import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { Property, PropertySchema } from '../properties/schemas/property.schema.js';
import { Unit, UnitSchema } from './Unit.schema.js';
import { UnitsController } from './units.controller.js';
import { UnitsService } from './units.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Unit.name, schema: UnitSchema },
      // needed to keep the property's "occupied" count correct
      { name: Property.name, schema: PropertySchema },
    ]),
  ],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}