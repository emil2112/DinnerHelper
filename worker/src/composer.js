// Rules-engine composer (brief §3). Pure code, no LLM call anywhere in this file.
//
// Phase 2 scope note: times_cooked / last_cooked_at / rating_score are NOT used for scoring
// here even though §3 lists novelty/recency/rating rules — the brief's own phase plan (§5,
// Phase 4) wires those into scoring only once meal logging exists. Before that, every seeded
// component has times_cooked = 0, so a "never more than one unmade component" hard filter would
// reject almost every plate on a fresh library. Scoring below only uses signals that are
// meaningful without cook history: contrast, passive time, season, suggestion recency (via the
// `suggestions` table, which this module does start populating), and texture variety.
//
// docs/phase-2-revision.md superseded §3/§4/§7: the plate is now user-built, so `composePlate`
// below (the from-zero, lock/reroll full-plate search) is no longer called by any route — it's
// kept, unused, per that doc's explicit "don't delete it" instruction. What the app actually
// calls now is `rankLibraryCandidates` (library half of the suggestion panel — same scoring,
// applied to "what would complete THIS plate" instead of "build a plate from nothing") and
// `checkFeasibility` (the same hard filters, downgraded from filters to advisory warnings).

const SCORE = {
  COLD_ACIDIC: 10,
  HIGH_PASSIVE: 5,
  SEASON_MATCH: 3,
  SUGGESTION_RECENCY_PENALTY: 5,
  TEXTURE_REPEAT_PENALTY: 2,
};

function deriveTemplate(energy, profile) {
  const base = JSON.parse(profile.default_role_template);
  if (energy !== 'low') return base;
  const idx = base.lastIndexOf('veg');
  return [...base.slice(0, idx), ...base.slice(idx + 1)];
}

// All simultaneous oven components must cluster into groups no wider than 20°C, and the
// number of clusters can't exceed how many ovens the household has.
function ovenClustersOk(ovenComponents, ovenCount) {
  if (ovenComponents.length <= 1) return true;
  const temps = ovenComponents.map((c) => c.oven_temp_c).sort((a, b) => a - b);
  let clusters = 1;
  let clusterMin = temps[0];
  for (let i = 1; i < temps.length; i++) {
    if (temps[i] - clusterMin > 20) {
      clusters++;
      clusterMin = temps[i];
    }
  }
  return clusters <= ovenCount;
}

function passesHardFilters(combo, profile, budget) {
  const activeSum = combo.reduce((s, c) => s + c.active_min, 0);
  if (activeSum > budget.active_cap_min) return false;

  const ovenComponents = combo.filter((c) => c.equipment === 'oven');
  if (!ovenClustersOk(ovenComponents, profile.oven_count)) return false;

  const hobCount = combo.filter((c) => c.equipment === 'hob').length;
  if (hobCount > profile.hob_capacity) return false;

  return true;
}

function hasColdAcidic(combo) {
  return combo.some((c) => c.serve_temp === 'cold' && c.flavour_tags.includes('acidic'));
}

function hasHighPassive(combo) {
  return combo.some((c) => c.passive_min > 20);
}

function seasonBonus(combo, month) {
  return combo.reduce(
    (s, c) => s + (c.season_months.length && c.season_months.includes(month) ? SCORE.SEASON_MATCH : 0),
    0
  );
}

function suggestionPenalty(combo, recentIds) {
  return combo.reduce((s, c) => s + (recentIds.has(c.id) ? SCORE.SUGGESTION_RECENCY_PENALTY : 0), 0);
}

function textureVarietyPenalty(combo) {
  const counts = {};
  for (const c of combo) {
    const dominant = c.texture_tags[0];
    if (!dominant) continue;
    counts[dominant] = (counts[dominant] || 0) + 1;
  }
  return Object.values(counts).some((n) => n >= 3) ? SCORE.TEXTURE_REPEAT_PENALTY : 0;
}

function scoreCombo(combo, month, recentIds) {
  let score = 0;
  if (hasColdAcidic(combo)) score += SCORE.COLD_ACIDIC;
  if (hasHighPassive(combo)) score += SCORE.HIGH_PASSIVE;
  score += seasonBonus(combo, month);
  score -= suggestionPenalty(combo, recentIds);
  score -= textureVarietyPenalty(combo);
  return score;
}

function pairCombos(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) out.push([list[i], list[j]]);
  }
  return out;
}

export function energyBudget(energy, profile) {
  const budgets = JSON.parse(profile.energy_budgets);
  return budgets[energy];
}

// Library half of the suggestion panel. Ranks approved components not already on the plate by
// how much they'd add to it — scoring the plate-plus-candidate combo means a second cold+acidic
// item scores no higher than the first (hasColdAcidic is a presence check), which correctly
// favours variety over piling onto a rule that's already satisfied.
//
// scoreCombo alone isn't enough here: it has no notion of role balance, because in the old
// slot-based composer role coverage was enforced by construction (exactly 1 protein/1 carb/2 veg
// slots), never scored. With slots gone, without an explicit signal every candidate that ties on
// the boolean rules (cold+acidic already satisfied, high-passive already satisfied, etc.) falls
// back to array order — which meant "suggest another protein" outranked everything once one
// protein was already on the plate. ROLE_GAP_BONUS fixes that: a role missing from the plate
// outranks a role that's already covered, without forbidding intentional duplicates (two
// proteins is a legitimate plate now, just not the default suggestion).
const ROLE_GAP_BONUS = 8;

