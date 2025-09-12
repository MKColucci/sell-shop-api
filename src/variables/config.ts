import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default registerAs('app', () => ({
  secret: process.env.SECRET,
}));
