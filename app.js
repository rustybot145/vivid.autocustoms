/* Vivid Customs — one file for every page. No build step, no dependencies. */

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
const revealed = $$(".sec__body, .closer, .bookhead");
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
  // Safari checks these as properties, not only as attributes, before it will autoplay
  heroVideo.muted = true;
  heroVideo.playsInline = true;

  const roll = () => heroVideo.play().catch(() => {});
  new IntersectionObserver(([e]) => (e.isIntersecting ? roll() : heroVideo.pause()), { threshold: 0 }).observe(heroVideo);

  // try again as the file becomes playable, and whenever the page comes back
  ["loadedmetadata", "canplay"].forEach((e) => heroVideo.addEventListener(e, roll, { once: true }));
  addEventListener("pageshow", roll);
  document.addEventListener("visibilitychange", () => document.hidden || roll());

  // Low Power Mode refuses autoplay whatever the page does — first touch counts as consent
  ["pointerdown", "touchstart"].forEach((e) => addEventListener(e, roll, { once: true, passive: true }));
  roll();
}

/* ── work videos: play only while on screen ─────────────── */
const paneObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())),
  { threshold: 0.35 }
);
$$(".pane video").forEach((v) => paneObserver.observe(v));

/* ── build gallery: one page, whichever car the link asked for ── */
const gal = $("#gal");
if (gal && typeof GALLERY !== "undefined") {
  const slug = new URLSearchParams(location.search).get("car");
  // own-property only: ?car=constructor would otherwise sail through as truthy
  const car = slug && Object.hasOwn(GALLERY, slug) ? GALLERY[slug] : null;

  const el = (tag, props) => Object.assign(document.createElement(tag), props);
  const item = (node) => {
    const fig = el("figure", { className: "gal__item" });
    fig.append(node);
    gal.append(fig);
  };

  if (car) {
    $("#galName").textContent = car.name;
    $("#galSpec").textContent = car.spec;
    document.title = `${car.name} — Vivid Customs`;

    car.clips.forEach(([file, w, h], i) => {
      const dir = `video/gallery/${slug}/`;
      item(el("video", {
        src: dir + file, poster: dir + file.replace(".mp4", ".jpg"),
        width: w, height: h, muted: true, loop: true, playsInline: true,
        preload: "none", ariaLabel: `${car.name}, clip ${i + 1}`,
      }));
    });

    car.shots.forEach(([file, w, h], i) => {
      const src = `images/gallery/${slug}/${file}`;
      const a = el("a", { href: src, title: "Open full size" });
      a.append(el("img", {
        src, width: w, height: h, loading: "lazy", decoding: "async",
        alt: `${car.name}, photo ${i + 1} of ${car.shots.length}`,
      }));
      item(a);
    });

    // same treatment the work panes get: play only while on screen
    $$("video", gal).forEach((v) => paneObserver.observe(v));
  } else {
    // no car named, or one we don't have — fall back to the full list
    $("#galName").textContent = "Every build";
    $("#galSpec").textContent = "Pick a car to see the whole shoot.";
  }

  const more = $("#galMore");
  more.append(el("p", { className: "label", textContent: car ? "Other builds" : "The builds" }));
  Object.entries(GALLERY)
    .filter(([key]) => key !== slug)
    .forEach(([key, other]) =>
      more.append(el("a", { href: `gallery.html?car=${key}`, textContent: other.name }))
    );
}

/* phone photos run 4-5MB and the endpoint takes 4.5MB a request, so the
   logo references get scaled down and re-encoded before they're sent. */
const shrink = (file) =>
  new Promise((done) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      done({
        filename: file.name.replace(/\.\w+$/, "") + ".jpg",
        content: c.toDataURL("image/jpeg", 0.82).split(",")[1],
      });
    };
    img.onerror = () => (URL.revokeObjectURL(img.src), done(null));
    img.src = URL.createObjectURL(file);
  });

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

  // the Logo extra opens a drawer for the description and reference images
  const logo = $("#e3"), logoFile = $("#logoFile");
  const logoShots = () => (logo.checked ? [...logoFile.files] : []);
  const logoLine = () => {
    const n = logoShots().length;
    return [val("logoNote") || "Details to follow", n && `${n} reference photo${n > 1 ? "s" : ""}`]
      .filter(Boolean).join(" · ");
  };
  const drawer = () => ($("#logoPanel").hidden = !logo.checked);
  logo.addEventListener("change", drawer);
  drawer();

  // one row per answer: [step it lives on, label, value]. Drives the review
  // screen and the message that gets sent, so the two can't drift apart.
  const details = () => [
    [0, "Install", checked("service").join(", ") || "Not decided yet"],
    [1, "Vehicle", vehicle() || "—"],
    [1, "Roof", `${checked("roof")[0]}, headliner ${checked("headliner")[0].toLowerCase()}`],
    [2, "Stars", val("stars")],
    [2, "Extras", checked("extra").join(", ") || "None"],
    ...(logo.checked ? [[2, "Logo", logoLine()]] : []),
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

    const rows = details().map(([, k, v]) => [k, v]);
    const msg = [`Booking request — ${val("name")}`, ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
    const shots = logoShots().slice(0, 3);

    // the email is the real send; the handoffs below are only a safety net
    send.disabled = true;
    status.textContent = shots.length ? "Sending, with your logo…" : "Sending…";
    try {
      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: val("name"),
          replyTo: val("email"),
          website: val("website"),
          rows,
          attachments: (await Promise.all(shots.map(shrink))).filter(Boolean),
        }),
      });
      if (!r.ok) throw new Error(r.status);
      status.textContent = "Sent. We'll come back to you with a number shortly.";
      return;
    } catch {
      status.textContent = "";
    } finally {
      send.disabled = false;
    }

    // email didn't go through — hand it off rather than lose the request
    const bring = shots.length ? " Attach your logo photo there too." : "";
    if (shots.length && navigator.canShare?.({ files: shots })) {
      try {
        await navigator.share({ text: msg, files: shots });
        status.textContent = "Shared — send it in the app you picked to finish.";
      } catch (e) {
        if (e.name !== "AbortError") status.textContent = "Couldn't send — DM us at @vivid.autocustoms.";
      }
      return;
    }

    if (SHOP_PHONE) {
      const sep = /iPhone|iPad|Mac/.test(navigator.userAgent) ? "&" : "?";
      location.href = `sms:${SHOP_PHONE}${sep}body=${encodeURIComponent(msg)}`;
      status.textContent = "Opening your messages — hit send to finish." + bring;
      return;
    }

    try {
      await navigator.clipboard.writeText(msg);
      status.textContent = "Copied. Paste it into the DM that just opened." + bring;
    } catch {
      status.textContent = "Opening Instagram — paste your details into the DM." + bring;
    }
    open(SHOP_IG, "_blank", "noopener");
  });
}
