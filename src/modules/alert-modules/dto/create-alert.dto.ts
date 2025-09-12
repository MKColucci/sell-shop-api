import { ApiProperty } from "@nestjs/swagger";

export class CreateAlertDTO {
    @ApiProperty({
        type: String,
        name: 'message',
        required: true
    })
    message: string

    @ApiProperty({
        name: 'isGlobal',
        required: true,
        type: Boolean
    })
    isGlobal: boolean

    @ApiProperty({
        name: 'userIds',
        type: [Number],
        required: false,
    })
    userIds: number[]
}