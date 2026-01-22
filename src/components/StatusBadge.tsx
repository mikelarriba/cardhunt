import { Check, Eye, Search } from 'lucide-react';
import { CardStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: CardStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  owned: {
    label: 'Owned',
    icon: Check,
    className: 'status-owned',
  },
  located: {
    label: 'Located',
    icon: Eye,
    className: 'status-located',
  },
  missing: {
    label: 'Missing',
    icon: Search,
    className: 'status-missing',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'status-badge',
        config.className,
        size === 'sm' && 'text-[10px] px-2 py-0.5',
        size === 'lg' && 'text-base px-4 py-1.5'
      )}
    >
      <Icon className={cn('w-3 h-3', size === 'sm' && 'w-2.5 h-2.5', size === 'lg' && 'w-4 h-4')} />
      {config.label}
    </span>
  );
}
