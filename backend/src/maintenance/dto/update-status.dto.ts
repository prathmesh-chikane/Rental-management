// Ticket status बदलताना validation.
import { z } from 'zod';
export const updateStatusSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Resolved']),
});
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;