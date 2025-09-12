import { Injectable } from '@nestjs/common';
import { PaginationParams } from './dto/pagination-params.dto';
import { PaginationResponse } from './dto/pagination-response.dto';

@Injectable()
export class PaginationService {
    constructor() { }

    async paginate(
        paginationParamns: PaginationParams,
    ): Promise<PaginationResponse> {
        const { totalItems, page, perPage } = paginationParamns;

        const totalPages = Math.ceil(totalItems / perPage);
        const remainingPages = totalPages - page;
        const nextPage = remainingPages > 0 ? page + 1 : null;
        const prevPage = page > 1 ? page - 1 : null;

        const response: PaginationResponse = {
            totalItems,
            totalPages,
            remainingPages,
            nextPage,
            prevPage,
        };

        return response;
    }
}