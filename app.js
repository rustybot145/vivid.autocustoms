/* Vivid Customs — one file for both pages. No build step, no dependencies. */

// ── SET THIS ────────────────────────────────────────────────
// The shop's number, in +1XXXXXXXXXX form. Leave it empty and the
// booking form copies the request and opens the Instagram DM instead.
const SHOP_PHONE = "";
const SHOP_IG = "https://ig.me/m/vivid.autocustoms";
// ────────────────────────────────────────────────────────────

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

$("#yr").textContent = new Date().getFullYear();

/* ── nav goes solid once you leave the hero ─────────────── */
const nav = $("#nav");
if (nav && nav.dataset.stuck !== "true") {
  const onScroll = () => (nav.dataset.stuck = String(scrollY > 40));
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ── scroll reveal ──────────────────────────────────────── */
const revealed = $$(".sec__body, .closer, .bookhead, .step, .summary");
revealed.forEach((el) => (el.dataset.reveal = ""));
const revealObserver = new IntersectionObserver(
  (entries, obs) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      obs.unobserve(e.target);
    }),
  { rootMargin: "0px 0px -10% 0px" }
);
revealed.forEach((el) => revealObserver.observe(el));

/* ── hero video: don't keep decoding it off screen ──────── */
const heroVideo = $(".hero__video");
if (heroVideo && !reduced) {
  new IntersectionObserver(
    ([e]) => (e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause()),
    { threshold: 0 }
  ).observe(heroVideo);
}

/* ── work videos: play only while on screen ─────────────── */
const paneObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())),
  { threshold: 0.35 }
);
$$(".pane video").forEach((v) => paneObserver.observe(v));

/* ── booking form ───────────────────────────────────────── */
const form = $("#bookForm");
if (form) {
  const val = (id) => $("#" + id).value.trim();
  const checked = (name) => $$(`input[name=${name}]:checked`).map((c) => c.value);

  const vehicle = () => [val("year"), val("make"), val("model")].filter(Boolean).join(" ");
  const ceiling = () => `${val("density")}, ${val("coverage").toLowerCase()}`;
  const when = () => {
    const d = val("date");
    const day = d ? new Date(d + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
    return [day && `From ${day}`, val("flex")].filter(Boolean).join(" · ");
  };

  // keep the summary panel honest as they fill it in
  const sync = () => {
    $("#sumService").textContent = checked("service").join(", ") || "Not decided yet";
    $("#sumVehicle").textContent = vehicle() || "—";
    $("#sumCeiling").textContent = ceiling();
    $("#sumExtras").textContent = checked("extra").join(", ") || "None";
    $("#sumWhen").textContent = when();
  };
  form.addEventListener("input", sync);
  form.addEventListener("change", sync);
  sync();

  // can't drop a car off in the past
  const date = $("#date");
  date.min = new Date().toISOString().slice(0, 10);

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const status = $("#status");
    const fail = (msg, id) => {
      status.dataset.err = "true";
      status.textContent = msg;
      if (id) $("#" + id).focus();
    };

    if (!val("name")) return fail("Add your name so we know who's booking.", "name");
    if (!val("phone")) return fail("Add a number — that's how the quote comes back.", "phone");
    if (!vehicle()) return fail("Add the year, make and model of the car.", "year");
    status.dataset.err = "false";

    const msg = [
      `Booking request — ${val("name")}`,
      `Install: ${checked("service").join(", ") || "Not decided yet"}`,
      `Vehicle: ${vehicle()} (${checked("roof")[0]}, headliner ${checked("headliner")[0].toLowerCase()})`,
      `Ceiling: ${ceiling()}`,
      `Extras: ${checked("extra").join(", ") || "None"}`,
      val("colors") && `Colors: ${val("colors")}`,
      `Timing: ${when()}, ${val("drop").toLowerCase()} drop-off, ${checked("wait")[0].toLowerCase()}`,
      `Contact: ${val("phone")}${val("email") ? ` / ${val("email")}` : ""}`,
      `Found us via: ${val("found")}`,
      val("notes") && `Notes: ${val("notes")}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (SHOP_PHONE) {
      const sep = /iPhone|iPad|Mac/.test(navigator.userAgent) ? "&" : "?";
      location.href = `sms:${SHOP_PHONE}${sep}body=${encodeURIComponent(msg)}`;
      status.textContent = "Opening your messages — hit send to finish.";
      return;
    }

    try {
      await navigator.clipboard.writeText(msg);
      status.textContent = "Copied. Paste it into the DM that just opened.";
    } catch {
      status.textContent = "Opening Instagram — paste your details into the DM.";
    }
    open(SHOP_IG, "_blank", "noopener");
  });
}
