import { cardMatchesRules } from '@/hooks/useTags';
import { Card, FilterCondition, FilterRules, PlayerWithCards } from '@/types/database';

const TRACKED_SLOT_LABELS = ['Rookie', 'Autographed', 'Base'] as const;

function matchesPlayerCondition(player: PlayerWithCards, condition: FilterCondition): boolean {
  const teams = player.teams.map((team) => team.toLowerCase());

  switch (condition.field) {
    case 'card_team': {
      const value = String(condition.value).toLowerCase();
      if (condition.operator === 'equals') return teams.some((team) => team === value);
      if (condition.operator === 'contains') return teams.some((team) => team.includes(value));
      if (condition.operator === 'in') {
        return Array.isArray(condition.value) && condition.value.some((entry) => teams.some((team) => team === String(entry).toLowerCase()));
      }
      return false;
    }
    case 'sport':
      return condition.operator === 'equals' && player.sport === String(condition.value);
    case 'card_labels':
      return true;
    default:
      return false;
  }
}

export function getRequestedCollectionSlots(rules: FilterRules): string[] {
  const slots = new Set<string>();

  for (const condition of rules.conditions) {
    if (condition.field !== 'card_labels') continue;

    if (condition.operator === 'contains' && typeof condition.value === 'string') {
      const value = condition.value;
      const matchingSlot = TRACKED_SLOT_LABELS.find((slot) => slot.toLowerCase() === value.toLowerCase());
      if (matchingSlot) slots.add(matchingSlot);
    }

    if (condition.operator === 'in' && Array.isArray(condition.value)) {
      for (const value of condition.value) {
        if (typeof value !== 'string') continue;
        const matchingSlot = TRACKED_SLOT_LABELS.find((slot) => slot.toLowerCase() === value.toLowerCase());
        if (matchingSlot) slots.add(matchingSlot);
      }
    }
  }

  return Array.from(slots);
}

export function playerMatchesCollectionScope(player: PlayerWithCards, rules: FilterRules): boolean {
  const results = rules.conditions.map((condition) => matchesPlayerCondition(player, condition));
  return rules.logic === 'and' ? results.every(Boolean) : results.some(Boolean);
}

function createMissingCard(player: PlayerWithCards, slot: string): Card {
  return {
    id: `virtual-${player.id}-${slot.toLowerCase()}`,
    player_id: player.id,
    user_id: player.user_id,
    card_type: slot.toLowerCase() === 'autographed' ? 'autographed' : slot.toLowerCase() === 'rookie' ? 'rookie' : 'regular',
    card_types: slot.toLowerCase() === 'base' ? ['regular'] : [slot.toLowerCase() as 'rookie' | 'autographed'],
    status: 'missing',
    price: null,
    source_url: null,
    notes: null,
    image_url: null,
    brand: null,
    created_at: player.created_at,
    updated_at: player.updated_at,
    is_numbered: false,
    serial_num: null,
    serial_total: null,
    series: null,
    card_labels: [slot],
    image_front: null,
    image_back: null,
    card_year: null,
    card_team: player.teams[0] ?? null,
    seller: null,
    is_favorite: false,
  };
}

export function getSmartCollectionCards(player: PlayerWithCards, rules: FilterRules): Card[] {
  const matchingCards = player.cards.filter((card) => cardMatchesRules(card, rules, player.sport, player.teams));
  const requestedSlots = getRequestedCollectionSlots(rules);

  if (!playerMatchesCollectionScope(player, rules) || requestedSlots.length === 0) {
    return matchingCards;
  }

  const representedSlots = new Set(
    matchingCards.flatMap((card) => card.card_labels ?? []).map((label) => label.toLowerCase())
  );

  const missingCards = requestedSlots
    .filter((slot) => !representedSlots.has(slot.toLowerCase()))
    .map((slot) => createMissingCard(player, slot));

  return [...matchingCards, ...missingCards];
}