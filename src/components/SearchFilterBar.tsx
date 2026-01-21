import { useState, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SportType, CardStatus, SPORTS, Tag } from '@/types/database';
import { useTags } from '@/hooks/useTags';

interface SearchFilterBarProps {
  searchQuery: string;
  selectedSport: SportType | 'all';
  selectedStatus: CardStatus | 'all';
  selectedTag: string | 'all';
  selectedTeam: string | 'all';
  availableTeams: string[];
  onSearchChange: (query: string) => void;
  onSportChange: (sport: SportType | 'all') => void;
  onStatusChange: (status: CardStatus | 'all') => void;
  onTagChange: (tagId: string | 'all') => void;
  onTeamChange: (team: string | 'all') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const sportEmoji: Record<SportType, string> = {
  football: '🏈',
  basketball: '🏀',
  baseball: '⚾',
  hockey: '🏒',
  soccer: '⚽',
  golf: '⛳',
  tennis: '🎾',
  boxing: '🥊',
  mma: '🥋',
  other: '🏆',
};

export function SearchFilterBar({
  searchQuery,
  selectedSport,
  selectedStatus,
  selectedTag,
  selectedTeam,
  availableTeams,
  onSearchChange,
  onSportChange,
  onStatusChange,
  onTagChange,
  onTeamChange,
  onClearFilters,
  hasActiveFilters,
}: SearchFilterBarProps) {
  const { tags } = useTags();

  return (
    <div className="glass-card p-4 mb-4 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search players, teams, or collections..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
        </div>

        {/* Sport Filter */}
        <Select value={selectedSport} onValueChange={(v) => onSportChange(v as SportType | 'all')}>
          <SelectTrigger className="w-[140px] h-9 bg-background/50 border-border/50">
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Sports</SelectItem>
            {SPORTS.map((sport) => (
              <SelectItem key={sport.value} value={sport.value}>
                <span className="flex items-center gap-2">
                  <span>{sportEmoji[sport.value]}</span>
                  {sport.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Collection Filter */}
        <Select value={selectedTag} onValueChange={onTagChange}>
          <SelectTrigger className="w-[160px] h-9 bg-background/50 border-border/50">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Collections</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <span className="flex items-center gap-2">
                  <span>📁</span>
                  {tag.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Team Filter */}
        <Select value={selectedTeam} onValueChange={onTeamChange}>
          <SelectTrigger className="w-[160px] h-9 bg-background/50 border-border/50">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
            <SelectItem value="all">All Teams</SelectItem>
            {availableTeams.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 text-muted-foreground hover:text-foreground gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
