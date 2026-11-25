// नवीन ticket तयार करताना validation.
    import { z } from 'zod';
export const createMaintenanceSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    propertyName: z.string().min(1, 'Property name is required'),
    unit: z.string().min(1, 'Unit is required'),
    category: z.string().min(1, 'Category is required'),

    priority: z.enum(['Urgent', 'High', 'Medium', 'Low']).default('Medium'),

    reportedBy: z.string().optional(),
});

export type CreateMaintenanceDto = z.infer<typeof createMaintenanceSchema>;