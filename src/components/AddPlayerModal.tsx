import { useState } from 'react';
import { User, Building2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  const [teams, setTeams] = useState<string[]>([]);
  const [customTeam, setCustomTeam] = useState('');
  const { createPlayer } = usePlayers();

  const handleAddTeam = (team: string) => {
    if (team && !teams.includes(team)) {
      setTeams([...teams, team]);
    }
    setCustomTeam('');
  };

  const handleRemoveTeam = (team: string) => {
    setTeams(teams.filter(t => t !== team));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sport || teams.length === 0) return;

    createPlayer.mutate(
      { name, sport, teams },
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
    setTeams([]);
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
                    setTeams([]);
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

          {/* Team Selection - Multi-select */}
          {sport && (
            <div className="space-y-2 animate-fade-in">
              <Label>Teams / Leagues (select multiple)</Label>
              
              {/* Selected Teams */}
              {teams.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {teams.map((team) => (
                    <Badge
                      key={team}
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 pl-2 pr-1 py-1"
                    >
                      {team}
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(team)}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-2">
                {POPULAR_TEAMS[sport].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddTeam(t)}
                    disabled={teams.includes(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                      teams.includes(t)
                        ? 'bg-primary/30 text-primary cursor-not-allowed'
                        : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Add custom team..."
                    value={customTeam}
                    onChange={(e) => setCustomTeam(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTeam(customTeam);
                      }
                    }}
                    className="pl-10 bg-secondary/50 border-border/50"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleAddTeam(customTeam)}
                  disabled={!customTeam}
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={!name || !sport || teams.length === 0 || createPlayer.isPending}
          >
            {createPlayer.isPending ? 'Adding...' : 'Add Player'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
