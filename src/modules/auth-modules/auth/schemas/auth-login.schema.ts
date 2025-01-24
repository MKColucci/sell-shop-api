import { z } from 'nestjs-zod/z';

export const AuthLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const AuthLoginServiceSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullish(),
});
