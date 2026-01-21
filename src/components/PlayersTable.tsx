import { useNavigate } from 'react-router-dom';
import { PlayerWithCards } from '@/types/database';
import { SportBadge } from './SportBadge';
import { TeamLogo } from './TeamLogo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface PlayersTableProps {
  players: PlayerWithCards[];
}

function CollectionProgress({ player }: { player: PlayerWithCards }) {
  const ownedCount = player.cards.filter(c => c.status === 'owned').length;
  const locatedCount = player.cards.filter(c => c.status === 'located').length;
  const missingCount = player.cards.filter(c => c.status === 'missing').length;
  const totalCards = player.cards.length;

  if (totalCards === 0) {
    return <span className="text-xs text-muted-foreground italic">No cards</span>;
  }

  // Calculate percentage for progress bar
  const ownedPercent = (ownedCount / totalCards) * 100;
  const locatedPercent = (locatedCount / totalCards) * 100;

  return (
    <div className="flex items-center gap-3">
      {/* Mini Progress Bar */}
      <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden min-w-[80px] max-w-[120px]">
        <div className="h-full flex">
          <div 
            className="bg-status-owned transition-all" 
            style={{ width: `${ownedPercent}%` }} 
          />
          <div 
            className="bg-status-located transition-all" 
            style={{ width: `${locatedPercent}%` }} 
          />
        </div>
      </div>

      {/* Status Dots */}
      <div className="flex items-center gap-1.5 text-xs">
        {ownedCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-owned" />
            <span className="text-status-owned font-medium">{ownedCount}</span>
          </div>
        )}
        {locatedCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-located" />
            <span className="text-status-located font-medium">{locatedCount}</span>
          </div>
        )}
        {missingCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-missing" />
            <span className="text-muted-foreground font-medium">{missingCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlayersTable({ players }: PlayersTableProps) {
  const navigate = useNavigate();

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Player Name</TableHead>
              <TableHead className="text-muted-foreground font-medium">Sport</TableHead>
              <TableHead className="text-muted-foreground font-medium">Teams</TableHead>
              <TableHead className="text-muted-foreground font-medium">Collection Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={player.id}
                className={cn(
                  'cursor-pointer transition-colors border-border/30',
                  'hover:bg-secondary/30'
                )}
                onClick={() => navigate(`/player/${player.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {/* Mini Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={
                          player.cards.find(c => c.image_url)?.image_url ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=1a1a2e&textColor=fbbf24`
                        }
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-display">{player.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <SportBadge sport={player.sport} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                    {player.teams.slice(0, 3).map((team) => (
                      <TeamLogo key={team} teamName={team} size="sm" />
                    ))}
                    {player.teams.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{player.teams.length - 3}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <CollectionProgress player={player} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {players.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No players to display
        </div>
      )}
    </div>
  );
}
