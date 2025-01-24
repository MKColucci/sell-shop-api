import { z } from 'nestjs-zod/z';

export const AuthLoginResponseSchema = z.object({
  access_token: z.string(),
});

export const AuthLoginSignUpResponseSchema = z.object({
  login: AuthLoginResponseSchema,
});
