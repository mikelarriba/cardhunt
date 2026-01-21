import { SportType, LEAGUE_LOGOS } from '@/types/database';
import { cn } from '@/lib/utils';

interface LeagueLogoProps {
  sport: SportType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LeagueLogo({ sport, size = 'md', className }: LeagueLogoProps) {
  const logoUrl = LEAGUE_LOGOS[sport];
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (!logoUrl) {
    return null;
  }

  return (
    <img
      src={logoUrl}
      alt={`${sport} league logo`}
      className={cn(sizeClasses[size], 'object-contain', className)}
    />
  );
}
