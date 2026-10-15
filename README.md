# Deepika Elsa Joseph — Portfolio

Single-page portfolio. Plain HTML/CSS/JS, no build step, no dependencies
(fonts come from Google Fonts). Blueprint / drawing-sheet visual style with a
light and dark theme.

```text
portfolio/
├── index.html
├── README.md
└── assets/
    ├── styles.css
    ├── script.js
    ├── download (34).png       ← source line art for the logo (transparent PNG)
    ├── logo-mark.png           ← 96px cameo, black ink — header, light
    ├── logo-mark-dark.png      ← 96px cameo, white ink — header, dark
    ├── favicon.png             ← 64px, browser tab, light
    ├── favicon-dark.png        ← 64px, browser tab, dark
    ├── apple-touch-icon.png    ← 180px, iOS home screen
    ├── himmel.jpeg             ← source painting, light mode (900×1280)
    ├── frieren.jpeg            ← source painting, dark mode (618×870)
    ├── plate-light.jpg         ← 480×600 crop of himmel — hero plate, light
    ├── plate-dark.jpg          ← 480×600 crop of frieren — hero plate, dark
    ├── cursor.jpg              ← source art, default cursor (728×825)
    ├── hover.jpg               ← source art, hover cursor (735×375)
    ├── cursor-48.png           ← 48px, the cursor actually used
    ├── hover-48.png            ← 48px, used on links and buttons
    └── og-image.png            ← LinkedIn / social preview card
```

## Skill tags

Each skill card shows its tags on **one line that scrolls horizontally**. The
markup holds a single copy of each set; `script.js` wraps it in a clipping
container and repeats it until the track is at least twice the visible width,
then sets two custom properties per card:

- `--shift` — the width of exactly one copy, so translating by it loops seamlessly
- `--dur` — `--shift ÷ 34px per second`

The duration is computed per card **on purpose**. A single shared duration would
make every row take the same time regardless of length, so the longest row
(Data engineering, ~950px) would scroll three times faster than the shortest
(Programming, ~308px). Deriving it from width keeps the speed constant instead.

Scrolling pauses on hover so the tags can be read, stops entirely under
`prefers-reduced-motion` (the row becomes manually scrollable), and adding or
removing a tag needs no code change — it's all measured at runtime.

## Decoding headings

Main headings first render as random symbols, then resolve character by
character as they scroll into view. `SCRAMBLE_TARGETS` is `h1, h2` — the hero
name and the five section titles, six in total. Subheadings are deliberately
left out: the 12 `h3` card titles and 6 `h4` skill labels render normally.

**Timing is in milliseconds, scheduled against `requestAnimationFrame`
timestamps, not frame counts.** A frame-count schedule silently runs at half the
intended duration on a 120Hz display. Each decode lasts
`min(5000, max(3000, letters × 110))` ms. Every current heading is short enough
to land on the 3-second floor; the cap only matters if a much longer section
title is added later, so it can't crawl.

The last glyph is pinned to land exactly on the duration, and the jitter on the
others only ever pulls them *earlier*. Jitter in both directions let the final
character resolve ~175ms early, which put the whole decode under the 5s floor.

**It walks text nodes, not `textContent`.** The obvious implementation —
`el.textContent = scrambled` — would destroy any markup inside the heading, and
two headings have some: the hero's `Deepika<br>Elsa Joseph` would collapse onto
one line, and the paper titles would lose the `<a>` wrapping them, so the IEEE
Xplore links would stop working. A `TreeWalker` scrambles each text node in
place and leaves the elements alone.

Three other details:

- **Every character occupies its slot from frame one**, showing a random glyph
  rather than nothing, so the heading never changes width while decoding. The
  headings are Space Mono, so each glyph is the same width and nothing reflows.
- **Whitespace resolves immediately** (`end = 0`), so the word shapes are visible
  from the start and it reads as decoding rather than as noise.
- **The random glyph re-rolls every other frame**, not every frame — at 60fps
  per-frame rolling is too frantic to read.

While a heading is mid-decode it carries an `aria-label` with the real text, so
screen readers announce the heading instead of the gibberish; the attribute is
removed once it settles. The whole effect is skipped under
`prefers-reduced-motion`.

