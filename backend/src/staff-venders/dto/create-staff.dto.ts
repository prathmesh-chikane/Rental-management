import { z } from 'zod';

export const createStaffSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    category: z.enum([
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Appliance',
        'Cleaning',
        'Painting',
        'Security',
        'Other',
    ]),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    email: z.string().email().optional().or(z.literal('')),
    status: z.enum(['Available', 'Busy', 'Inactive']).default('Available'),
    propertyName: z.string().optional(),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>;