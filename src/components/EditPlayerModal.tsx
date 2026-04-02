import { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
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
import { Player, SportType, SPORTS } from '@/types/database';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { TeamAutocomplete } from '@/components/TeamAutocomplete';
import { cn } from '@/lib/utils';

interface EditPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player;
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

export function EditPlayerModal({ open, onOpenChange, player }: EditPlayerModalProps) {
  const [name, setName] = useState(player.name);
  const [sport, setSport] = useState<SportType>(player.sport);
  const [teams, setTeams] = useState<string[]>(player.teams || []);
  const [teamInput, setTeamInput] = useState('');
  const { updatePlayer } = usePlayers();
  const { ensureTeams } = useTeams();

  useEffect(() => {
    if (open) {
      setName(player.name);
      setSport(player.sport);
      setTeams(player.teams || []);
    }
  }, [open, player]);

  const handleAddTeam = (team: string) => {
    if (team && !teams.includes(team)) {
      setTeams([...teams, team]);
    }
    setTeamInput('');
  };

  const handleRemoveTeam = (team: string) => {
    setTeams(teams.filter(t => t !== team));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sport || teams.length === 0) return;

    await ensureTeams(teams, sport);

    updatePlayer.mutate(
      { playerId: player.id, updates: { name, sport, teams } },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit Player</DialogTitle>
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
          <div className="space-y-2">
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

            <div className="flex gap-2">
              <TeamAutocomplete
                value={teamInput}
                onChange={setTeamInput}
                onSelect={handleAddTeam}
                placeholder="Type 3+ letters to search teams..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddTeam(teamInput)}
                disabled={!teamInput}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={!name || !sport || teams.length === 0 || updatePlayer.isPending}
          >
            {updatePlayer.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}