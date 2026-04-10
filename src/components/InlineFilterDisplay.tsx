import { useState, useEffect } from 'react';
import { Pencil, Check, X, Plus, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TeamAutocomplete } from '@/components/TeamAutocomplete';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterRules, FilterCondition, Tag, SPORTS, CARD_STATUSES } from '@/types/database';
import { useTags } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

const CARD_TYPE_SLOTS = ['Rookie', 'Autographed', 'Base'] as const;

const FIELD_LABELS: Record<string, string> = {
  card_team: 'Team',
  card_labels: 'Labels',
  brand: 'Brand',
  series: 'Series',
  status: 'Status',
  card_year: 'Year',
  sport: 'Sport',
};

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'is',
  contains: 'includes',
  in: 'any of',
};

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
  card_year: [{ value: 'equals', label: 'is' }],
  sport: [{ value: 'equals', label: 'is' }],
};

function parseFilterRules(rules: FilterRules | null | undefined) {
  if (!rules) return { cardTypes: [] as string[], conditions: [] as FilterCondition[], logic: 'and' as const };

  const cardTypeSlots = ['rookie', 'autographed', 'base'];
  const cardTypes: string[] = [];
  const conditions: FilterCondition[] = [];

  for (const cond of rules.conditions) {
    if (cond.field === 'card_labels') {
      if (cond.operator === 'contains' && typeof cond.value === 'string' && cardTypeSlots.includes(cond.value.toLowerCase())) {
        cardTypes.push(cond.value);
        continue;
      }
      if (cond.operator === 'in' && Array.isArray(cond.value)) {
        const types = cond.value.filter(v => cardTypeSlots.includes(v.toLowerCase()));
        const others = cond.value.filter(v => !cardTypeSlots.includes(v.toLowerCase()));
        cardTypes.push(...types);
        if (others.length > 0) conditions.push({ ...cond, value: others });
        continue;
      }
    }
    conditions.push(cond);
  }

  return { cardTypes, conditions, logic: rules.logic };
}

function formatConditionValue(cond: FilterCondition): string {
  if (Array.isArray(cond.value)) return cond.value.join(', ');
  return String(cond.value);
}

// ── Read-only summary ──────────────────────────────────────────────
function FilterSummary({ rules, onEdit }: { rules: FilterRules; onEdit: () => void }) {
  const { cardTypes, conditions, logic } = parseFilterRules(rules);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" />
          Active Filters
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 gap-1.5 text-xs">
          <Pencil className="w-3 h-3" /> Edit
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Card type pills */}
        {cardTypes.map(t => (
          <Badge key={t} variant="secondary" className={cn(
            'text-xs',
            t.toLowerCase() === 'rookie' && 'bg-primary/10 text-primary',
            t.toLowerCase() === 'autographed' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            t.toLowerCase() === 'base' && 'bg-secondary text-muted-foreground',
          )}>
            {t}
          </Badge>
        ))}

        {/* Logic connector */}
        {cardTypes.length > 0 && conditions.length > 0 && (
          <span className="text-[10px] text-muted-foreground uppercase font-semibold self-center">
            {logic === 'and' ? 'AND' : 'OR'}
          </span>
        )}

        {/* Condition pills */}
        {conditions.map((cond, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && (
              <span className="text-[10px] text-muted-foreground uppercase font-semibold mx-0.5">
                {logic === 'and' ? 'AND' : 'OR'}
              </span>
            )}
            <Badge variant="outline" className="text-xs gap-1 font-normal">
              <span className="font-medium">{FIELD_LABELS[cond.field] || cond.field}</span>
              <span className="text-muted-foreground">{OPERATOR_LABELS[cond.operator] || cond.operator}</span>
              <span className="font-semibold text-foreground">{formatConditionValue(cond)}</span>
            </Badge>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Inline editor ──────────────────────────────────────────────────
function ConditionValueInput({ condition, onChange }: { condition: FilterCondition; onChange: (v: string | string[]) => void }) {
  const [multiValue, setMultiValue] = useState('');

  if (condition.field === 'status') {
    if (condition.operator === 'in') {
      const selected = Array.isArray(condition.value) ? condition.value : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {CARD_STATUSES.map(s => (
            <Badge key={s.value} variant="secondary"
              className={cn('cursor-pointer transition-colors text-xs', selected.includes(s.value) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/80')}
              onClick={() => onChange(selected.includes(s.value) ? selected.filter(v => v !== s.value) : [...selected, s.value])}
            >{s.label}</Badge>
          ))}
        </div>
      );
    }
    return (
      <Select value={String(condition.value)} onValueChange={onChange}>
        <SelectTrigger className="h-8 bg-secondary/50 border-border/50 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{CARD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
      </Select>
    );
  }

  if (condition.field === 'sport') {
    return (
      <Select value={String(condition.value)} onValueChange={onChange}>
        <SelectTrigger className="h-8 bg-secondary/50 border-border/50 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{SPORTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
      </Select>
    );
  }

  if (condition.operator === 'in') {
    const selected = Array.isArray(condition.value) ? condition.value : [];
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1">{selected.map((v, i) => (
          <Badge key={i} variant="secondary" className="text-xs bg-primary/10 text-primary">{v}
            <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onChange(selected.filter((_, idx) => idx !== i))} />
          </Badge>
        ))}</div>
        <div className="flex gap-1">
          <Input placeholder="Add..." value={multiValue} onChange={e => setMultiValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && multiValue.trim()) { onChange([...selected, multiValue.trim()]); setMultiValue(''); } }}
            className="h-7 text-xs bg-secondary/50" />
          <Button size="sm" className="h-7 px-2" onClick={() => { if (multiValue.trim()) { onChange([...selected, multiValue.trim()]); setMultiValue(''); } }}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  if (condition.field === 'card_team') {
    return <TeamAutocomplete value={String(condition.value || '')} onChange={onChange} onSelect={onChange} placeholder="Search teams..." showIcon={false} />;
  }

  return <Input placeholder="Value..." value={String(condition.value || '')} onChange={e => onChange(e.target.value)} className="h-8 text-xs bg-secondary/50 border-border/50" />;
}

