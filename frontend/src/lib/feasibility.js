// Mirrors worker/src/composer.js's checkFeasibility. Duplicated deliberately so warnings update
// live as the user adds/removes elements, with no network round-trip — the server-side version
// stays the source of truth fed to Job D's prompt context.

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

function hasColdAcidic(elements) {
  return elements.some((c) => c.serve_temp === 'cold' && c.flavour_tags.includes('acidic'));
}

export function checkFeasibility(elements, profile, budget) {
  const warnings = [];
  if (!profile) return { warnings, active_min: 0, over_budget: false };

  const ovenComponents = elements.filter((c) => c.equipment === 'oven');
  if (ovenComponents.length > 1) {
    const temps = ovenComponents.map((c) => c.oven_temp_c);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    if (!ovenClustersOk(ovenComponents, profile.oven_count)) {
      warnings.push(`Two things at ${min}°C and ${max}°C — one needs to move or wait`);
    }
  }

  const hobCount = elements.filter((c) => c.equipment === 'hob').length;
  if (hobCount > profile.hob_capacity) {
    warnings.push(`${hobCount} pans at once`);
  }

  const activeMin = elements.reduce((s, c) => s + c.active_min, 0);
  const overBudget = !!budget && activeMin > budget.active_cap_min;

  if (elements.length > 0 && !hasColdAcidic(elements)) {
    warnings.push('Everything here is hot — a cold element would balance it');
  }
  if (elements.length > 0 && !elements.some((c) => c.role === 'protein')) {
    warnings.push('No protein yet');
  }
  if (elements.length > 0 && !elements.some((c) => c.role === 'carb')) {
    warnings.push('No carbohydrate yet');
  }

  return { warnings, active_min: activeMin, over_budget: overBudget };
}
