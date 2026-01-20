import { TeamLogo } from './TeamLogo';
import { cn } from '@/lib/utils';

interface TeamPillProps {
  teamName: string;
  showLogo?: boolean;
  size?: 'sm' | 'md';
}

export function TeamPill({ teamName, showLogo = true, size = 'sm' }: TeamPillProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-secondary/80 dark:bg-secondary/50 border border-border/50',
        'text-foreground/90 font-medium shrink-0',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      {showLogo && <TeamLogo teamName={teamName} size="sm" />}
      <span className="truncate max-w-[100px]">{teamName}</span>
    </div>
  );
}

interface TeamPillListProps {
  teams: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export function TeamPillList({ teams, maxVisible = 3, size = 'sm' }: TeamPillListProps) {
  const visibleTeams = teams.slice(0, maxVisible);
  const remainingCount = teams.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleTeams.map((team) => (
        <TeamPill key={team} teamName={team} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-muted-foreground px-1.5">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
