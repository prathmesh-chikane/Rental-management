import { Controller, Get, Post, Patch, Delete, Param, Body, BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service.js';
import { createExpenseSchema, CreateExpenseDto } from './dto/create-expenses.dto.js';

@Controller('expenses')
export class ExpensesController {
    constructor
        (private readonly expensesService: ExpensesService) { }

    // GET  /trishul/expenses
    @Get()
    async getAll() {
        return this.expensesService.findAll();
    }

    // GET /trishul/expenses/summary
    @Get('summary')
    async getSummary() {
        return this.expensesService.getSummary();
    }

    // GET /trishul/expenses/:id
    @Get(':id')
    async getOne(@Param('id') id: string) {
        return this.expensesService.findOne(id);
    }

    // POST /trishul/expenses
    @Post()
    async create(@Body() body: unknown) {
        const result = createExpenseSchema.safeParse(body);
        if (!result.success) {
            throw new BadRequestException({
                message: 'Validation Failed',
                errors: result.error.issues,
            })
        }
        return this.expensesService.create(result.data as CreateExpenseDto)
    }

    @Patch(':id')
    async update(@Param('id') id: string,
        @Body() body: Partial<CreateExpenseDto>,
    ) {
        return this.expensesService.update(id, body);
    }

    // DELETE /trishul/expenses/:id
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.expensesService.remove(id);
    }

}   
