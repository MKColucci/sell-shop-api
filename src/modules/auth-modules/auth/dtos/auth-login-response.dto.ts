import { createZodDto } from 'nestjs-zod';
import {
  AuthLoginResponseSchema,
  AuthLoginSignUpResponseSchema,
} from '../schemas/auth-login-response.schema';

export class AuthLoginResponseDto extends createZodDto(
  AuthLoginResponseSchema,
) {}

export class AuthLoginSignUpResponseDto extends createZodDto(
  AuthLoginSignUpResponseSchema,
) {}
