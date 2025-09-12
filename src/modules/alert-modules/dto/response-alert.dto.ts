import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponse } from "src/services/pagination-service/dto/pagination-response.dto";

export class ResponseAlertDTO {
    @ApiProperty({
        name: 'id',
        type: Number,
    })
    id: number

    @ApiProperty({
        name: 'message',
        type: String,
    })
    message: string


    @ApiProperty({
        name: 'createdAt',
        type: Date,
    })
    createdAt: Date

    @ApiProperty({
        name: 'sendBy',
        type: String,
    })
    sendBy: string

    @ApiProperty({
        name: 'viewed',
        type: Boolean,
    })
    viewed: boolean
}

export class ResponseAlerts {
    @ApiProperty({
        type: () => [ResponseAlertDTO]
    })
    data: ResponseAlertDTO[]

    @ApiProperty({
        type: PaginationResponse,
        nullable: true
    })
    pageInfo: PaginationResponse
}