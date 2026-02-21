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
    <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
      <Suspense fallback={<RechargeFallback />}>
        <RechargeContent />
      </Suspense>
    </div>
  );
}
