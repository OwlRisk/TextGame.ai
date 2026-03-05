import { redirect } from 'next/navigation';

/** MVP: subscription only; one-time recharge redirects to subscription page */
export default function RechargePage() {
  redirect('/subscription');
}
