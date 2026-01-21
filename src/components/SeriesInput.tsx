import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CARD_SERIES } from '@/types/database';
import { cn } from '@/lib/utils';

interface SeriesInputProps {
  value: string;
  onChange: (value: string) => void;
  existingSeries?: string[];
}

export function SeriesInput({ value, onChange, existingSeries = [] }: SeriesInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Combine default series with existing user series
  const allSeries = useMemo(() => {
    const set = new Set([...CARD_SERIES, ...existingSeries]);
    return Array.from(set).sort();
  }, [existingSeries]);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue) return allSeries.slice(0, 6);
    const query = inputValue.toLowerCase();
    return allSeries
      .filter(s => s.toLowerCase().includes(query))
      .slice(0, 6);
  }, [inputValue, allSeries]);

  const handleSelect = (series: string) => {
    setInputValue(series);
    onChange(series);
    setIsFocused(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="series">Series / Set</Label>
      <Input
        id="series"
        placeholder="e.g., Prizm, Mosaic, Select..."
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        className="bg-secondary/50 border-border/50"
      />

      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((series) => (
            <button
              key={series}
              type="button"
              onMouseDown={() => handleSelect(series)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm hover:bg-secondary/80 transition-colors',
                series === inputValue && 'bg-primary/10 text-primary'
              )}
            >
              {series}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
