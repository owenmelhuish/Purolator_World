# Case-Study Worlds — Build Plan

The Purolator story's final act: after Chapter 6 the presenter continues into
three client "utopia" worlds PUSH + STRATIS have already built — Choice Hotels
Canada, Humber Polytechnic, CIRA — each its own small planet in the same design
language, connected by fly-through-the-clouds transitions. The loop closes by
returning to the Purolator world ("your world is next").

## Architecture

- **Pages:** `choice.html`, `humber.html`, `cira.html` alongside `index.html`
  (multi-page vite build). Purolator `main.js` untouched except the Chapter 6
  handoff button.
- **Engine:** `src/engine.js` — the Purolator page's runtime (renderer, lights,
  sky/halo/haze/fog, globe+ocean, drag/pan/zoom controller, pins, tour UI,
  layout editor, traffic/train helpers) parameterized by a `theme`. Worlds are
  `build(ctx)` functions + POI chapter lists.
- **Transitions:** `src/transition.js` — `flyToWorld()` climbs into a cloud
  field and whites out into the next page; arriving pages with `?story` dive
  in through clouds and auto-open Chapter 1.
- **Layouts:** per-world `src/layout-<world>.json` via `/__layout?world=` —
  the `?edit` editor works on every page.
- **Shared kit:** `src/worlds/props.js` — art billboards (custom canvas
  campaign creative), screen towers, mountains, conifers/maples, lighthouse,
  pool, flags, bus/streetcar/car/camper, spotlight rigs.

Handoff chain: Purolator ch.6 → **Choice** → **Humber** → **CIRA** → back to
Purolator ("Your world is next").

## World 1 — Choice Hotels Canada (`choice.html`)

**Feel:** golden-hour Canadian travel utopia. Warm cream land, lake-blue
water, everything accented in Choice orange/gold. Slide source: "Creating
demand through persona targeting… ROAS 10x+".

- Palette (provisional until research lands): orange `#EF7622`, gold
  `#F7B418`, deep brown-ink `#40332B`, cream land `#f4eee2`.
- Landmarks: hero hilltop resort + pool; a "brand row" of sub-brand hotels
  (Comfort, Quality, Econo Lodge, Sleep Inn, Clarion, MainStay); Rockies
  mountain terrace + ski lodge + conifers; Muskoka dock + cottages on a lake;
  Maritimes lighthouse coast; highway rest stop; Choice Privileges rewards
  pavilion; ROAS 10x+ proof monument.
- Billboards (canvas recreations of the real ads, EN + FR): "SAVE ON HOTELS.
  SPLURGE ON WHAT MATTERS — BOOK NOW", "TRAVEL SMARTER AND EARN MORE WITH
  CHOICE PRIVILEGES", "Nos salles de réunions scelleront l'accord — RÉSERVER
  DIRECTEMENT", "EXPLORE BY DAY. REST COMFORTABLY BY NIGHT.", "REWARDS ARE A
  DOWNLOAD AWAY — INSTALL NOW".
- Traffic: roadtrip cars + campers, wrapped shuttle bus, floatplane optional.
- Chapters: 1 The Partnership · 2 Every Traveller, A Persona · 3 Creative That
  Matches the Moment · 4 The Loyalty Loop (Privileges) · 5 ROAS 10x+ → Humber.

## World 2 — Humber Polytechnic (`humber.html`)

**Feel:** a city-campus at golden dusk — cool white world, navy/gold
institutional accents, the campaign's black-stage + twin-spotlight + ice-blue
stacked type as hero moments. Slide source: "Brand relaunch — impact that
created action… +3% enrollment in a category down 10%".

- Palette (verified): navy `#041E42`, gold `#CC9900`, purple `#5C068C`,
  ice-type steels `#6E7D9E → #BFC6D8`, stage black.
- Landmarks: North Campus (glass LRC + rounded Barrett CTI + quad full of
  students); **campaign stage** — black plaza, twin sweeping spotlights, giant
  stacked translucent ice-type THE YOU / YOU KNEW / WAS IN YOU; downtown
  screen-corner (Sankofa Square cue) with campaign screens; Lakeshore
  red-brick heritage cottages on the waterfront; Hawks field (blue/gold);
  spotlight vignettes (pianist at a grand piano, nurse, welder); data
  pavilion (real-time dashboards); +3% proof monument.
- Transit: campaign-wrapped articulated streetcar on a rail loop, wrapped
  buses on the ring roads.
- Chapters: 1 Builders of Brilliance (the relaunch) · 2 The You You Knew Was
  In You (the campaign) · 3 Everywhere the City Looks (the media) · 4 Signals
  In, Decisions Out (dashboards/tracking) · 5 +3% Enrollment → CIRA.

## World 3 — CIRA (`cira.html`)

**Feel:** Canadiana internet utopia. Paper-white world with Maple Leaf Red,
fall maples in Prairie Gold/red, buffalo-plaid plazas, northern lights.
Slide source: "Technology & Digital Infrastructure… +66% unaided recall
among SMEs".

- Palette (verified): Maple Leaf Red `#AA1E3A` (+ accent `#BA2241`, dark
  `#7E0E27`), Maritime Blue `#2479BA`/navy `#0C1C2B`, Prairie Gold `#DEDAB7`/
  `#9E8E56`, Tofino Green `#676F3F`; official red/black buffalo plaid.
- Landmarks: giant **.CA monument** (red dot + built-up letters); **Bernard
  the goose** statue on a plaid plaza; CIRA HQ (Ottawa cue) with connected-c
  tile; **Canadian Shield** dome protecting a neighbourhood; .CA registry data
  centre (3.4M domains); IXP node stations linked by glowing red data arcs
  (traffic stays in Canada); Net Good northern community with connectivity
  mast; +66% proof monument. A goose V-formation circles the globe instead of
  the plane.
- Billboards: goose-on-plaid "HONK IF YOU CHOOSE .CA", "CHOOSE SUCCESS.
  CHOOSE .CA", "85% of Canadians prefer a .CA", ".ca by cira" end-card,
  Spotify/Dragons' Den media cards.
- Chapters: 1 A Trusted Internet for Canadians · 2 Choose Success, Choose .CA
  (the goose) · 3 Every Channel, Every Province (the media) · 4 The
  Infrastructure of Canadian Internet · 5 +66% Unaided Recall → back to the
  Purolator world ("Your world is next").

## Verification

Screenshot every chapter of every world headless (`?view` + `?story`
click-through), check transitions end-to-end, then commit.
