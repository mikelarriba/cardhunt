import { useState } from 'react';
import { User, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SportType, SPORTS, POPULAR_TEAMS } from '@/types/database';
import { usePlayers } from '@/hooks/usePlayers';
import { cn } from '@/lib/utils';

interface AddPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddPlayerModal({ open, onOpenChange }: AddPlayerModalProps) {
  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportType | null>(null);
  const [team, setTeam] = useState('');
  const [customTeam, setCustomTeam] = useState('');
  const { createPlayer } = usePlayers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sport) return;

    const finalTeam = team || customTeam;
    if (!finalTeam) return;

    createPlayer.mutate(
      { name, sport, team: finalTeam },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setName('');
    setSport(null);
    setTeam('');
    setCustomTeam('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add New Player</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="playerName"
                placeholder="e.g., Michael Jordan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
                required
              />
            </div>
          </div>

          {/* Sport Selection */}
          <div className="space-y-2">
            <Label>Sport</Label>
            <div className="grid grid-cols-5 gap-2">
              {SPORTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setSport(s.value);
                    setTeam('');
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200',
                    sport === s.value
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="text-xl">{sportEmoji[s.value]}</span>
                  <span className="text-[10px] font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Team Selection */}
          {sport && (
            <div className="space-y-2 animate-fade-in">
              <Label>Team / League</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {POPULAR_TEAMS[sport].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTeam(t);
                      setCustomTeam('');
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                      team === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Or enter custom team..."
                  value={customTeam}
                  onChange={(e) => {
                    setCustomTeam(e.target.value);
                    setTeam('');
                  }}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={!name || !sport || (!team && !customTeam) || createPlayer.isPending}
          >
            {createPlayer.isPending ? 'Adding...' : 'Add Player'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
