import { useState } from 'react';
import { TEAM_COLORS } from '@/types/database';
import { cn } from '@/lib/utils';

interface TeamLogoProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TeamLogo({ teamName, size = 'md' }: TeamLogoProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px]',
    md: 'w-6 h-6 text-[10px]',
    lg: 'w-8 h-8 text-xs',
  };

  // Generate URL-friendly name for Clearbit
  const getClearbitUrl = (name: string) => {
    // Remove common suffixes and clean up the name
    const cleaned = name
      .toLowerCase()
      .replace(/\s+(fc|sc|cf|united|city|town|rovers|wanderers|athletic|hotspur)$/i, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    return `https://logo.clearbit.com/${cleaned}.com`;
  };

  // Get team initials for fallback
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get team color or generate one from the name
  const getTeamColor = (name: string) => {
    if (TEAM_COLORS[name]) {
      return TEAM_COLORS[name];
    }
    // Generate a consistent color from the team name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 45%)`;
  };

  const initials = getInitials(teamName);
  const teamColor = getTeamColor(teamName);
  const clearbitUrl = getClearbitUrl(teamName);

  if (imageError) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white shrink-0',
          sizeClasses[size]
        )}
        style={{ backgroundColor: teamColor }}
        title={teamName}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={clearbitUrl}
      alt={teamName}
      className={cn('rounded-full object-cover shrink-0 bg-muted', sizeClasses[size])}
      onError={() => setImageError(true)}
      title={teamName}
    />
  );
}
