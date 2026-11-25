
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Maintenance, MaintenanceDocument } from './schemas/maintenance.schema.js';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name)
    private maintenanceModel: Model<MaintenanceDocument>,
  ) { }

  async findAll() {
    return this.maintenanceModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { ticketNo: id };

    const ticket = await this.maintenanceModel.findOne(filter).exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async create(data: any) {
    const count = await this.maintenanceModel.countDocuments();
    const ticketNo = `TKT-${String(count + 1).padStart(4, '0')}`;

    return this.maintenanceModel.create({
      ...data,
      ticketNo,
      status: 'Open',
    });
  }

  async updateStatus(id: string, status: string) {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { ticketNo: id };

    const ticket = await this.maintenanceModel
      .findOneAndUpdate(
        filter,
        { status },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async remove(id: string) {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { ticketNo: id };

    const ticket = await this.maintenanceModel
      .findOneAndDelete(filter)
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }


  async assignStaff(
    id: string,
    staffName: string,
    staffPhone: string = '',
  ) {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { ticketNo: id };

    const ticket = await this.maintenanceModel.findOneAndUpdate(
      filter,
      {
        assignedTo: staffName,
        status: 'In Progress',
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    ).exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

}
