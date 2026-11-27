import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpensesService } from './expenses.service.js';
import { ExpensesController } from './expenses.controller.js';
import { Expenses, ExpensesSchema } from './schemas/expenses.schema.js';
import { Property, PropertySchema } from '../properties/schemas/property.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expenses.name, schema: ExpensesSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule { }
