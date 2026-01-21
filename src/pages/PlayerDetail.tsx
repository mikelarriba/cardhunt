import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { CardCarousel } from '@/components/CardCarousel';
import { SportBadge } from '@/components/SportBadge';
import { ProgressDots } from '@/components/ProgressDots';
import { AddCardModal } from '@/components/AddCardModal';
import { EditPlayerModal } from '@/components/EditPlayerModal';
import { TeamPillList } from '@/components/TeamPill';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: player, isLoading, error } = usePlayer(id || '');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showEditPlayer, setShowEditPlayer] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Helmet>
          <title>Loading... | Card Tracker</title>
        </Helmet>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet>
          <title>Player Not Found | Card Tracker</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Player Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The player you're looking for doesn't exist or you don't have access.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const ownedCount = player.cards.filter(c => c.status === 'owned').length;
  const totalCount = player.cards.length;
  const teamsText = player.teams.length > 0 ? player.teams.slice(0, 2).join(', ') : '';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{player.name} Cards | Card Tracker</title>
        <meta 
          name="description" 
          content={`View ${player.name}'s ${player.sport} card collection. ${ownedCount} of ${totalCount} cards owned.${teamsText ? ` Teams: ${teamsText}.` : ''} Track and manage your collection.`} 
        />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <ThemeToggle />
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display font-bold text-3xl text-foreground mb-2">
                {player.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <SportBadge sport={player.sport} />
                <TeamPillList teams={player.teams} sport={player.sport} maxVisible={4} size="md" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowEditPlayer(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={() => setShowAddCard(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Summary */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="glass-card p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground mb-1">
                Collection Progress
              </h2>
              <p className="text-sm text-muted-foreground">
                {player.cards.filter(c => c.status === 'owned').length} owned •{' '}
                {player.cards.filter(c => c.status === 'located').length} located •{' '}
                {player.cards.filter(c => c.status === 'missing').length} missing
              </p>
            </div>
            <ProgressDots cards={player.cards} />
          </div>
        </div>

        {/* Card Carousel */}
        <CardCarousel cards={player.cards} />
      </div>

      <AddCardModal
        open={showAddCard}
        onOpenChange={setShowAddCard}
        playerId={player.id}
        playerName={player.name}
        existingCards={player.cards}
      />

      {showEditPlayer && (
        <EditPlayerModal
          open={showEditPlayer}
          onOpenChange={setShowEditPlayer}
          player={player}
        />
      )}
    </div>
  );
}
