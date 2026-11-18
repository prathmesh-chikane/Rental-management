import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';

// =============================================================================
// InvoicesService (बिलांचे आणि पेमेंट्सचे सर्व बिझनेस लॉजिक)
//
// काय करतो:
// 1. सर्व बिले डेटाबेसमध्ये साठवणे आणि आणणे.
// 2. बिलाची शेवटची तारीख (Due Date) उलटून गेली असल्यास आपोआप "Overdue" मार्क करणे.
// 3. एका क्लिकवर बिल "Paid" करणे (Record Payment).
// 4. सुरुवातीचा डेमो डेटा MongoDB मध्ये ऑटो-सीड (Seed Defaults) करणे.
// =============================================================================

@Injectable()
export class InvoicesService implements OnModuleInit {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  // सर्व्हर सुरू झाल्यावर जर DB मध्ये एकही बिल नसेल तर आपोआप डीफॉल्ट डेटा भरणे
  async onModuleInit() {
    try {
      const count = await this.invoiceModel.countDocuments().exec();
      if (count === 0) {
        this.logger.log('No invoices found in DB. Seeding initial invoices...');
        await this.seedDefaults();
      }
    } catch (err) {
      this.logger.warn(`Could not seed invoices: ${(err as Error).message}`);
    }
  }

  // सुरुवातीचा डीफॉल्ट बिलांचा डेटा
  async seedDefaults() {
    const defaults: Partial<Invoice>[] = [
      {
        invoiceNo: 'INV-2026-1101',
        tenantName: 'Vikram Joshi',
        propertyName: 'Greenfield Heights',
        unit: 'Flat 204',
        amount: 42000,
        rentAmount: 42000,
        issueDate: '2026-11-01',
        dueDate: '2026-11-05',
        paidDate: '2026-11-03',
        paymentMethod: 'UPI',
        status: 'Paid',
      },
      {
        invoiceNo: 'INV-2026-1102',
        tenantName: 'Neha Kapoor',
        propertyName: 'Royal Palms Residency',
        unit: 'Villa 02',
        amount: 85000,
        rentAmount: 85000,
        issueDate: '2026-11-01',
        dueDate: '2026-11-05',
        paidDate: '2026-11-04',
        paymentMethod: 'Bank Transfer',
        status: 'Paid',
      },
      {
        invoiceNo: 'INV-2026-1103',
        tenantName: 'Sunita Verma',
        propertyName: 'Greenfield Heights',
        unit: 'Flat 101',
        amount: 18000,
        rentAmount: 18000,
        issueDate: '2026-11-01',
        dueDate: '2026-11-05',
        status: 'Overdue',
      },
      {
        invoiceNo: 'INV-2026-1104',
        tenantName: 'Imran Sheikh',
        propertyName: 'Lakeview Towers',
        unit: 'Flat 806',
        amount: 52000,
        rentAmount: 52000,
        issueDate: '2026-11-01',
        dueDate: '2026-11-07',
        status: 'Overdue',
      },
      {
        invoiceNo: 'INV-2026-1105',
        tenantName: 'Rohan Kulkarni',
        propertyName: 'Silver Oak Enclave',
        unit: 'Studio 105',
        amount: 14000,
        rentAmount: 14000,
        issueDate: '2026-11-01',
        dueDate: '2026-11-05',
        status: 'Overdue',
      },
      {
        invoiceNo: 'INV-2026-1106',
        tenantName: 'Priya Nair',
        propertyName: 'Greenfield Heights',
        unit: 'Flat 310',
        amount: 38000,
        rentAmount: 38000,
        issueDate: '2026-11-01',
        dueDate: '2026-11-05',
        paidDate: '2026-11-02',
        paymentMethod: 'UPI',
        status: 'Paid',
      },
    ];

    return this.invoiceModel.insertMany(defaults);
  }

  // 1. सर्व बिले आणणे आणि ड्यू डेट संपली असल्यास आपोआप "Overdue" दाखवणे
  async findAll(): Promise<Invoice[]> {
    const invoices = await this.invoiceModel.find().sort({ createdAt: -1 }).exec();

    const now = new Date();

    return invoices.map((inv) => {
      const invObj = inv.toObject ? inv.toObject() : inv;
      if (invObj.status === 'Unpaid') {
        const due = new Date(invObj.dueDate);
        if (!isNaN(due.getTime()) && due < now) {
          invObj.status = 'Overdue';
        }
      }
      return invObj;
    });
  }

  // 2. एक विशिष्ट बिल शोधणे
  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceModel.findById(id).exec();
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  // 3. नवीन बिल तयार करणे
  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    let invoiceNo = createInvoiceDto.invoiceNo;
    if (!invoiceNo) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const randomPart = Math.floor(10 + Math.random() * 89);
      invoiceNo = `INV-${year}-${month}${randomPart}`;
    }

    const issueDate = createInvoiceDto.issueDate || new Date().toISOString().split('T')[0];

    const created = new this.invoiceModel({
      ...createInvoiceDto,
      invoiceNo,
      issueDate,
    });

    return created.save();
  }

  // 4. बिल अपडेट करणे (Update Invoice in MongoDB)
  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { invoiceNo: id };
    const updated = await this.invoiceModel
      .findOneAndUpdate(filter, updateInvoiceDto, { returnDocument: 'after' })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return updated;
  }

  // 5. एका क्लिकवर बिल "Paid" करणे (Record Payment)
  async markAsPaid(
    id: string,
    payload?: { paymentMethod?: string; transactionId?: string; paidDate?: string },
  ): Promise<Invoice> {
    const paidDate = payload?.paidDate || new Date().toISOString().split('T')[0];
    const paymentMethod = payload?.paymentMethod || 'UPI';

    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { invoiceNo: id };
    const updated = await this.invoiceModel
      .findOneAndUpdate(
        filter,
        {
          status: 'Paid',
          paidDate,
          paymentMethod,
          transactionId: payload?.transactionId || '',
        },
        { returnDocument: 'after' },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return updated;
  }

  // 6. बिल हटवणे (Delete Invoice in MongoDB)
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { invoiceNo: id };
    const deleted = await this.invoiceModel.findOneAndDelete(filter).exec();
    if (!deleted) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return { success: true, message: 'Invoice deleted successfully' };
  }
}
