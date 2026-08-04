export const RANK_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export const RANKS = {
  Bronze: { label: 'Bronze', image: '/images/ranks/bronze.png', color: '#B0703B', next: 'Silver', nextMin: 50 },
  Silver: { label: 'Silver', image: '/images/ranks/silver.png', color: '#949BA5', next: 'Gold', nextMin: 200 },
  Gold: { label: 'Gold', image: '/images/ranks/gold.png', color: '#D69E2E', next: 'Platinum', nextMin: 500 },
  Platinum: { label: 'Platinum', image: '/images/ranks/platinum.png', color: '#7E5BE2', next: null, nextMin: null },
};

export function rankInfo(tier) {
  return RANKS[tier] || RANKS.Bronze;
}

export function nextTier(tier) {
  return rankInfo(tier).next;
}

export function pointsToNextTier(tier, points) {
  const info = rankInfo(tier);
  if (!info.nextMin) return 0;
  return Math.max(0, info.nextMin - (points || 0));
}

export function tierProgress(points) {
  if (!points) return 0;
  if (points >= 500) return 100;
  const lower = points >= 200 ? 200 : points >= 50 ? 50 : 0;
  const upper = points >= 200 ? 500 : points >= 50 ? 200 : 50;
  return Math.max(0, Math.min(100, ((points - lower) / (upper - lower)) * 100));
}
