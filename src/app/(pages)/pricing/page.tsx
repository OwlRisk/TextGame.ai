'use client';

import { Suspense } from 'react';
import { RechargeContent } from '@/app/components/recharge-content';

function PricingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px] text-zinc-500 text-sm">
      Loading…
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
      <Suspense fallback={<PricingFallback />}>
        <RechargeContent />
      </Suspense>
    </div>
  );
}
