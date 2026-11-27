import { Injectable, NotFoundException, BadRequestException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expenses, ExpensesDocument } from './schemas/expenses.schema.js';
import { Property, PropertyDocument } from '../properties/schemas/property.schema.js'
import { CreateExpenseDto } from './dto/create-expenses.dto.js';


@Injectable()
export class ExpensesService {

    constructor(
        // MongoDB मधील Expenses collection वापरण्यासाठी Model inject केला आहे.
        @InjectModel(Expenses.name)
        private readonly expenseModel: Model<ExpensesDocument>,

        // Expense कोणत्या Property साठी आहे हे तपासण्यासाठी Property Model वापरला आहे.
        @InjectModel(Property.name)
        private readonly propertyModel: Model<PropertyDocument >,
    ) { }

    // 1. सर्व Expenses मिळवण्यासाठी हा function वापरतो.
    // populate() मुळे Property ची फक्त ID न दिसता तिचे नाव आणि location मिळते.
    // sort() मुळे नवीन Expense सर्वात आधी दिसतो.
    async findAll(): Promise<ExpensesDocument[]> {
        return this.expenseModel
            .find()
            .populate('property', 'name location')
            .sort({ createdAt: -1 })
            .exec();
    }

    // 2. एका Expense ची माहिती त्याच्या MongoDB ID वरून मिळवतो.
    // आधी ID योग्य आहे का ते तपासतो.
    // Expense सापडला नाही तर NotFoundException देतो.
    async findOne(id: string): Promise<ExpensesDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid expense ID');
        }

        const Expense = await this.expenseModel
            .findById(id)
            .populate('property', 'name location')
            .exec();

        if (!Expense) {
            throw new NotFoundException('Expense not Found')
        }
        return Expense;
    }

    // 3. नवीन Expense तयार करण्यासाठी हा function वापरतो.
    // Postman किंवा Frontend मधून आलेला DTO data घेतो.
    // Property ID योग्य आहे का आणि ती Property Database मध्ये आहे का ते तपासतो.
    // सर्व माहिती योग्य असल्यास Expense MongoDB मध्ये save करतो.
    async create(dto: CreateExpenseDto): Promise<ExpensesDocument> {
        if (!Types.ObjectId.isValid(dto.property)) {
            throw new BadRequestException('Invalid property ID');
        }

        const property = await this.propertyModel
            .findById(dto.property)
            .exec();

        if (!property) {
            throw new NotFoundException('Property not found');
        }

        const newExpense = new this.expenseModel({
            ...dto,
            property: new Types.ObjectId(dto.property),
            date: dto.date ? new Date(dto.date) : new Date(),
        });

        return newExpense.save();
    }

    // 4. आधीपासून असलेल्या Expense ची माहिती बदलण्यासाठी वापरतो.
    // उदाहरण: Pending Expense चे status Paid करणे.
    // findByIdAndUpdate() ID वरून Expense शोधून माहिती update करते.
    // new: true मुळे update झालेला नवीन data मिळतो.
    // runValidators: true मुळे Schema मधील validation पुन्हा तपासले जाते.

    async update(
        id: string,
        dto: Partial<CreateExpenseDto>,
    ): Promise<ExpensesDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Expense ID not found')
        }

        // Update मध्ये नवीन Property ID दिली असेल तर ती तपासतो.
        if (dto.property) {
            if (!Types.ObjectId.isValid(dto.property)) {
                throw new BadRequestException('Invaild Property ID')
            }
            const property = await this.propertyModel
                .findById(dto.property)
                .exec();

            if (!property) {
                throw new NotFoundException('Property not found')
            }
        }

        const updateData = {
            ...dto,
            ...(dto.date && { date: new Date(dto.date) }),
        };

        const updatedExpense = await this.expenseModel
            .findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            })
            .populate('property', 'name location')
            .exec();

        if (!updatedExpense) {
            throw new NotFoundException('Expense not found')
        }
        return updatedExpense;
    }



    // 5. DELETE EXPENSE
    async remove(
        id: string,
    ): Promise<{ message: string, id: string }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid Expense ID')
        }
        const deletedExpense = await this.expenseModel
            .findByIdAndDelete(id)
            .exec()

        if (!deletedExpense) {
            throw new NotFoundException(`Expense with ID ${id} not found`)
        }
        return {
            message: 'Expense Deleted successfully',
            id,
        }
    }

    // 6. EXPENSE SUMMARY
    async getSummary() {
        const all = await this.expenseModel.find().exec()

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let totalAmount = 0;
        let thisMonthAmount = 0;
        let pendingCount = 0;
        let pendingAmount = 0;

        const byCategory: Record<string, number> = {};

        for (const item of all) {
            totalAmount += item.amount;

            const itemDate = new Date(item.date);

            if (
                itemDate.getMonth() === currentMonth &&
                itemDate.getFullYear() === currentYear
            ) {
                thisMonthAmount += item.amount
            }
            if (item.status === 'Pending') {
                pendingCount++;
                pendingAmount += item.amount;
            }
            byCategory[item.category] =
                (byCategory[item.category] || 0) + item.amount;
        }

        return {
            totalExpenses: totalAmount,
            totalCount: all.length,
            thisMonthExpenses: thisMonthAmount,
            pendingCount,
            pendingAmount,
            byCategory,
        }
    }
}

//Injectable =	Makes this service available for dependency injection in NestJS.
// NotFoundException =	Returns HTTP 404 when data is not found.
// Logger =	Displays logs in the terminal.
// OnModuleInit =	Runs code when the NestJS module initializes.
// InjectModel =	Injects the MongoDB model into the service.
// Model = Provides Mongoose database operations.
// Expenses	= Your Expenses schema class.
// ExpensesDocument	 =  TypeScript type for expense documents.
// CreateExpenseDto = 	Defines the structure of incoming expense data.