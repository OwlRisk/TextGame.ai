import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';

export const STRIPE_CONFIG = {
  PRO_PRICE_MONTHLY: 4900, // $49.00 in cents
  CURRENCY: 'usd',
} as const;
