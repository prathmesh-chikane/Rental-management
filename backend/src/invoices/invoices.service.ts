
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Invoice,
  InvoiceDocument,
} from './schemas/invoice.schema.js';

import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';

@Injectable()
export class InvoicesService {
  constructor(
    // MongoDB मधील Invoice collection वापरण्यासाठी Model inject केला आहे.
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) { }

  async seedDefaults() {
    return [];
  }

  // 1. सर्व Invoices मिळवण्यासाठी हा function वापरतो.
  // नवीन Invoice सर्वात आधी दाखवण्यासाठी createdAt नुसार sorting करतो.
  // Due Date संपली आणि Invoice Unpaid असेल तर Overdue status दाखवतो.
  async findAll(): Promise<Invoice[]> {
    const invoices = await this.invoiceModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    const now = new Date();

    return invoices.map((invoice) => {
      const invoiceData = invoice.toObject();

      if (invoiceData.status === 'Unpaid') {
        const dueDate = new Date(invoiceData.dueDate);

        // Due Date आजच्या तारखेच्या आधी असेल तर Overdue करतो.
        if (
          !isNaN(dueDate.getTime()) &&
          dueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())
        ) {
          invoiceData.status = 'Overdue';
        }
      }

      return invoiceData;
    });
  }

  // 2. ID किंवा Invoice शोधण्यासाठी वापरतो.
  // MongoDB ObjectId किंवा Invoice Number वापरून Invoice मिळवतो.
  async findOne(id: string): Promise<Invoice> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { invoiceNo: id };

    const invoice = await this.invoiceModel
      .findOne(filter)
      .exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // 3. नवीन Invoice तयार करण्यासाठी वापरतो.
  // Invoice Number दिला नसेल तर आपोआप नवीन Number तयार करतो.
  // Issue Date दिली नसेल तर आजची तारीख वापरतो.
  // तयार झालेला Invoice MongoDB मध्ये save करतो.
  async create(
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<Invoice> {
    let invoiceNo = createInvoiceDto.invoiceNo;

    if (!invoiceNo) {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      const randomPart = Math.floor(10 + Math.random() * 89);

      invoiceNo = `INV-${year}-${month}${randomPart}`;
    }

    const issueDate =
      createInvoiceDto.issueDate ||
      new Date().toISOString().split('T')[0];

    const newInvoice = new this.invoiceModel({
      ...createInvoiceDto,
      invoiceNo,
      issueDate,
    });

    return newInvoice.save();
  }

  // 4. आधीपासून असलेल्या Invoice ची माहिती बदलण्यासाठी वापरतो.
  // ID किंवा Invoice Number वापरून Invoice शोधतो.
  // नवीन माहिती Database मध्ये update करतो.
  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { invoiceNo: id };

    const updatedInvoice = await this.invoiceModel
      .findOneAndUpdate(
        filter,
        updateInvoiceDto,
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!updatedInvoice) {
      throw new NotFoundException('Invoice not found');
    }

    return updatedInvoice;
  }

  // 5. Invoice चे Payment पूर्ण झाल्यावर Paid करण्यासाठी वापरतो.
  // Payment Method, Transaction ID आणि Paid Date save करतो.
  // Paid Date दिली नसेल तर आजची तारीख घेतो.
  // Payment Method दिली नसेल तर UPI वापरतो.
  async markAsPaid(
    id: string,
    payload?: {
      paymentMethod?: string;
      transactionId?: string;
      paidDate?: string;
    },
  ): Promise<Invoice> {
    const paidDate =
      payload?.paidDate ||
      new Date().toISOString().split('T')[0];

    const paymentMethod =
      payload?.paymentMethod || 'UPI';

    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { invoiceNo: id };

    const updatedInvoice = await this.invoiceModel
      .findOneAndUpdate(
        filter,
        {
          status: 'Paid',
          paidDate,
          paymentMethod,
          transactionId: payload?.transactionId || '',
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!updatedInvoice) {
      throw new NotFoundException('Invoice not found');
    }

    return updatedInvoice;
  }

  // 6. Invoice Delete करण्यासाठी वापरतो.
  // ID किंवा Invoice Number वापरून Invoice शोधून delete करतो.
  async remove(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { invoiceNo: id };

    const deletedInvoice = await this.invoiceModel
      .findOneAndDelete(filter)
      .exec();

    if (!deletedInvoice) {
      throw new NotFoundException('Invoice not found');
    }

    return {
      success: true,
      message: 'Invoice deleted successfully',
    };
  }


}