function FilterEditor({ tag, onDone }: { tag: Tag; onDone: () => void }) {
  const rules = tag.filter_rules as FilterRules | null;
  const parsed = parseFilterRules(rules);

  const [name, setName] = useState(tag.name);
  const [selectedCardTypes, setSelectedCardTypes] = useState<string[]>(parsed.cardTypes);
  const [logic, setLogic] = useState<'and' | 'or'>(parsed.logic);
  const [conditions, setConditions] = useState<FilterCondition[]>(
    parsed.conditions.length > 0 ? parsed.conditions : [{ field: 'card_team', operator: 'equals', value: '' }]
  );
  const { updateTag } = useTags();

  const toggleCardType = (type: string) => setSelectedCardTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map((c, i) => {
      if (i !== index) return c;
      const updated = { ...c, ...updates };
      if (updates.field || updates.operator) updated.value = updates.operator === 'in' ? [] : '';
      return updated;
    }));
  };

  const buildFilterRules = (): FilterRules => {
    const allConditions: FilterCondition[] = [];
    if (selectedCardTypes.length === 1) allConditions.push({ field: 'card_labels', operator: 'contains', value: selectedCardTypes[0] });
    else if (selectedCardTypes.length > 1) allConditions.push({ field: 'card_labels', operator: 'in', value: selectedCardTypes });
    allConditions.push(...conditions.filter(c => Array.isArray(c.value) ? c.value.length > 0 : String(c.value).trim() !== ''));
    return { conditions: allConditions, logic };
  };

  const handleSave = () => {
    if (!name.trim() || selectedCardTypes.length === 0) return;
    updateTag.mutate(
      { tagId: tag.id, updates: { name: name.trim(), filter_rules: buildFilterRules() } },
      { onSuccess: () => onDone() }
    );
  };

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" />
          Edit Filters
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onDone} className="h-7 gap-1 text-xs">
            <X className="w-3 h-3" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || selectedCardTypes.length === 0 || updateTag.isPending}
            className="h-7 gap-1 text-xs bg-primary text-primary-foreground">
            <Check className="w-3 h-3" /> {updateTag.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm bg-secondary/50 border-border/50" />
      </div>

      {/* Card Types */}
      <div className="space-y-1.5">
        <Label className="text-xs">Card Types</Label>
        <div className="flex gap-2">
          {CARD_TYPE_SLOTS.map(type => (
            <label key={type} className={cn(
              'flex-1 flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs',
              selectedCardTypes.includes(type) ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary'
            )}>
              <Checkbox checked={selectedCardTypes.includes(type)} onCheckedChange={() => toggleCardType(type)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5" />
              <span className="font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Logic */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setLogic('and')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', logic === 'and' ? 'bg-primary/20 text-primary ring-1 ring-primary' : 'bg-secondary/50 text-muted-foreground')}>
          ALL (AND)
        </button>
        <button type="button" onClick={() => setLogic('or')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', logic === 'or' ? 'bg-primary/20 text-primary ring-1 ring-primary' : 'bg-secondary/50 text-muted-foreground')}>
          ANY (OR)
        </button>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <Label className="text-xs">Conditions</Label>
        {conditions.map((cond, i) => (
          <div key={i} className="bg-secondary/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">{i > 0 ? (logic === 'and' ? 'AND' : 'OR') : 'WHERE'}</span>
              {conditions.length > 1 && (
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={cond.field} onValueChange={v => updateCondition(i, { field: v as FilterCondition['field'] })}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{FIELD_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={cond.operator} onValueChange={v => updateCondition(i, { operator: v as FilterCondition['operator'] })}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{(OPERATOR_OPTIONS[cond.field] || []).map(op => <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <ConditionValueInput condition={cond} onChange={value => setConditions(conditions.map((c, idx) => idx === i ? { ...c, value } : c))} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setConditions([...conditions, { field: 'card_team', operator: 'equals', value: '' }])}
          className="w-full gap-1.5 text-xs h-7">
          <Plus className="w-3 h-3" /> Add Condition
        </Button>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────
export function InlineFilterDisplay({ tag }: { tag: Tag }) {
  const [editing, setEditing] = useState(false);
  const rules = tag.filter_rules as FilterRules | null;

  if (!rules) return null;

  if (editing) return <FilterEditor tag={tag} onDone={() => setEditing(false)} />;
  return <FilterSummary rules={rules} onEdit={() => setEditing(true)} />;
}
