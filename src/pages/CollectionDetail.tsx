import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, Sparkles, FolderOpen, Pencil, Trash2, Plus, UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SportBadge } from '@/components/SportBadge';
import { CollectionFilterBuilder } from '@/components/CollectionFilterBuilder';
import { usePlayers } from '@/hooks/usePlayers';
import { useTags, cardMatchesRules } from '@/hooks/useTags';
import { useAuth } from '@/hooks/useAuth';
import { Tag, Card, PlayerWithCards, FilterRules } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CARD_SLOTS = ['Rookie', 'Autographed', 'Base'] as const;

function cardHasSlot(card: Card, slot: string): boolean {
  return card.card_labels?.some(l => l.toLowerCase() === slot.toLowerCase()) ?? false;
}

interface PlayerRow {
  player: PlayerWithCards;
  matchingCards: Card[];
}

function StatsRing({ value, size = 64, strokeWidth = 5, label, color }: {
  value: number; size?: number; strokeWidth?: number; label: string; color: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          className="stroke-muted" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="text-lg font-display font-bold text-foreground">{value.toFixed(0)}%</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { players, isLoading: playersLoading } = usePlayers();
  const { tags, cardTagLinks, deleteTag, addCardTag, removeCardTag, isLoading: tagsLoading } = useTags();
  const [showEditBuilder, setShowEditBuilder] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const isLoading = authLoading || playersLoading || tagsLoading;

  const tag = useMemo(() => tags.find(t => t.id === id) || null, [tags, id]);

  const { rows, stats, slotStats } = useMemo(() => {
    if (!tag) return { rows: [], stats: { owned: 0, located: 0, missing: 0, total: 0, pct: 0, locatedPct: 0 }, slotStats: [] };

    const rows: PlayerRow[] = [];
    for (const player of players) {
      let matchingCards: Card[];
      if (tag.filter_rules) {
        matchingCards = player.cards.filter(c => cardMatchesRules(c, tag.filter_rules as FilterRules, player.sport));
      } else {
        const taggedCardIds = new Set(
          cardTagLinks.filter(ct => ct.tag_id === tag.id).map(ct => ct.card_id)
        );
        matchingCards = player.cards.filter(c => taggedCardIds.has(c.id));
      }
      if (matchingCards.length > 0) {
        rows.push({ player, matchingCards });
      }
    }

    const allCards = rows.flatMap(r => r.matchingCards);
    const owned = allCards.filter(c => c.status === 'owned').length;
    const located = allCards.filter(c => c.status === 'located').length;
    const total = allCards.length;
    const pct = total > 0 ? (owned / total) * 100 : 0;
    const locatedPct = total > 0 ? (located / total) * 100 : 0;

    const slotStats = CARD_SLOTS.map(slot => {
      const slotCards = allCards.filter(c => cardHasSlot(c, slot));
      const o = slotCards.filter(c => c.status === 'owned').length;
      const l = slotCards.filter(c => c.status === 'located').length;
      const t = slotCards.length;
      return { slot, owned: o, located: l, missing: t - o - l, total: t, pct: t > 0 ? (o / t) * 100 : 0 };
    });

    return {
      rows: rows.sort((a, b) => a.player.name.localeCompare(b.player.name)),
      stats: { owned, located, missing: total - owned - located, total, pct, locatedPct },
      slotStats,
    };
  }, [tag, players, cardTagLinks]);

  // Players NOT in the collection (for manual add)
  const availablePlayers = useMemo(() => {
    if (!tag) return [];
    const inCollectionIds = new Set(rows.map(r => r.player.id));
    return players.filter(p => !inCollectionIds.has(p.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [players, rows, tag]);

  const handleAddPlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player || !tag) return;
    // Add all of the player's cards to this collection via card_tags
    player.cards.forEach(card => {
      addCardTag.mutate({ cardId: card.id, tagId: tag.id });
    });
    setShowAddPlayer(false);
  };

  const handleRemovePlayer = (player: PlayerWithCards) => {
    if (!tag) return;
    // Remove all card_tags for this player's cards
    player.cards.forEach(card => {
      removeCardTag.mutate({ cardId: card.id, tagId: tag.id });
    });
  };

  const handleDelete = () => {
    if (!tag) return;
    deleteTag.mutate(tag.id, {
      onSuccess: () => navigate('/collections'),
    });
  };

  if (!authLoading && !user) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet><title>Collection Not Found | Card Hunt</title></Helmet>
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold mb-2">Collection Not Found</h1>
          <Button onClick={() => navigate('/collections')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collections
          </Button>
        </div>
      </div>
    );
  }

  const isSmart = !!tag.filter_rules;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{tag.name} | Card Hunt</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/collections')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Collections
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isSmart && (
                <Button variant="outline" size="sm" onClick={() => setShowEditBuilder(true)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit Query
                </Button>
              )}
              {!isSmart && (
                <Button variant="outline" size="sm" onClick={() => setShowAddPlayer(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Player
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{tag.name}"? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="mt-3">
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              {isSmart ? <Sparkles className="w-5 h-5 text-primary" /> : <FolderOpen className="w-5 h-5 text-primary" />}
              {tag.name}
              {isSmart && (
                <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">Smart</span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {rows.length} player{rows.length !== 1 ? 's' : ''} · {stats.total} card{stats.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-around">
            <StatsRing value={stats.pct} label="Owned" color="hsl(var(--status-owned))" />
            <StatsRing value={stats.locatedPct} label="Located" color="hsl(var(--status-located))" />
            <StatsRing value={stats.total > 0 ? ((stats.missing) / stats.total) * 100 : 0} label="Missing" color="hsl(var(--status-missing))" />
          </div>

          {/* Overall progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{stats.owned} owned</span>
              <span>{stats.located} located</span>
              <span>{stats.missing} missing</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-status-owned transition-all duration-500"
                style={{ width: `${stats.pct}%` }} />
              <div className="absolute top-0 h-full bg-status-located transition-all duration-500"
                style={{ left: `${stats.pct}%`, width: `${stats.locatedPct}%` }} />
            </div>
          </div>
        </div>

        {/* Per-Slot Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {slotStats.map(({ slot, owned, located, missing, total, pct }) => (
            <div key={slot} className="glass-card p-4 text-center">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{slot}</h3>
              <p className={cn(
                'text-2xl font-display font-bold',
                pct === 100 ? 'text-status-owned' : pct > 0 ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {pct.toFixed(0)}%
              </p>
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div className="absolute left-0 top-0 h-full bg-status-owned transition-all duration-500"
                  style={{ width: `${total > 0 ? (owned / total) * 100 : 0}%` }} />
                <div className="absolute top-0 h-full bg-status-located transition-all duration-500"
                  style={{
                    left: `${total > 0 ? (owned / total) * 100 : 0}%`,
                    width: `${total > 0 ? (located / total) * 100 : 0}%`,
                  }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {owned} owned · {located} located · {missing} missing
              </p>
            </div>
          ))}
        </div>

        {/* Player Table */}
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-[1fr_70px_70px_70px_60px_40px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border/20">
            <span>Player</span>
            {CARD_SLOTS.map(s => <span key={s} className="text-center">{s}</span>)}
            <span className="text-center">%</span>
            <span />
          </div>

          {rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No players match this collection yet.</p>
            </div>
          ) : (
            rows.map(({ player, matchingCards }) => {
              const slotStatuses = CARD_SLOTS.map(slot => {
                const slotCards = matchingCards.filter(c => cardHasSlot(c, slot));
                if (slotCards.length === 0) return 'none';
                if (slotCards.some(c => c.status === 'owned')) return 'owned';
                if (slotCards.some(c => c.status === 'located')) return 'located';
                return 'missing';
              });

              const ownedSlots = slotStatuses.filter(s => s === 'owned').length;
              const activeSlots = slotStatuses.filter(s => s !== 'none').length;
              const playerPct = activeSlots > 0 ? (ownedSlots / activeSlots) * 100 : 0;

              return (
                <div
                  key={player.id}
                  className="grid grid-cols-[1fr_70px_70px_70px_60px_40px] gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors items-center"
                >
                  <Link to={`/player/${player.id}`} className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm text-foreground truncate hover:text-primary transition-colors">{player.name}</span>
                    <SportBadge sport={player.sport} />
                  </Link>

                  {CARD_SLOTS.map((slot, i) => {
                    const status = slotStatuses[i];
                    return (
                      <div key={slot} className="flex justify-center">
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          status === 'owned' && 'bg-status-owned',
                          status === 'located' && 'bg-status-located',
                          status === 'missing' && 'bg-status-missing',
                          status === 'none' && 'bg-muted/30'
                        )} title={`${slot}: ${status}`} />
                      </div>
                    );
                  })}

                  <span className={cn(
                    'text-xs font-medium text-center',
                    playerPct === 100 ? 'text-status-owned' : playerPct > 0 ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {playerPct.toFixed(0)}%
                  </span>

                  {/* Remove player (manual collections only) */}
                  {!isSmart && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemovePlayer(player)}
                      title="Remove from collection"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isSmart && <div />}
                </div>
              );
            })
          )}
        </div>

        {/* Add Player for manual collections */}
        {showAddPlayer && !isSmart && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-medium text-sm text-foreground">Add Player to Collection</h3>
            <Select onValueChange={handleAddPlayer}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="Select a player..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availablePlayers.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </main>

      <CollectionFilterBuilder
        open={showEditBuilder}
        onOpenChange={setShowEditBuilder}
        editTag={tag}
      />
    </div>
  );
}
