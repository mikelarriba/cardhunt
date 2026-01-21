import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SerialNumberInputProps {
  isNumbered: boolean;
  serialNum: string;
  serialTotal: string;
  onIsNumberedChange: (value: boolean) => void;
  onSerialNumChange: (value: string) => void;
  onSerialTotalChange: (value: string) => void;
}

export function SerialNumberInput({
  isNumbered,
  serialNum,
  serialTotal,
  onIsNumberedChange,
  onSerialNumChange,
  onSerialTotalChange,
}: SerialNumberInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="is-numbered" className="text-sm font-medium">
          Serial Numbered
        </Label>
        <Switch
          id="is-numbered"
          checked={isNumbered}
          onCheckedChange={onIsNumberedChange}
        />
      </div>

      {isNumbered && (
        <div className="flex items-center gap-2 animate-fade-in">
          <div className="flex-1">
            <Input
              type="number"
              min="1"
              placeholder="XX"
              value={serialNum}
              onChange={(e) => onSerialNumChange(e.target.value)}
              className="bg-secondary/50 border-border/50 text-center font-mono"
            />
          </div>
          <span className="text-lg font-bold text-muted-foreground">/</span>
          <div className="flex-1">
            <Input
              type="number"
              min="1"
              placeholder="YY"
              value={serialTotal}
              onChange={(e) => onSerialTotalChange(e.target.value)}
              className="bg-secondary/50 border-border/50 text-center font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SerialNumberBadge({
  serialNum,
  serialTotal,
  className,
}: {
  serialNum: number;
  serialTotal: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'px-2 py-1 rounded bg-black/70 backdrop-blur-sm',
        'text-xs font-mono font-bold text-white',
        'border border-white/20',
        className
      )}
    >
      {serialNum}/{serialTotal}
    </div>
  );
}
