import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';

// =============================================================================
// InvoicesController (बिलांचे आणि पेमेंट्सचे सर्व API एंडपॉईंट्स)
//
// Routes:
// 1. GET    /trishul/invoices          -> सर्व बिले मिळवणे
// 2. POST   /trishul/invoices/seed     -> डिफॉल्ट बिले सीड करणे
// 3. GET    /trishul/invoices/:id      -> विशिष्ट बिल पाहणे
// 4. POST   /trishul/invoices          -> नवीन बिल जनरेट करणे
// 5. PUT    /trishul/invoices/:id      -> बिल अपडेट करणे
// 6. PATCH  /trishul/invoices/:id/pay  -> बिल "Paid" करणे (Record Payment)
// 7. DELETE /trishul/invoices/:id      -> बिल हटवणे
// =============================================================================

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll() {
    return this.invoicesService.findAll();
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seed() {
    return this.invoicesService.seedDefaults();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Patch(':id/pay')
  async markAsPaid(
    @Param('id') id: string,
    @Body() payload: { paymentMethod?: string; transactionId?: string; paidDate?: string },
  ) {
    return this.invoicesService.markAsPaid(id, payload);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
