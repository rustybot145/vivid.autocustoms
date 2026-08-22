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
const revealed = $$(".sec__body, .closer, .bookhead, .summary");
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
  const roll = () => heroVideo.play().catch(() => {});
  new IntersectionObserver(([e]) => (e.isIntersecting ? roll() : heroVideo.pause()), { threshold: 0 }).observe(heroVideo);
  // iOS in Low Power Mode refuses autoplay outright — take the first tap as permission
  heroVideo.play().catch(() => addEventListener("touchstart", roll, { once: true, passive: true }));
}

/* ── work videos: play only while on screen ─────────────── */
const paneObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())),
  { threshold: 0.35 }
);
$$(".pane video").forEach((v) => paneObserver.observe(v));

/* ── booking quiz: one step at a time, then the whole thing ── */
const form = $("#bookForm");
if (form) {
  const val = (id) => $("#" + id).value.trim();
  const checked = (name) => $$(`input[name=${name}]:checked`).map((c) => c.value);

  const vehicle = () => [val("year"), val("make"), val("model")].filter(Boolean).join(" ");
  const when = () => {
    const d = val("date");
    const day = d ? new Date(d + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
    return [day && `From ${day}`, val("flex")].filter(Boolean).join(" · ");
  };

  // one row per answer: [step it lives on, label, value]. Drives the review
  // screen and the message that gets sent, so the two can't drift apart.
  const details = () => [
    [0, "Install", checked("service").join(", ") || "Not decided yet"],
    [1, "Vehicle", vehicle() || "—"],
    [1, "Roof", `${checked("roof")[0]}, headliner ${checked("headliner")[0].toLowerCase()}`],
    [2, "Coverage", val("coverage")],
    [2, "Extras", checked("extra").join(", ") || "None"],
    [2, "Colors", val("colors") || "Your call"],
    [3, "Timing", `${when()}, ${val("drop").toLowerCase()} drop-off, ${checked("wait")[0].toLowerCase()}`],
    [4, "Name", val("name") || "—"],
    [4, "Contact", `${val("phone")}${val("email") ? ` / ${val("email")}` : ""}` || "—"],
    [4, "Found us via", val("found")],
    [4, "Notes", val("notes") || "None"],
  ];

  const steps = $$(".step", form);
  const last = steps.length - 1;
  const fill = $("#wizFill"), count = $("#wizCount"), out = $("#reviewOut");
  const back = $("#wizBack"), next = $("#wizNext"), send = $("#wizSend"), status = $("#status");
  let cur = 0;
  let toReview = false; // set when someone jumps back from the review to fix one answer

  const fail = (msg, id) => {
    status.dataset.err = "true";
    status.textContent = msg;
    if (id) $("#" + id).focus();
  };

  // what's still missing on a given step, if anything
  const problem = (i) => {
    if (i === 1 && !vehicle()) return ["Add the year, make and model of the car.", "year"];
    if (i === 4 && !val("name")) return ["Add your name so we know who's booking.", "name"];
    if (i === 4 && !val("phone")) return ["Add a number — that's how the quote comes back.", "phone"];
    return null;
  };

  const review = () => {
    out.textContent = "";
    for (const [i, label, value] of details()) {
      const row = document.createElement("div");
      row.className = "review__row";
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "review__edit";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => {
        toReview = true;
        show(i);
      });
      row.append(dt, dd, edit);
      out.append(row);
    }
  };

  function show(i, quiet) {
    cur = Math.min(Math.max(i, 0), last);
    steps.forEach((s, k) => s.classList.toggle("is-on", k === cur));
    if (cur === last) review();
    fill.style.width = `${((cur + 1) / steps.length) * 100}%`;
    count.textContent = `Step ${cur + 1} of ${steps.length}`;
    back.hidden = cur === 0;
    next.hidden = cur === last;
    next.textContent = toReview ? "Back to review" : "Next";
    send.hidden = cur !== last;
    status.textContent = "";
    if (quiet) return;
    steps[cur].querySelector("h2").focus({ preventScroll: true });
    $("#wiz").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  const advance = () => {
    const p = problem(cur);
    if (p) return fail(...p);
    const jump = toReview;
    toReview = false;
    show(jump ? last : cur + 1);
  };

  steps.forEach((s) => (s.querySelector("h2").tabIndex = -1));
  form.classList.add("is-quiz");
  next.addEventListener("click", advance);
  back.addEventListener("click", () => {
    toReview = false;
    show(cur - 1);
  });
  show(0, true);

  // can't drop a car off in the past
  $("#date").min = new Date().toISOString().slice(0, 10);

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (cur !== last) return advance(); // enter on an earlier step just moves on

    for (let i = 0; i <= last; i++) {
      const p = problem(i);
      if (p) {
        show(i);
        return fail(...p);
      }
    }
    status.dataset.err = "false";

    const msg = [`Booking request — ${val("name")}`, ...details().map(([, k, v]) => `${k}: ${v}`)].join("\n");

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