export function rankLibraryCandidates({ components, plateComponents, month, recentIds, limit = 6 }) {
  const usedIds = new Set(plateComponents.map((c) => c.id));
  const rolesPresent = new Set(plateComponents.map((c) => c.role));
  return components
    .filter((c) => !usedIds.has(c.id))
    .map((c) => {
      let score = scoreCombo([...plateComponents, c], month, recentIds);
      if (!rolesPresent.has(c.role)) score += ROLE_GAP_BONUS;
      return { component: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.component);
}

// Same hard filters as passesHardFilters/ovenClustersOk, downgraded to advisory text. Nothing
// here blocks anything — the plate is always whatever the user built.
export function checkFeasibility(plateComponents, profile, budget) {
  const warnings = [];

  const ovenComponents = plateComponents.filter((c) => c.equipment === 'oven');
  if (ovenComponents.length > 1) {
    const temps = ovenComponents.map((c) => c.oven_temp_c);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    if (!ovenClustersOk(ovenComponents, profile.oven_count)) {
      warnings.push(`Two things at ${min}°C and ${max}°C — one needs to move or wait`);
    }
  }

  const hobCount = plateComponents.filter((c) => c.equipment === 'hob').length;
  if (hobCount > profile.hob_capacity) {
    warnings.push(`${hobCount} pans at once`);
  }

  const activeSum = plateComponents.reduce((s, c) => s + c.active_min, 0);
  const overBudget = !!budget && activeSum > budget.active_cap_min;

  if (plateComponents.length > 0 && !hasColdAcidic(plateComponents)) {
    warnings.push('Everything here is hot — a cold element would balance it');
  }
  if (plateComponents.length > 0 && !plateComponents.some((c) => c.role === 'protein')) {
    warnings.push('No protein yet');
  }
  if (plateComponents.length > 0 && !plateComponents.some((c) => c.role === 'carb')) {
    warnings.push('No carbohydrate yet');
  }

  return { warnings, active_min: activeSum, over_budget: overBudget };
}

// Input: approved components, profile, energy level, locked slots ([{slot_index, component_id}]),
// current month (1-12), and the set of component ids shown in recent suggestions.
// Output: the best-scoring plate that survives every hard filter, plus precomputed alternates
// per unlocked slot (fixing every other slot to the winning plate) so reroll never has to call
// back into this function — cycling the precomputed list client-side is what makes it instant.
export function composePlate({ components, profile, energy, locked = [], month, recentIds }) {
  const template = deriveTemplate(energy, profile);
  const budget = energyBudget(energy, profile);

  const byRole = { protein: [], carb: [], veg: [] };
  for (const c of components) byRole[c.role]?.push(c);

  const lockedMap = new Map(locked.map((l) => [l.slot_index, l.component_id]));
  const lockedComponents = template.map((_role, idx) => {
    const id = lockedMap.get(idx);
    if (id == null) return null;
    return components.find((c) => c.id === id) || null;
  });
  const usedLockedIds = new Set(lockedComponents.filter(Boolean).map((c) => c.id));

  const freeSlotIndices = template.map((_role, i) => i).filter((i) => !lockedComponents[i]);
  const roleToFreeSlots = {};
  for (const i of freeSlotIndices) (roleToFreeSlots[template[i]] ??= []).push(i);

  const proteinSlots = roleToFreeSlots.protein || [];
  const carbSlots = roleToFreeSlots.carb || [];
  const vegSlots = roleToFreeSlots.veg || [];

  const proteinChoices = proteinSlots.length
    ? byRole.protein.filter((c) => !usedLockedIds.has(c.id))
    : [null];
  const carbChoices = carbSlots.length ? byRole.carb.filter((c) => !usedLockedIds.has(c.id)) : [null];
  const vegPool = byRole.veg.filter((c) => !usedLockedIds.has(c.id));
  const vegCombos =
    vegSlots.length === 2 ? pairCombos(vegPool) : vegSlots.length === 1 ? vegPool.map((c) => [c]) : [[]];

  let best = null;
  let bestScore = -Infinity;

  for (const p of proteinChoices) {
    for (const cb of carbChoices) {
      for (const vegCombo of vegCombos) {
        const filled = [...lockedComponents];
        if (p) filled[proteinSlots[0]] = p;
        if (cb) filled[carbSlots[0]] = cb;
        vegSlots.forEach((slotIdx, i) => {
          filled[slotIdx] = vegCombo[i];
        });
        if (filled.some((c) => !c)) continue;
        if (!passesHardFilters(filled, profile, budget)) continue;

        const s = scoreCombo(filled, month, recentIds);
        if (s > bestScore) {
          bestScore = s;
          best = filled;
        }
      }
    }
  }

  if (!best) return null;

  const alternates = {};
  for (const idx of freeSlotIndices) {
    const role = template[idx];
    const others = best.filter((_c, i) => i !== idx);
    const usedIds = new Set(others.map((c) => c.id));
    const pool = byRole[role].filter((c) => !usedIds.has(c.id) && c.id !== best[idx].id);

    const scored = pool
      .map((c) => {
        const trial = [...best];
        trial[idx] = c;
        if (!passesHardFilters(trial, profile, budget)) return null;
        return { c, s: scoreCombo(trial, month, recentIds) };
      })
      .filter(Boolean)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map(({ c }) => c);

    alternates[idx] = scored;
  }

  return {
    energy,
    total_active_min: best.reduce((s, c) => s + c.active_min, 0),
    plate: best.map((c, i) => ({
      slot_index: i,
      role: template[i],
      locked: lockedMap.has(i),
      component: c,
    })),
    alternates,
  };
}
