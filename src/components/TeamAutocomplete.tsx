import { useState, useRef, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTeams } from '@/hooks/useTeams';
import { cn } from '@/lib/utils';

interface TeamAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (teamName: string) => void;
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
}

export function TeamAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search team...',
  className,
  showIcon = true,
}: TeamAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { searchTeams } = useTeams();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = searchTeams(value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (name: string) => {
    onChange(name);
    onSelect?.(name);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {showIcon && (
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
      )}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(e.target.value.length >= 3);
        }}
        onFocus={() => {
          if (value.length >= 3) setShowSuggestions(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            e.preventDefault();
            onSelect?.(value.trim());
            setShowSuggestions(false);
          }
        }}
        className={cn(showIcon && 'pl-10', 'bg-secondary/50 border-border/50', className)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => handleSelect(team.name)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {team.name}
              {team.sport && (
                <span className="ml-2 text-xs text-muted-foreground">({team.sport})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
