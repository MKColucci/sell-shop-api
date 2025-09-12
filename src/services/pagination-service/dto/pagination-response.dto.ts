import { createZodDto } from 'nestjs-zod';
import { PaginationResponseSchema } from '../schema/pagination-response.schema';

export class PaginationResponse extends createZodDto(
    PaginationResponseSchema,
) { }