## Sparkling buttons

Every button glows and twinkles on hover, following the pattern
`:hover .stars { display:block; filter:drop-shadow(...) }`. The `drop-shadow`
colour is `var(--accent)`, so it tracks the theme instead of being hard-coded.

**The star markup is injected by `script.js`, not written into the HTML.**
Anything matching `SPARKLE_TARGETS` (`.btn, .paper-link, .theme-toggle`) gets a
`.sparkle` class and four star SVGs appended at load. Add a button anywhere with
one of those classes and it sparkles for free; widen the selector to include
more. Hand-writing four `<svg>` elements per button would mean five copies of
the same markup to keep in sync.

Four details that matter if you edit it:

- `.stars` is `position:absolute`. The buttons are inline-flex with a `gap`, so
  a static child would become a flex item and push the label sideways.
- **Star positions are percentages and sizes scale off `--sk`.** The same rules
  cover a 40px icon button and a wide CTA; `--sk` is `.7` on `.theme-toggle` and
  `.82` on `.paper-link`. Fixed pixel offsets looked fine on the CTA and fell
  outside the small ones.
- **Star colour is two tokens, both theme-aware.** `--star` covers pale/outlined
  buttons; `--star-on-accent` covers `.btn-primary` and `.paper-link:hover`,
  which are themselves filled magenta. In **light mode both are the same dark
  indigo `#344D75`** — lighter blues washed out against the pale grid. In **dark
  mode** they split: magenta for outlined buttons, near-white on the magenta
  fills. The `drop-shadow` glow uses the same token as the fill in each case, so
  a blue star never sits inside a magenta halo.
- Hover `box-shadow`s **append** the glow to the existing `6px 6px 0` offset
  block rather than replacing it, keeping the drafting-style hard shadow the
  rest of the page uses.

Under `prefers-reduced-motion` the stars appear without twinkling.

## Cursors

Totoro with an umbrella replaces the arrow everywhere; the grinning walking
Totoro appears on links, buttons, contact cards and nav items.

**The cursors are PNGs built from the JPEG sources — they can't be the `.jpg`
files directly.** Two reasons, both fatal:

