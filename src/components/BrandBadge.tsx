import { cn } from '@/lib/utils';

interface BrandBadgeProps {
  brand: string | null;
  className?: string;
}

const brandColors: Record<string, string> = {
  'Panini': 'bg-blue-600 text-white',
  'Upper Deck': 'bg-red-600 text-white',
  'Topps': 'bg-orange-500 text-white',
};

export function BrandBadge({ brand, className }: BrandBadgeProps) {
  if (!brand) return null;

  const colorClass = brandColors[brand] || 'bg-muted text-muted-foreground';

  return (
    <div
      className={cn(
        'absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-xs font-bold',
        colorClass,
        className
      )}
    >
      {brand}
    </div>
  );
}