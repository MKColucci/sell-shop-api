import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default registerAs('app', () => ({
  secret: process.env.SECRET,

  awsRegion: process.env.AWS_REGION,
  awsAccessKey: process.env.AWS_ACCESS_KEY,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsBucketName: process.env.AWS_BUCKET_NAME,

  mailGunApiKey: process.env.MAILGUN_API_KEYS,
  mailGunDomain: process.env.MAILGUN_DOMAIN,
  mailGunFrom: process.env.MAILGUN_FROM,

  stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeFirstSubscriptionItem: process.env.STRIPE_FIRST_SUBSCRIPTION_ITEM,

  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL,
}));
