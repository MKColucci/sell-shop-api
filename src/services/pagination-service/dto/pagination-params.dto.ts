import { createZodDto } from 'nestjs-zod';
import { PaginationParamsSchema } from '../schema/pagination-params.schema';

export class PaginationParams extends createZodDto(PaginationParamsSchema) { }