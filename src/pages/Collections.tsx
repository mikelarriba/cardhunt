import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Sparkles, FolderOpen, ChevronDown, ChevronRight, Wand2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CollectionFilterBuilder } from '@/components/CollectionFilterBuilder';
import { TeamPillList } from '@/components/TeamPill';
import { SportBadge } from '@/components/SportBadge';
import { usePlayers } from '@/hooks/usePlayers';
import { useTags, cardMatchesRules } from '@/hooks/useTags';
import { useAuth } from '@/hooks/useAuth';
import { Tag, Card, PlayerWithCards } from '@/types/database';
import { cn } from '@/lib/utils';

const CARD_SLOTS = ['Rookie', 'Autographed', 'Base'] as const;

function cardHasSlot(card: Card, slot: string): boolean {
  return card.card_labels?.some(l => l.toLowerCase() === slot.toLowerCase()) ?? false;
}

interface CollectionPlayerRow {
  player: PlayerWithCards;
  matchingCards: Card[];
}

function CollectionCard({ tag, players, cardTagLinks }: { tag: Tag; players: PlayerWithCards[]; cardTagLinks: { card_id: string; tag_id: string }[] }) {

  const { rows, stats } = useMemo(() => {
    const rows: CollectionPlayerRow[] = [];

    for (const player of players) {
      let matchingCards: Card[];
      if (tag.filter_rules) {
        matchingCards = player.cards.filter(c => cardMatchesRules(c, tag.filter_rules!, player.sport));
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

    return {
      rows: rows.sort((a, b) => a.player.name.localeCompare(b.player.name)),
      stats: { owned, located, missing: total - owned - located, total, pct, locatedPct },
    };
  }, [tag, players, cardTagLinks]);

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <Link
        to={`/collection/${tag.id}`}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors block"
      >
        <div className="flex items-center gap-3">
          {tag.filter_rules ? (
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="text-left">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              {tag.name}
              {tag.filter_rules && (
                <span className="text-[10px] font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Smart</span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {rows.length} player{rows.length !== 1 ? 's' : ''} · {stats.total} card{stats.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Completion ring */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-lg font-display font-bold text-foreground">{stats.pct.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">owned</p>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-status-owned">{stats.owned}✓</span>
              <span className="text-xs text-status-located">{stats.located}◎</span>
              <span className="text-xs text-status-missing">{stats.missing}✗</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Link>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-status-owned transition-all duration-500"
            style={{ width: `${stats.pct}%` }}
          />
          <div
            className="absolute top-0 h-full bg-status-located transition-all duration-500"
            style={{ left: `${stats.pct}%`, width: `${stats.locatedPct}%` }}
          />
        </div>
      </div>

    </div>
  );
}

export default function Collections() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { players, isLoading: playersLoading } = usePlayers();
  const { tags, cardTagLinks, isLoading: tagsLoading } = useTags();
  const [showBuilder, setShowBuilder] = useState(false);

  const isLoading = authLoading || playersLoading || tagsLoading;

  if (!authLoading && !user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Collections | Card Hunt</title>
        <meta name="description" content="Browse and manage your card collections. Track completion across players and card types." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="font-display font-bold text-xl text-foreground">Collections</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setShowBuilder(true)} className="gap-2">
                <Wand2 className="w-4 h-4" />
                New Collection
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display font-semibold text-xl mb-2">No Collections Yet</h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Create a smart collection to track your card completion across players.
            </p>
            <Button onClick={() => setShowBuilder(true)} className="gap-2">
              <Wand2 className="w-4 h-4" />
              Create Your First Collection
            </Button>
          </div>
        ) : (
          tags.map(tag => (
            <CollectionCard
              key={tag.id}
              tag={tag}
              players={players}
              cardTagLinks={cardTagLinks}
            />
          ))
        )}
      </main>

      <CollectionFilterBuilder open={showBuilder} onOpenChange={setShowBuilder} />
    </div>
  );
}
