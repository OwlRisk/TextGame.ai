'use client';

import { Suspense } from 'react';
import { RechargeContent } from '@/app/components/recharge-content';

function RechargeFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px] text-zinc-500 text-sm">
      Loading…
    </div>
  );
}

export default function RechargePage() {
  return (
    <Suspense fallback={<RechargeFallback />}>
      <RechargeContent />
    </Suspense>
  );
}
