const TIERS = [
  { name: "Platinum", min: 500 },
  { name: "Gold", min: 200 },
  { name: "Silver", min: 50 },
  { name: "Bronze", min: 0 },
];

const TIER_INFO = {
  Bronze: { min: 0, label: "Bronze", image: "/images/ranks/bronze.png" },
  Silver: { min: 50, label: "Silver", image: "/images/ranks/silver.png" },
  Gold: { min: 200, label: "Gold", image: "/images/ranks/gold.png" },
  Platinum: { min: 500, label: "Platinum", image: "/images/ranks/platinum.png" },
};

function computeTier(points) {
  const safe = Math.max(0, Math.floor(points || 0));
  for (const t of TIERS) {
    if (safe >= t.min) return t.name;
  }
  return "Bronze";
}

function nextTier(points) {
  const tier = computeTier(points);
  if (tier === "Platinum") return null;
  const order = ["Bronze", "Silver", "Gold", "Platinum"];
  const idx = order.indexOf(tier);
  return order[idx + 1] || null;
}

function pointsToNext(points) {
  const next = nextTier(points);
  if (!next) return 0;
  return Math.max(0, TIER_INFO[next].min - Math.floor(points || 0));
}

function tierInfo(tier) {
  return TIER_INFO[tier] || TIER_INFO.Bronze;
}

module.exports = { TIERS, TIER_INFO, computeTier, nextTier, pointsToNext, tierInfo };
