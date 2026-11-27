
import { z } from 'zod';
import { EXPENSES_CATEGORIES, PAYMENT_METHODS } from '../schemas/expenses.schema.js';


export const createExpenseSchema = z.object({   //z.object() creates a validation schema

    // Expense title
    title: z
        .string({
            error: 'Expense title is required',
        })
        .min(2, 'Title must contain at least 2 characters'),

    //Expenses category
    category: z.enum(EXPENSES_CATEGORIES, {
        error: 'Please select a Valid category',
    }),

    //Expenses Amount
    amount: z.coerce.number().positive('amount must be greater then 0'),   //z.coerce.number() converts the input into a number.

    // Property ID validate करतो.
    property: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        'Please select a valid property',
    ),

    //Expenses Date
    date: z.string().or(z.date()).optional(),

    //payment method
    paymentMethod: z.enum(PAYMENT_METHODS).default('UPI'),

    //payment status
    status: z.enum(['Paid', 'Pending']).default('Pending'),

    //Recipient name
    paidTo: z.string().optional(),

    //Additional notes
    notes: z.string().optional(),
})

//Ganerate Typescript type
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;