# Vivid Customs

Marketing site for [Vivid Customs](https://www.instagram.com/vivid.autocustoms/) — starlight
headliners, ambient interior lighting and underglow, out of Peoria, Arizona.

Static site. No build step, no dependencies. Open `index.html`, or serve the folder:

```
python3 -m http.server 4173
```

| File | What it is |
|---|---|
| `index.html` | Landing page |
| `book.html` | Booking page — five steps, live summary panel |
| `styles.css` | All styles for both pages |
| `app.js` | Scroll reveals, video playback, booking form + summary |
| `images/` | Logo, keyed out of the Instagram profile picture |
| `images/work/` | Install photos |
| `video/` | `hero.mp4` (the landing-page background) + the work clips and posters |
| `CONTENT-TODO.md` | **Read this first** — every claim on the page that is still an assumption |

## The one thing to set

`app.js` starts with:

```js
const SHOP_PHONE = "";
```

Put the shop's number in there (`+1XXXXXXXXXX`) and the booking form hands the request to the
customer's own text app, addressed to the shop — they hit send, so it arrives from their real
number. Left empty, the form copies the request to the clipboard and opens the Instagram DM
instead. Both work; the text is better.

## Design

One committed theme: black, with a single electric blue (`#3D7BFF`) sampled from the shop's own
underglow footage. No gradients — the accent only appears on step numbers, focus rings, selected
options and hover states.

Display face is **Instrument Serif**, set large and used with italics for emphasis; **Archivo**
carries body copy, labels and every control. A star ceiling is a luxury-car feature, so the page
is set like one.

Sections run as a narrow label rail beside a wide content column, which stacks on narrow screens.
Services are hairline-separated rows rather than cards, and the work grid keeps every clip in its
native 9:16 — all the source media is portrait.

The landing page opens on `video/hero.mp4` — five seconds of the Durango build, muted and looping
behind the headline, with a two-axis scrim keeping the type readable on the left while the stars
stay visible on the right. It pauses when scrolled past, and `prefers-reduced-motion` swaps it for
the poster frame.

## Assets

`logo.png` is the mark alone — the badge circle is gone, the artwork is keyed off its background
so it sits on black anywhere, and there's no box around it. The source was a 196×166 screenshot of
the Instagram profile picture, so it's upscaled and slightly soft up close; it's only used at 52px
and under, where it holds. A real logo file would still be better.

`video/hero.mp4` is cut from the Durango clip (7.4s–12.4s, the strongest five seconds) and
re-encoded at 1080×1920 so the browser isn't upscaling a 720px source across a wide hero.
