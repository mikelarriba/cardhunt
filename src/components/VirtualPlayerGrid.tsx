import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PlayerWithCards } from '@/types/database';
import { PlayerCard } from './PlayerCard';
import { CompactPlayerCard } from './CompactPlayerCard';

interface VirtualPlayerGridProps {
  players: PlayerWithCards[];
  viewMode: 'grid' | 'compact';
}

function useColumns(viewMode: 'grid' | 'compact') {
  // Match the tailwind breakpoints
  const getColumns = useMemo(() => {
    if (typeof window === 'undefined') return viewMode === 'compact' ? 3 : 2;
    const w = window.innerWidth;
    if (viewMode === 'compact') {
      if (w >= 1280) return 6;
      if (w >= 1024) return 5;
      if (w >= 768) return 4;
      if (w >= 640) return 3;
      return 2;
    }
    if (w >= 1024) return 3;
    if (w >= 768) return 2;
    return 1;
  }, [viewMode]);
  return getColumns;
}

export function VirtualPlayerGrid({ players, viewMode }: VirtualPlayerGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useColumns(viewMode);

  const rows = useMemo(() => {
    const result: PlayerWithCards[][] = [];
    for (let i = 0; i < players.length; i += columns) {
      result.push(players.slice(i, i + columns));
    }
    return result;
  }, [players, columns]);

  const estimateSize = viewMode === 'compact' ? 220 : 480;
  const gap = viewMode === 'compact' ? 12 : 16;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize + gap,
    overscan: 3,
  });

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto"
      style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size - gap}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className={
                  viewMode === 'compact'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                }
              >
                {row.map((player) =>
                  viewMode === 'compact' ? (
                    <CompactPlayerCard key={player.id} player={player} />
                  ) : (
                    <PlayerCard key={player.id} player={player} />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
