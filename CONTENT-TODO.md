# Vivid Customs — what's still a guess

Everything here came off the Instagram profile, the Linktree, and the five photos/videos on the
desktop. That's a bio, a city, and some work shots — so a lot of the page is my best read of how
a starlight shop operates, not anything the shop told me. Go through this before it goes public.

## Confirmed
- Business name, logo, Peoria AZ, Instagram handle `@vivid.autocustoms`.
- Services named in the bio: starlights, ambient lighting, and one more that was cut off in the
  bio text (`- C...`). I guessed **custom/underglow** from the RX-7 clip. Check what it actually says.
- All five work items are Vivid's own media.

## No contact details anywhere
This is the biggest hole. Neither the profile nor the Linktree has a phone number or email, so:
- `app.js` → `SHOP_PHONE` is **empty**. Until it's filled in, every booking goes through the
  Instagram DM fallback.
- There's no address on the page, only "Peoria, AZ". If there's a shop address or a service
  radius, it should be in the footer.
- No hours anywhere.

## Claims I made up and you need to confirm
- **"Runs off your phone"** (hero, and app control throughout). Standard for RGBW fiber engines,
  but only true if that's the hardware he actually installs.
- **Point counts 200–600+** — an industry-typical range, not his.
- **Full day for a headliner, two days for bigger builds** — appears in the process section, the
  FAQ and the quote page. If it's wrong it's wrong in three places.
- **Deposit holds the slot** — I invented the booking mechanics wholesale.
- **"Price back, usually same day"** on `book.html`.
- **Power tapped to switched ignition**, **IP-rated sealed strips**, **heat-shrunk joints**,
  **factory clips** — all in the service cards and FAQ. These are how it *should* be done. Confirm
  it's how he does it.
- **"Bring it back" warranty** on the last FAQ. There is no stated warranty.

## The Arizona underglow FAQ
I wrote that Arizona restricts red and blue showing toward the front, and anything flashing.
That's the general shape of the law, but I'm summarising it from memory, not from the statute —
and it's the one answer on the page where being wrong could actually cost a customer a ticket.
Read the current ARS language and reword it, or cut the answer down to "we set it up street-legal,
ask us about your build."

## Work section captions
- The five captions are my read of the photos and the video filenames, not his words:
  "Full ceiling + sunroof surround", "Dodge Durango, 6k miles", "Star ceiling over red leather",
  "RX-7, return customer", "GMC crew cab". The Durango and RX-7 details came from his own IG
  captions; the other three I named from what I could see.
- **Permission to show customer vehicles.** No plates or faces, but they're still customer cars.

## Prices
There are none anywhere — not on the landing page, not on the booking page. The pricing section
explains what moves the number instead, and the booking summary just reads "Quoted per car".
When real prices exist, the two places to put them are `#pricing` on the landing page and the
`.summary__price` line in `book.html`.

## The booking page is a template
The five steps ask what a starlight shop *would* ask, not what he asks:
- The service list, star densities, coverage options and extras are all my invention.
- Roof type and headliner condition are in there because they genuinely change the job — confirm
  they're the right two questions.
- Step 4 collects a date preference and says a slot gets confirmed back. There is no calendar and
  no availability behind it; it's a preference, not a booking.
- "No deposit until you've seen the price" is stated on the page. Make sure that's true.

## Assets
- The logo came from a 196×166 screenshot, so `logo-512.png` is upscaled and slightly soft at
  large sizes. It's only used at 128px and under, so it holds — but a real logo file would be better.
- Only five pieces of work. The gallery is sized for more; adding four or five more portrait
  shots would fill the grid out properly.
