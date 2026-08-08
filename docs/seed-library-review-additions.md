# Seed library additions — candidates (Job A output)

Run of Job A (`docs/prompts-v2.md`) targeting the contrast rule's weak point: the 10 veg
ingredients flagged in `docs/seed-library-review.md` as having **no cold or raw preparation**
(broccoli, mushroom, green beans, peas, leek, kale, sugar snap peas, sweetcorn, aubergine,
asparagus). One new cold/raw component per ingredient, so the addition is spread across all of
them rather than piling onto a few.

Status for all 10: `candidate`, source `llm`. **Nothing here is inserted anywhere** — no SQL, no
DB changes. Same fields as the seed review, plus a one-line "why" per Job A's own output schema,
since that's what's needed to approve or bin each one.

All obey the dietary rules: no onion, no raw/powdered garlic, nothing spicy, no cooked tomato,
lactose-free. No duplicates of existing `(ingredient, technique)` pairs.

---

### asparagus
- **raw shaved asparagus salad with lemon** — raw · none · 8/0 min · cold · acidic, fresh
  *why: asparagus currently only exists grilled; shaving it raw and thin keeps it tender enough to eat uncooked.*

### aubergine — ⚠ flagged, read before approving
- **charred aubergine salad with lemon and herbs** — char · hob · 10/15 min · **room** (not cold) · acidic, umami, herbal
  *why: raw aubergine isn't edible, so a genuine cold/raw prep doesn't exist for this ingredient — this is the honest next-best: charred quickly, dressed while warm, and rested so it's serve-cool by the time the rest of the plate is ready. Flagging rather than mislabelling it "cold": it should not be counted toward the plate's cold+acidic requirement unless you're comfortable treating room-temp as satisfying that rule. Consider cutting this one if you'd rather leave aubergine without a cold option than stretch the definition.*

### broccoli
- **raw shredded broccoli and apple salad** — raw · none · 10/0 min · cold · acidic, sweet, fresh
  *why: broccoli has three hot preparations already and nothing raw; shredded fine with apple it reads as slaw, not "undercooked broccoli."*

### green beans
- **quick-pickled green beans** — quick-pickle · none · 8/15 min · cold · acidic, fresh
  *why: raw green beans are too fibrous straight-up, so this gets a brief blanch before the quick-pickle rather than being fully raw — flagging that in case you want technique renamed for accuracy.*

### kale
- **raw massaged kale salad with lemon** — raw · none · 10/0 min · cold · acidic, fresh
  *why: standard fix for kale's toughness — massaging with lemon and salt breaks it down enough to eat raw and cold, no cooking needed.*

### leek
- **quick-pickled leek ribbons** — quick-pickle · none · 8/15 min · cold · acidic, fresh
  *why: raw leek is too pungent on its own; quick-pickling mellows it into something bright rather than sharp.*

### mushroom
- **raw shaved mushroom salad with lemon** — raw · none · 10/0 min · cold · acidic, umami, fresh
  *why: thin-shaved firm mushroom eaten raw with lemon is a genuine, simple prep — not a novelty — and gives mushroom a non-hot option for the first time.*

### peas
- **smashed raw pea salad with mint and lemon** — raw · none · 8/0 min · cold · acidic, sweet, fresh, herbal
  *why: uses fresh or lightly thawed peas, lightly crushed — no cooking. Pairs the sweet/cold contrast the plate rule wants with almost no active time.*

### sugar snap peas
- **raw sugar snap pea salad with lemon and mint** — raw · none · 8/0 min · cold · acidic, sweet, fresh
  *why: sugar snaps are commonly eaten raw already; this just dresses them instead of leaving pan-frying as the only option.*

### sweetcorn
- **raw sweetcorn and herb salad** — raw · none · 8/0 min · cold · acidic, sweet, fresh
  *why: kernels cut straight off very fresh corn are sweet and crisp raw — no char needed for this one to work as a plate element.*

---

## Summary

9 of 10 are straightforwardly cold + acidic and would raise the library's cold/acidic count from
15 to 24 if all are approved. The 10th (aubergine) is the one genuine gap: flagged above rather
than force-fit, since honest failure here beats a technically-cold entry that isn't really one.

Waiting for your approve/cut decisions before any of this becomes a migration.
