import { z } from 'nestjs-zod/z';

export const PaginationParamsSchema = z.object({
    totalItems: z.number(),
    page: z.number(),
    perPage: z.number(),
});