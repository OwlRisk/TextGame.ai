import { redirect } from 'next/navigation';

/** MVP: 仅订阅，定价/充值入口重定向到订阅页 */
export default function PricingPage() {
  redirect('/subscription');
}
