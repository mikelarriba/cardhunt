import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CardLabelsInputProps {
  labels: string[];
  onChange: (labels: string[]) => void;
  existingLabels?: string[];
  placeholder?: string;
}

export function CardLabelsInput({
  labels,
  onChange,
  existingLabels = [],
  placeholder = 'Add label...',
}: CardLabelsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Default labels to suggest
  const defaultLabels = ['Rookie', 'Autographed', 'Numbered', 'Parallel', 'Insert', 'Refractor', 'Prizm', 'Base', 'SP', 'SSP', 'Variation'];

  // Combine default with existing
  const allLabels = useMemo(() => {
    const set = new Set([...defaultLabels, ...existingLabels]);
    return Array.from(set).sort();
  }, [existingLabels]);

  // Filter suggestions
  const suggestions = useMemo(() => {
    const filtered = allLabels.filter(l => !labels.includes(l));
    if (!inputValue) return filtered.slice(0, 8);
    const query = inputValue.toLowerCase();
    return filtered.filter(l => l.toLowerCase().includes(query)).slice(0, 8);
  }, [inputValue, allLabels, labels]);

  const addLabel = (label: string) => {
    const trimmed = label.trim();
    if (trimmed && !labels.includes(trimmed)) {
      onChange([...labels, trimmed]);
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeLabel = (labelToRemove: string) => {
    onChange(labels.filter(l => l !== labelToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addLabel(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && labels.length > 0) {
      removeLabel(labels[labels.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Card Labels / Types</Label>
      
      {/* Tags display */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {labels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary"
          >
            {label}
            <button
              type="button"
              onClick={() => removeLabel(label)}
              className="hover:bg-primary/30 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          className="bg-secondary/50 border-border/50"
        />

        {/* Suggestions dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            {suggestions.map((label) => (
              <button
                key={label}
                type="button"
                onMouseDown={() => addLabel(label)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/80 transition-colors flex items-center gap-2"
              >
                <Plus className="w-3 h-3 text-muted-foreground" />
                {label}
              </button>
            ))}
            {inputValue && !suggestions.find(s => s.toLowerCase() === inputValue.toLowerCase()) && (
              <button
                type="button"
                onMouseDown={() => addLabel(inputValue)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/80 transition-colors flex items-center gap-2 text-primary"
              >
                <Plus className="w-3 h-3" />
                Create "{inputValue}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
