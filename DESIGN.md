---
name: Thanapon Pruektan Portfolio
description: One business document that posts: an SAP ALV grid in cobalt and sheet grey, with status lights, depth numbering, one stamp and one clock.
colors:
  cobalt: "#0a5fc4"
  cobalt-deep: "#07448f"
  cobalt-tint: "#e1ebf9"
  sheet: "#f2f4f7"
  head: "#e6eaf0"
  paper: "#ffffff"
  rule: "#c4ccd6"
  rule-strong: "#98a5b6"
  ink: "#0b1624"
  ink-soft: "#44546a"
  on-cobalt-soft: "#dbe8fa"
  posted-green: "#17a05d"
  posted-green-ink: "#0e7a44"
  process-amber: "#f2b01e"
  process-amber-ink: "#8a5a00"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 9.2vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Semi Condensed, Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.4vw, 2.7rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Barlow Semi Condensed, Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.22rem"
    fontWeight: 600
    lineHeight: 1.18
  body:
    fontFamily: "Barlow Semi Condensed, Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow Semi Condensed, Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.07em"
  mono:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
rounded:
  none: "0"
  light: "50%"
spacing:
  gutter: "72px"
  gutter-narrow: "44px"
  pad: "clamp(16px, 4vw, 56px)"
  bar: "56px"
  indent: "28px"
components:
  system-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    height: "56px"
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cobalt-deep}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 20px"
  button-outline-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cobalt-deep}"
  tag:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 7px"
  tag-selected:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
  record-row:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    padding: "15px 8px 15px 28px"
  record-open:
    backgroundColor: "{colors.cobalt-tint}"
  grid-head:
    backgroundColor: "{colors.head}"
    textColor: "{colors.ink-soft}"
    padding: "9px 12px"
  flow-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "22px 14px 12px"
  stamp:
    textColor: "{colors.posted-green-ink}"
    rounded: "{rounded.none}"
---

# Design System: Thanapon Pruektan Portfolio

## Overview

**Creative North Star: "Document Flow"**

