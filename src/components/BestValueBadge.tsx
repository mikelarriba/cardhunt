import { BadgeDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BestValueBadgeProps {
  className?: string;
}

export function BestValueBadge({ className }: BestValueBadgeProps) {
  return (
    <div
      className={cn(
        'absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full',
        'bg-gradient-to-r from-amber-500 to-yellow-400 text-black',
        'text-xs font-bold shadow-lg',
        'animate-pulse',
        className
      )}
    >
      <BadgeDollarSign className="w-3.5 h-3.5" />
      <span>Best Deal</span>
    </div>
  );
}