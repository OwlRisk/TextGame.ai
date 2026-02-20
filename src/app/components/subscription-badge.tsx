'use client';

import { Zap, Star } from 'lucide-react';
import type { SubscriptionTier } from '@/lib/subscription';

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<
  SubscriptionTier,
  { label: string; icon: typeof Zap; bgColor: string; textColor: string; borderColor: string; iconColor: string }
> = {
  free: {
    label: 'FREE',
    icon: Zap,
    bgColor: 'bg-zinc-500/20',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-500/30',
    iconColor: 'text-zinc-400',
  },
  pro: {
    label: 'PRO',
    icon: Star,
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
};

const sizeConfig = {
  sm: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', icon: 'size-2.5', gap: 'gap-0.5' },
  md: { padding: 'px-2 py-1', text: 'text-xs', icon: 'size-3', gap: 'gap-1' },
  lg: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 'size-4', gap: 'gap-1.5' },
};

export function SubscriptionBadge({
  tier,
  size = 'md',
  showLabel = true,
  className = '',
}: SubscriptionBadgeProps) {
  const config = tierConfig[tier];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding} rounded ${config.bgColor} border ${config.borderColor} ${className}`}
    >
      <Icon className={`${sizeStyles.icon} ${config.iconColor}`} />
      {showLabel && (
        <span className={`font-bold ${sizeStyles.text} ${config.textColor}`}>{config.label}</span>
      )}
    </div>
  );
}