The portfolio is one business document that posts. It borrows the look of an SAP ALV grid: a cobalt header field, a pale sheet (#f2f4f7) ruled with 1px hard lines, dense numbered rows with column heads, tabular numerals, and two status lights (posted green, in-process amber). Every project is a numbered record in a tree (1, 1.1, 1.1.2), so a career reads as a connected system, not a card grid.

The page has exactly one tilted element, the green POSTED stamp, and exactly one clock: the six flow cells (Receive, Pick, Reconcile, Label, Pay, Support) post one by one, driven by scroll on wide windows (the scrollbar is the clock) and by a timer elsewhere. Everything else is axis-aligned, flat and ruled. Density is high and calm; there is no ornament that is not a record, a rule, a light or a number.

A Three.js layer extends the same world into depth without changing its vocabulary: a hero warehouse whose conveyor and gate lights follow the flow state, a rack of 20 crates in the profile, and a pallet that fills in the contact section. Scene geometry is built from boxes and edge lines in the cobalt family; green and amber appear only as status.

**Key Characteristics:**
- Cobalt field for the header band, hero and contact; sheet grey for everything between.
- 1px hard rules, 2px ink rules at table tops and group heads; square corners everywhere except the round status lights.
- Depth numbering in Martian Mono down a single vertical axis (72px gutter, 44px on narrow screens).
- Green and amber are status only. Ink #0b1624 is text and the heavy rules.
- One stamp, one clock, one 3D layer tied to the same flow state.

## Colors

A single saturated cobalt on cool sheet greys, with two traffic-light status colors and nothing else.

### Primary
- **Cobalt** (#0a5fc4): the hero field, contact band, wordmark block, selected tags and chips, focus outline, scrollbar thumb, record cursor.
- **Deep Cobalt** (#07448f): text on white buttons and hovered buttons, current record number, and the hero field's end state (the field blends from cobalt toward deep cobalt by 70% as the hero scrubs).
- **Cobalt Tint** (#e1ebf9): open-record and hovered-cell wash.

### Secondary
- **Posted Green** (#17a05d), with ink **#0e7a44**: posted status light, flow progress line, the POSTED stamp (ink variant).
- **Process Amber** (#f2b01e), with ink **#8a5a00**: in-process status light and its state text.

### Neutral
- **Sheet** (#f2f4f7): page ground. **Head** (#e6eaf0): column heads, group heads, strip labels. **Paper** (#ffffff): table bodies, tags, flow cells.
- **Rule** (#c4ccd6): row dividers. **Strong Rule** (#98a5b6): control borders and flow baseline.
- **Ink** (#0b1624): body text, system bar, footer, heavy rules. **Soft Ink** (#44546a): secondary text. **On-Cobalt Soft** (#dbe8fa): secondary text on cobalt.

### Named Rules
**The Two Lights Rule.** Green means posted, amber means in process. Neither is ever used as decoration or as an accent on interactive controls.
**The One Cobalt Rule.** Cobalt is the only chromatic brand color; tints are cobalt-tint or the lighter scene blues inside the 3D layer. No second hue enters the palette.

## Typography

**Display and body font:** Barlow Semi Condensed (fallbacks Sarabun, system sans). **Thai voice:** Sarabun. **Mono:** Martian Mono, used only for record keys, depth numbers, counts and measured figures, always with tabular numerals.

**Character:** a condensed grotesque with the compressed authority of a form header, set against a quiet monospaced ledger voice.

### Hierarchy
- **Display** (700, clamp(3rem, 9.2vw, 6rem), 0.94, -0.02em): the name in the hero only.
- **Headline** (600, clamp(2rem, 3.4vw, 2.7rem), 1.05): section headings.
- **Title** (600, 1.22rem to 2rem, 1.1 to 1.18): record names, group heads (clamp(1.5rem, 2.4vw, 2rem)), flow-cell names (1.28rem).
- **Body** (400, 1.0625rem, 1.5): running text; leads cap at 58 to 74ch, record summaries at 76ch.
- **Label** (600, 0.75rem, 0.07em, uppercase): table column heads and the ticker only, where the ALV grid itself uses heads. Not a free-standing section lead-in.
- **Mono** (400, 0.72rem, 1.45): record keys, depth numbers, counts, stamp-adjacent data.

### Named Rules
**The Ledger Numerals Rule.** Anything measured or numbered is tabular (tabular-nums); only keys and figures use Martian Mono.
**The Thai Opening Rule.** On the TH page body is 1.125rem at 1.7 line height, labels lose uppercase and letter-spacing, and headings open to 1.3 to 1.4 line height so Thai marks are not clipped.

## Layout

One vertical document axis: a 1px ink rule at the right edge of the 72px number gutter (44px under 760px), with 10px square ink nodes where headings and group heads attach. Sections sit in a 1360px max container with fluid side padding (clamp(16px, 4vw, 56px)) and a 28px indent off the axis (16px under 760px). Records are rows on a five-column grid (name, type, summary, stack, chevron) that drops stack at 1040px and collapses to a name/summary/type stack at 760px. The flow strip is six equal cells that become a vertical list with a left progress line under 980px.

The hero fills the viewport under a 56px sticky bar: cobalt field above, flow strip below. On wide windows the hero pins and scrubs for 150vh of scroll; reduced-motion and narrow windows skip pinning and show the completed state. Spacing is mostly clamp-based section padding (48px to 92px) with tight row padding (11px to 22px); there is no fixed spacing scale beyond the values in the tokens.

## Elevation & Depth

Flat. There are no box-shadows. Depth is stated by ruling (1px, 2px ink), tonal steps (sheet, head, paper, cobalt tint), the open-record detail panel dropping onto paper, a 3px cobalt current-record marker, and the real depth in the Three.js scenes. The only transform-based lift is the hero attachment frame drifting 34px up as the hero scrubs, and the hover nudge of 3px on chevrons.

### Named Rules
**The Flat Ledger Rule.** Surfaces stay flat at rest and on hover; state is shown by color swap (white to ink, cobalt to white) or rule weight, never by shadow.

## Shapes

Square. Buttons, tags, chips, inputs, frames, cells, tables and the stamp all have 0 radius. The only circles are the 12px and 14px status lights. The stamp is the single rotated form (-3.5deg), a 3px double-ruled box roughened by an SVG turbulence filter. Borders are 1px for rules and controls, 2px for outline buttons, group heads and table tops.

## Components

### System bar
56px ink bar, sticky. Cobalt square wordmark block at left, a segmented EN/TH toggle (selected segment fills cobalt), and bar links that invert to white on hover. Brand text hides under 760px.

### Buttons
- **Shape:** square, 52px high (48px under 760px, full width), 2px border.
- **Primary:** white fill, deep cobalt text. Hover inverts to ink fill, white text.
- **Outline:** transparent on cobalt with a 2px translucent-white border. Hover fills white with deep cobalt text.
- **Transitions:** 0.18s on a long ease-out; active presses 1px down.

### Tags and chips
Tags are paper-filled, 1px strong-rule border, 0.82rem; hover and pressed shift to cobalt border or full cobalt fill with white text. The active filter chip is a solid cobalt block with a divided clear button.

### Flow strip and cells
Six paper cells in a ruled box under a 3px baseline that fills green left to right. Each cell: mono key, name, note, mono data, state text. A node circle on the baseline goes grey, amber, green; a 2px cobalt cursor box follows the current cell. Captioned with a demo tag (synthetic record, not client data).

### Record rows
Numbered row with the depth number in the gutter, name button spanning the row, type, summary, stack tags, chevron. A short ink tick on the axis extends and turns cobalt on hover or current. Open state washes cobalt tint and expands a paper detail panel (numbered bullets plus a meta column). Group heads are head-grey with a 2px ink top rule.

### Tables and key-value lists
Paper body, 2px ink top and bottom rules, head-grey column heads, mono right-aligned values. Under 760px rows become two-column stacks.

### POSTED stamp
Single tilted element, green ink, fades in and thumps (scale 1.22 to 1, 0.5s) when the flow completes. Never repeated elsewhere.

### Three.js layer (scene.js)
Three transparent canvases, aria-hidden, no pointer capture, fading in over 0.9s; scene content is boxes, edge lines and Lambert shading with ambient 1.5 and one directional light 2.4.
- **Hero warehouse:** cobalt-field backdrop with a 44-unit white grid at 7% opacity; a belt with six gates (posts, lintel, a light sphere each); two rows of racks with instanced crates in four cobalt blues; a drifting front belt; the record crate (sheet-white with a green label) rides the main belt and follows the flow state, bouncing only while between gates. Gate lights lerp pending blue, amber (pulsing scale), green. Camera tracks the pointer slightly and the record. Masked so it appears on the right of the field only (bottom on narrow screens).
- **Profile rack:** 4 by 5 grid of cobalt crates for the 20 modules, a grey slab, slow sway, a green posting wave passing through them (28-step cycle), and a hover lift of 0.28 on the crate under the pointer. 280px tall in a ruled paper figure with a mono caption.
- **Contact pallet:** a deep-blue pallet and 18 lighter blue crates that drop in sequence as the section scrolls into view; one carries the green label.
- **Behavior:** rendering pauses off-screen (120px margin), reduced motion draws a single static frame with the flow shown complete, pixel ratio capped at 2.

### Bilingual rule
The EN page is English only; the TH page is Thai only, keeping technical terms in English inside Thai sentences (for example the role renders as Senior Full Stack Developer). There is no twin-language text: no pair of EN and TH strings is shown together on either page. Language switches through the toggle, which swaps the whole document, sets `lang` on the root, and changes the metrics noted under Typography. Proper names (Thanapon Pruektan, client and product names, stack names) stay in Latin in both.

## Do's and Don'ts

### Do:
- **Do** keep every surface square with 1px rules (#c4ccd6) and use 2px ink rules for table tops, group heads and open edges.
- **Do** keep status color to green (#17a05d) and amber (#f2b01e) and use them only for posted and in-process.
- **Do** number new records on the depth axis and set keys and figures in Martian Mono with tabular numerals.
- **Do** drive any new 3D element from `window.__flow` or section scroll so it stays tied to the one clock, and give it a reduced-motion still frame.
- **Do** write each language on its own page, with technical terms and proper names kept in Latin inside Thai sentences.

### Don't:
- **Don't** add shadows, rounded cards, or a card grid; state is color swap or rule weight.
- **Don't** add a second tilted element, a second stamp, or a second clock.
- **Don't** introduce a hue beyond cobalt, green and amber, or use green and amber as decoration.
- **Don't** show EN and TH text together in the same view.
- **Don't** present the synthetic flow record as real client data; it keeps its demo tag.
