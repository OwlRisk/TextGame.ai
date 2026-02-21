import { redirect } from 'next/navigation';

/** MVP: 仅订阅，一次性充值入口重定向到订阅页 */
export default function RechargePage() {
  redirect('/subscription');
}
