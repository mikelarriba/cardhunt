export type SportType = 'football' | 'basketball' | 'baseball' | 'hockey' | 'soccer' | 'golf' | 'tennis' | 'boxing' | 'mma' | 'other';
export type CardType = 'rookie' | 'regular' | 'autographed' | 'rated';
export type CardStatus = 'owned' | 'located' | 'missing';

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface PlayerTag {
  id: string;
  player_id: string;
  tag_id: string;
  created_at: string;
}

export interface Player {
  id: string;
  user_id: string;
  name: string;
  sport: SportType;
  teams: string[];
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  player_id: string;
  user_id: string;
  card_type: CardType;
  card_types: CardType[];
  status: CardStatus;
  price: number | null;
  source_url: string | null;
  notes: string | null;
  image_url: string | null;
  brand: string | null;
  created_at: string;
  updated_at: string;
  // New fields for Card Hunt
  is_numbered: boolean;
  serial_num: number | null;
  serial_total: number | null;
  series: string | null;
  card_labels: string[];
  image_front: string | null;
  image_back: string | null;
}

export interface PlayerWithCards extends Player {
  cards: Card[];
  tags?: Tag[];
}

export const SPORTS: { value: SportType; label: string }[] = [
  { value: 'football', label: 'Football' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'golf', label: 'Golf' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'mma', label: 'MMA' },
  { value: 'other', label: 'Other' },
];

// League logos mapping for major sports
export const LEAGUE_LOGOS: Record<string, string> = {
  basketball: 'https://cdn.ssref.net/req/202501091/tlogo/bbr/NBA-2025.png',
  football: 'https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg',
  baseball: 'https://www.mlbstatic.com/team-logos/league-on-dark/1.svg',
  hockey: 'https://www-league.nhlstatic.com/images/logos/league-dark/133-flat.svg',
};

export const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: 'rookie', label: 'Rookie' },
  { value: 'regular', label: 'Regular' },
  { value: 'autographed', label: 'Autographed' },
  { value: 'rated', label: 'Rated' },
];

export const CARD_STATUSES: { value: CardStatus; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'located', label: 'Located' },
  { value: 'missing', label: 'Missing' },
];

export const CARD_BRANDS = [
  'Panini',
  'Upper Deck',
  'Topps',
] as const;

// Common series/sets
export const CARD_SERIES = [
  'Prizm',
  'Mosaic',
  'Donruss',
  'Select',
  'Optic',
  'Contenders',
  'Chronicles',
  'National Treasures',
  'Immaculate',
  'Flawless',
] as const;

export type CardBrand = typeof CARD_BRANDS[number] | string;

export const POPULAR_TEAMS: Record<SportType, string[]> = {
  football: ['Dallas Cowboys', 'New England Patriots', 'Kansas City Chiefs', 'San Francisco 49ers', 'Green Bay Packers'],
  basketball: ['Los Angeles Lakers', 'Boston Celtics', 'Chicago Bulls', 'Golden State Warriors', 'Miami Heat'],
  baseball: ['New York Yankees', 'Los Angeles Dodgers', 'Boston Red Sox', 'Chicago Cubs', 'Atlanta Braves'],
  hockey: ['Toronto Maple Leafs', 'Montreal Canadiens', 'Boston Bruins', 'New York Rangers', 'Chicago Blackhawks'],
  soccer: ['Manchester United', 'Real Madrid', 'Barcelona', 'Liverpool', 'Bayern Munich'],
  golf: ['PGA Tour', 'LIV Golf', 'European Tour', 'LPGA', 'Champions Tour'],
  tennis: ['ATP Tour', 'WTA Tour', 'Grand Slam', 'Davis Cup', 'Fed Cup'],
  boxing: ['WBC', 'WBA', 'IBF', 'WBO', 'Matchroom'],
  mma: ['UFC', 'Bellator', 'ONE Championship', 'PFL', 'Rizin'],
  other: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
};

// Team colors for fallback logos
export const TEAM_COLORS: Record<string, string> = {
  'Dallas Cowboys': '#003594',
  'New England Patriots': '#002244',
  'Kansas City Chiefs': '#E31837',
  'San Francisco 49ers': '#AA0000',
  'Green Bay Packers': '#203731',
  'Los Angeles Lakers': '#552583',
  'Boston Celtics': '#007A33',
  'Chicago Bulls': '#CE1141',
  'Golden State Warriors': '#1D428A',
  'Miami Heat': '#98002E',
  'New York Yankees': '#003087',
  'Los Angeles Dodgers': '#005A9C',
  'Boston Red Sox': '#BD3039',
  'Chicago Cubs': '#0E3386',
  'Atlanta Braves': '#CE1141',
  'Toronto Maple Leafs': '#00205B',
  'Montreal Canadiens': '#AF1E2D',
  'Boston Bruins': '#FFB81C',
  'New York Rangers': '#0038A8',
  'Chicago Blackhawks': '#CF0A2C',
  'Manchester United': '#DA291C',
  'Real Madrid': '#FEBE10',
  'Barcelona': '#A50044',
  'Liverpool': '#C8102E',
  'Bayern Munich': '#DC052D',
};