1. **A cursor needs an alpha channel and JPEG has none.** Pointing CSS at a JPEG
   gives you an opaque rectangle dragged around the page. Worse, `cursor.jpg` and
   `hover.jpg` are PNGs that were re-saved as JPEG, so their transparency is
   *painted in* as a grey checkerboard — you'd see the checkers. The build keys
   that background back out to real alpha with a flood fill seeded from the
   image borders (a plain "delete all near-white" would punch holes in Totoro's
   cream belly; the flood fill can't reach it through the outlines).
2. **Chrome ignores any cursor image over 128×128**, silently falling back to the
   system arrow. The sources are 728px and 735px wide.

`hover-48.png` is cropped to the lead Totoro. The source has three characters
side by side, which at 48px was an unreadable smear.

Both declare the hotspot `20 4` — the top of Totoro's head, and the same point in
each, so the click target doesn't shift as the pointer moves onto a link. The
trailing `auto` / `pointer` keyword is a required fallback, and is what shows if
the PNG ever fails to load.

Because the background is genuinely transparent, the same two files work on both
the light and dark themes with no per-theme variant.

To re-crop or swap the art, rebuild the PNGs from the sources — don't point the
CSS at a JPEG.

**Both the logo and the hero plate follow the theme.** The header mark is the
cameo line art (Himmel and Frieren fill the photo plate in the hero instead):
Himmel in light mode, Frieren in dark. Each swaps in CSS via `.mark-light` /
`.mark-dark` and `.art-light` / `.art-dark` under `[data-theme="dark"]`. The
browser-tab favicon can't be reached from CSS, so `script.js` rewrites the
`<link id="favicon">` href inside `applyTheme()`.

Two things to preserve if you regenerate these:

- **The cameo is pre-rendered at display size (96px for a 48px mark), not
  downscaled by the browser.** Its line work is ~1px; shrinking a 256px version
  in the browser anti-aliases the strokes into a grey smudge. The build also
  amplifies the alpha channel ~2.3× so the lines stay solid at that size.
- The plate crops are 4:5 to match the frame, anchored to the top of each
  painting where the head is. Don't point the page at `himmel.jpeg` /
  `frieren.jpeg` directly — they're 276KB and 230KB, and the wrong aspect ratio.

No résumé PDF: the site carries the skills and the paper links instead, so
there's no file to keep in sync with the LaTeX.

## Before you publish

1. **Optional — a photo.** In `index.html` find `<div class="plate-photo">` and
   swap the inner `<span>DEJ</span>` for
   `<img src="assets/photo.jpg" alt="Deepika Elsa Joseph" />`.
2. **Creative work section.** There's a commented-out block near the end of the
   Contact section. Paste your art portfolio and Instagram URLs into the two
   `href="#"` values, delete the surrounding `<!-- -->`, and it appears.
3. Phone number is deliberately off the public page.

## A note on editing with PowerShell

`index.html` is deliberately **pure ASCII** (em-dashes are written `&mdash;`).
PowerShell 5.1's `Get-Content -Raw` decodes files as ANSI, so a read-modify-write
round-trip will corrupt any non-ASCII character. Keep it ASCII, or edit in VS Code.

## Publish to GitHub Pages

### Option A — profile site (`deepikaelsa.github.io`)

```bash
cd path/to/portfolio
git init -b main
git add .
git commit -m "Portfolio site"
gh repo create deepikaelsa.github.io --public --source=. --push
```

No `gh` CLI? Create a **public** repo named exactly `deepikaelsa.github.io`, then:

```bash
git remote add origin https://github.com/deepikaelsa/deepikaelsa.github.io.git
git push -u origin main
```

Pages turns on automatically for this repo name. Live in ~1 minute at
**https://deepikaelsa.github.io**

### Option B — project repo

```bash
git init -b main && git add . && git commit -m "Portfolio site"
gh repo create portfolio --public --source=. --push
```

Then: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
Live at **https://deepikaelsa.github.io/portfolio**

## Put it on GitHub and LinkedIn

- **GitHub profile:** add the URL to your profile README (repo named `deepikaelsa`)
  and to the **Website** field under Edit profile.
- **LinkedIn:** Contact info → Website, and Featured → *Add a link*. The preview
  card comes from `og-image.png` and the `og:` meta tags in `index.html`.
  Refresh a stale preview with the
  [Post Inspector](https://www.linkedin.com/post-inspector/).

## Structure

Six sections, each with an `id` that the nav points at:

| # | id | Sheet |
|---|------------|-------------------------|
| 1 | `home`       | Subject / hero |
| 2 | `about`      | About + technical skills |
| 3 | `projects`   | Built & shipped |
| 4 | `research`   | Research & publications |
| 5 | `experience` | Experience + education |
| 6 | `contact`    | Sign-off |

## Colours

Sampled from the reference palette and defined as CSS variables at the top of
`assets/styles.css`:

```css
--indigo:#344D75;  --steel:#4A7CA1;  --slate:#637D98;
--sky:#B6DDFE;     --cyan:#BAF0FA;   --pink:#F7C5EB;   --magenta:#D069B8;
```

Only indigo/steel/slate are dark enough for body text; sky, cyan and pink are
fills; magenta is the accent. `--accent-deep` is a darkened magenta used for
small accent text so it stays readable — don't swap it for `#D069B8`, which is
too light for small text on a pale background.

Dark mode redefines the same variables under `[data-theme="dark"]` — a deep
indigo ground with the grid drawn in light blue, i.e. an actual blueprint.

## Editing

Content is plain HTML — open `index.html` and edit the text; nothing is generated.

**Adding a nav item:** the indicator maths assumes **6 items** of 70px (`ul` is
420px, the bar is 490px = 420 + 35px clear each side, so the indicator's curved
shoulders don't overhang the rounded corners). For a 7th item, widen `ul` to
490px and `.navigation` to 560px, and add:

```css
.navigation ul li:nth-child(7).active ~ .indicator{transform:translateX(calc(70px * 6));}
```

Also update `16.6667%` in the mobile block to `14.2857%`.

## Local preview

```bash
python -m http.server 8000
# http://localhost:8000
```
