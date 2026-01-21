import { LayoutGrid, Grid3X3, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export type ViewMode = 'standard' | 'compact' | 'table';

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className="bg-secondary/50 p-1 rounded-lg border border-border/50"
    >
      <ToggleGroupItem
        value="standard"
        aria-label="Standard view"
        className={cn(
          'px-3 py-1.5 text-xs gap-1.5 rounded-md transition-all duration-200',
          'hover:bg-muted/50',
          'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md'
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Standard</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="compact"
        aria-label="Compact view"
        className={cn(
          'px-3 py-1.5 text-xs gap-1.5 rounded-md transition-all duration-200',
          'hover:bg-muted/50',
          'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md'
        )}
      >
        <Grid3X3 className="w-4 h-4" />
        <span className="hidden sm:inline">Compact</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="table"
        aria-label="Table view"
        className={cn(
          'px-3 py-1.5 text-xs gap-1.5 rounded-md transition-all duration-200',
          'hover:bg-muted/50',
          'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md'
        )}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Table</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
