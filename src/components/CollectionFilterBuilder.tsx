import { useState, useEffect } from 'react';
import { Plus, X, Sparkles, Trash2 } from 'lucide-react';
import { TeamAutocomplete } from '@/components/TeamAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FilterRules, FilterCondition, SPORTS, CARD_STATUSES, Tag } from '@/types/database';
import { useTags } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface CollectionFilterBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, edit this existing collection instead of creating a new one */
  editTag?: Tag | null;
}

const CARD_TYPE_SLOTS = ['Rookie', 'Autographed', 'Base'] as const;

const FIELD_OPTIONS: { value: FilterCondition['field']; label: string }[] = [
  { value: 'card_team', label: 'Team' },
  { value: 'card_labels', label: 'Card Labels' },
  { value: 'brand', label: 'Brand' },
  { value: 'series', label: 'Series' },
  { value: 'status', label: 'Status' },
  { value: 'card_year', label: 'Year' },
  { value: 'sport', label: 'Sport' },
];

const OPERATOR_OPTIONS: Record<string, { value: FilterCondition['operator']; label: string }[]> = {
  card_team: [
    { value: 'equals', label: 'is exactly' },
    { value: 'contains', label: 'contains' },
  ],
  card_labels: [
    { value: 'contains', label: 'includes' },
    { value: 'in', label: 'includes any of' },
  ],
  brand: [
    { value: 'equals', label: 'is exactly' },
    { value: 'contains', label: 'contains' },
  ],
  series: [
    { value: 'equals', label: 'is exactly' },
    { value: 'contains', label: 'contains' },
  ],
  status: [
    { value: 'equals', label: 'is' },
    { value: 'in', label: 'is any of' },
  ],
  card_year: [
    { value: 'equals', label: 'is' },
  ],
  sport: [
    { value: 'equals', label: 'is' },
  ],
};

