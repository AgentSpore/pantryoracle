# PantryOracle

A no-account web app that answers one anxious kitchen question: **"Is this food still good, or should I toss it?"** — and the follow-ups: has it gone rancid, how long does it really keep, and can I eat it cold.

## Problem

On r/lightbulb people keep asking for exactly this: *"Food known to develop a rancid taste before it becomes unsafe should have a way to check."* People throw out perfectly fine nuts, oils, and flour at the first doubt, or eat rancid food without realizing it. The "tastes off vs. actually dangerous" line is genuinely unclear, and today the only answers are scattered blog listicles. No consumer app owns this.

## Proposed Solution

A fast lookup over a curated food-knowledge dataset. The user types a food (e.g. "walnuts", "olive oil", "cooked rice"), and PantryOracle returns a clear verdict card: shelf life opened vs sealed, the smell/taste signs of rancidity, whether the food is safe-to-eat-cold, and a plain keep-or-toss recommendation. A second flow lets the user describe a symptom ("bitter aftertaste", "sour smell") and get a verdict for a chosen food.

## Proposed Architecture

- **Backend** — FastAPI, layered: `api/` routers, `services/` domain logic (verdict engine, search, symptom matcher), `core/` config + db, `schemas/` Pydantic v2 models, `data/` the curated seed dataset. Storage: aiosqlite, seeded from a JSON/CSV dataset at startup (idempotent upsert). Stdlib + aiosqlite only — no external paid APIs.
- **Frontend** — a single-page React app (Vite + TypeScript + Tailwind) built to static assets and served by FastAPI as `StaticFiles` at `/`. No SSR, no auth, no backend session.
- **Dataset** — ~150–250 common foods seeded from public shelf-life references (USDA/FDA FoodKeeper style). Each row: `name`, `aliases[]`, `category`, `shelf_life` (sealed / opened / fridge / freezer), `rancidity_signs[]`, `cold_safe` (yes/no/depends + note), `toss_rule` (one plain sentence), `sources[]`.

## Data model (sqlite)

`foods(id, name, aliases_json, category, shelf_sealed, shelf_opened, shelf_fridge, shelf_freezer, rancidity_signs_json, cold_safe, cold_note, toss_rule, sources_json)`

## API

- `GET /api/v1/foods?q=<query>` — fuzzy search by name/alias → list of `{id, name, category}` (≤10).
- `GET /api/v1/foods/{id}` — full verdict card object.
- `POST /api/v1/foods/{id}/symptom` — body `{symptom: str}` → `{verdict: "likely rancid"|"probably fine"|"toss to be safe", matched_signs[], explanation}`.
- `GET /api/v1/health` → `{status:"ok"}`.
- All responses are plain serializable dicts. No auth. CORS open.

## UX / UI spec (this is the bar — build to it exactly)

**Design language:** warm, trustworthy, "friendly pantry assistant" — not a clinical database. Calm, confident, zero clutter.

**Design tokens**
- Color: background `#FBF7F0` (warm paper), surface `#FFFFFF`, ink `#1C1A17`, muted `#6B6259`, brand `#E07A3F` (warm amber), keep-green `#3F9D52`, toss-red `#D2483A`, border `#ECE3D6`.
- Typography: headings `"Fraunces", serif` (warm, editorial); body `"Inter", system-ui, sans-serif`. Self-host woff2 or use a CDN link. Sizes: hero 40/48, h2 24/32, body 16/26, caption 13/18.
- Radius 14px on cards, 10px on inputs/buttons. Soft shadow `0 6px 24px rgba(28,26,23,.08)`. Generous spacing (8-pt scale).

**Screens / states**
1. **Home** — centered hero: serif headline "Is it still good?", one-line subhead, a large rounded search input with a magnifier icon and placeholder "walnuts, olive oil, cooked rice…". Below: 6–8 tappable example chips. Calm warm-paper background. Footer disclaimer line (small, muted): "Guidance only — when in real doubt, throw it out. Not medical advice."
2. **Search results** — live dropdown under the input as the user types (debounced 200ms), each row = food name + small category tag. Keyboard navigable (↑/↓/Enter). Empty query → show example chips, not a blank box.
3. **Verdict card** — the centerpiece. Big food name (serif). A prominent **verdict pill** at top: green "Keep" / amber "Check it" / red "Toss" with an icon. Then a clean 2-column (1 on mobile) detail grid: Shelf life (sealed/opened/fridge/freezer as labeled rows), Signs it's gone (bulleted rancidity signs), Eat cold? (yes/no/depends + note), Bottom-line rule (one bold sentence in a tinted callout). A "Check a symptom" expander reveals a small input → posts symptom → shows verdict inline with a colored result strip. Sources shown as small muted links at the bottom.
4. **Loading** — skeleton shimmer on the card, never a spinner-only blank.
5. **Not found** — friendly empty state with the pantry mascot vibe (an emoji is fine), "We don't have that one yet" + the nearest 3 suggestions.

**Interaction quality**
- Smooth 150–200ms transitions on card mount and verdict-pill color. Input has a clear focus ring in brand amber. Fully responsive 360px→1280px; the verdict card is single-column and thumb-reachable on mobile. Respects `prefers-reduced-motion`. Color is never the only signal — every verdict pill also has an icon + text label (a11y). Lighthouse a11y ≥ 95.

## Success Criteria

- `GET /api/v1/foods?q=oil` returns relevant matches; `GET /api/v1/foods/{id}` returns a complete verdict card for at least 150 seeded foods.
- The symptom endpoint returns a sensible verdict for at least the common rancidity signs (bitter, sour, soapy, paint-like, musty).
- The frontend is a genuinely polished single page implementing the UX spec above — verdict pills, detail grid, live search, skeleton loading, responsive, accessible — not a raw JSON page or an unstyled form.
- No account, no external paid API, runs from a single `uvicorn` process serving both API and built frontend. `GET /api/v1/health` returns 200.
- Clear "guidance only, not medical advice" disclaimer is visible.