function ConditionValueInput({
  condition,
  onChange,
}: {
  condition: FilterCondition;
  onChange: (value: string | string[]) => void;
}) {
  const [multiValue, setMultiValue] = useState('');

  if (condition.field === 'status') {
    if (condition.operator === 'in') {
      const selected = Array.isArray(condition.value) ? condition.value : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {CARD_STATUSES.map((s) => (
            <Badge
              key={s.value}
              variant="secondary"
              className={cn(
                'cursor-pointer transition-colors',
                selected.includes(s.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
              onClick={() => {
                const newVal = selected.includes(s.value)
                  ? selected.filter((v) => v !== s.value)
                  : [...selected, s.value];
                onChange(newVal);
              }}
            >
              {s.label}
            </Badge>
          ))}
        </div>
      );
    }
    return (
      <Select value={String(condition.value)} onValueChange={onChange}>
        <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {CARD_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (condition.field === 'sport') {
    return (
      <Select value={String(condition.value)} onValueChange={onChange}>
        <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
          <SelectValue placeholder="Select sport" />
        </SelectTrigger>
        <SelectContent>
          {SPORTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (condition.operator === 'in') {
    const selected = Array.isArray(condition.value) ? condition.value : [];
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {selected.map((v, i) => (
            <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
              {v}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => onChange(selected.filter((_, idx) => idx !== i))}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add value..."
            value={multiValue}
            onChange={(e) => setMultiValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && multiValue.trim()) {
                onChange([...selected, multiValue.trim()]);
                setMultiValue('');
              }
            }}
            className="h-8 text-sm bg-secondary/50"
          />
          <Button
            size="sm"
            className="h-8"
            onClick={() => {
              if (multiValue.trim()) {
                onChange([...selected, multiValue.trim()]);
                setMultiValue('');
              }
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  if (condition.field === 'card_team') {
    return (
      <TeamAutocomplete
        value={String(condition.value || '')}
        onChange={onChange}
        onSelect={onChange}
        placeholder="Type 3+ letters to search teams..."
        showIcon={false}
      />
    );
  }

  return (
    <Input
      placeholder="Enter value..."
      value={String(condition.value || '')}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 bg-secondary/50 border-border/50"
    />
  );
}

/** Parse existing filter_rules to extract card type selections and extra conditions */
function parseFilterRules(rules: FilterRules | null | undefined): {
  cardTypes: string[];
  conditions: FilterCondition[];
  logic: 'and' | 'or';
} {
  if (!rules) return { cardTypes: [], conditions: [], logic: 'and' };

  const cardTypeSlots = ['rookie', 'autographed', 'base'];
  const cardTypes: string[] = [];
  const conditions: FilterCondition[] = [];

  for (const cond of rules.conditions) {
    if (cond.field === 'card_labels') {
      // Extract card type selections
      if (cond.operator === 'contains' && typeof cond.value === 'string') {
        if (cardTypeSlots.includes(cond.value.toLowerCase())) {
          cardTypes.push(cond.value);
          continue;
        }
      }
      if (cond.operator === 'in' && Array.isArray(cond.value)) {
        const types = cond.value.filter(v => cardTypeSlots.includes(v.toLowerCase()));
        const others = cond.value.filter(v => !cardTypeSlots.includes(v.toLowerCase()));
        cardTypes.push(...types);
        if (others.length > 0) {
          conditions.push({ ...cond, value: others });
        }
        continue;
      }
    }
    conditions.push(cond);
  }

  return {
    cardTypes,
    conditions: conditions.length > 0 ? conditions : [{ field: 'card_team', operator: 'equals', value: '' }],
    logic: rules.logic,
  };
}

export function CollectionFilterBuilder({ open, onOpenChange, editTag }: CollectionFilterBuilderProps) {
  const isEdit = !!editTag;
  const parsed = parseFilterRules(editTag?.filter_rules as FilterRules | null);

  const [name, setName] = useState('');
  const [selectedCardTypes, setSelectedCardTypes] = useState<string[]>([]);
  const [logic, setLogic] = useState<'and' | 'or'>('and');
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { field: 'card_team', operator: 'equals', value: '' },
  ]);
  const { createTag, updateTag } = useTags();

  // Reset form when opening or when editTag changes
  useEffect(() => {
    if (open) {
      if (editTag) {
        setName(editTag.name);
        setSelectedCardTypes(parsed.cardTypes);
        setLogic(parsed.logic);
        setConditions(parsed.conditions);
      } else {
        setName('');
        setSelectedCardTypes([]);
        setLogic('and');
        setConditions([{ field: 'card_team', operator: 'equals', value: '' }]);
      }
    }
  }, [open, editTag?.id]);

  const toggleCardType = (type: string) => {
    setSelectedCardTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const addCondition = () => {
    setConditions([...conditions, { field: 'card_team', operator: 'equals', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map((c, i) => {
      if (i !== index) return c;
      const updated = { ...c, ...updates };
      if (updates.field || updates.operator) {
        updated.value = updates.operator === 'in' ? [] : '';
      }
      return updated;
    }));
  };

  const buildFilterRules = (): FilterRules => {
    const allConditions: FilterCondition[] = [];

    if (selectedCardTypes.length === 1) {
      allConditions.push({ field: 'card_labels', operator: 'contains', value: selectedCardTypes[0] });
    } else if (selectedCardTypes.length > 1) {
      allConditions.push({ field: 'card_labels', operator: 'in', value: selectedCardTypes });
    }

    const validConditions = conditions.filter(c => {
      if (Array.isArray(c.value)) return c.value.length > 0;
      return String(c.value).trim() !== '';
    });
    allConditions.push(...validConditions);

    return { conditions: allConditions, logic };
  };

  const handleSubmit = () => {
    if (!name.trim() || selectedCardTypes.length === 0) return;

    const filterRules = buildFilterRules();

    if (isEdit && editTag) {
      updateTag.mutate(
        { tagId: editTag.id, updates: { name: name.trim(), filter_rules: filterRules } },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createTag.mutate(
        { name: name.trim(), filterRules },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isPending = isEdit ? updateTag.isPending : createTag.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isEdit ? 'Edit Collection' : 'Create Smart Collection'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Collection Name</Label>
            <Input
              placeholder="e.g. Falcons Rookies"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div className="space-y-3">
            <Label>Card Types <span className="text-xs text-muted-foreground">(select at least one)</span></Label>
            <div className="flex gap-3">
              {CARD_TYPE_SLOTS.map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                    selectedCardTypes.includes(type)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <Checkbox
                    checked={selectedCardTypes.includes(type)}
                    onCheckedChange={() => toggleCardType(type)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-sm font-medium">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Match</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLogic('and')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  logic === 'and'
                    ? 'bg-primary/20 text-primary ring-1 ring-primary'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                )}
              >
                ALL conditions (AND)
              </button>
              <button
                type="button"
                onClick={() => setLogic('or')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  logic === 'or'
                    ? 'bg-primary/20 text-primary ring-1 ring-primary'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                )}
              >
                ANY condition (OR)
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Additional Conditions <span className="text-xs text-muted-foreground">(optional)</span></Label>
            {conditions.map((cond, i) => (
              <div key={i} className="glass-card p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    {i > 0 ? (logic === 'and' ? 'AND' : 'OR') : 'WHERE'}
                  </span>
                  {conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeCondition(i)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={cond.field}
                    onValueChange={(v) => updateCondition(i, { field: v as FilterCondition['field'] })}
                  >
                    <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={cond.operator}
                    onValueChange={(v) => updateCondition(i, { operator: v as FilterCondition['operator'] })}
                  >
                    <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(OPERATOR_OPTIONS[cond.field] || []).map((op) => (
                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ConditionValueInput
                  condition={cond}
                  onChange={(value) => {
                    setConditions(conditions.map((c, idx) => idx === i ? { ...c, value } : c));
                  }}
                />
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addCondition}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Condition
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={!name.trim() || selectedCardTypes.length === 0 || isPending}
          >
            {isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Smart Collection')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
