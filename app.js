(() => {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 980px)");
  const pinQ = matchMedia("(min-width: 981px) and (min-height: 861px)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const root = document.documentElement;

  const param = new URLSearchParams(location.search).get("lang");
  let lang = [param, document.documentElement.lang].find((v) => v === "en" || v === "th") || "en";
  const L = (o) => o[lang];
  const path = (o, p) => p.split(".").reduce((a, k) => (a ? a[k] : undefined), o);
  const U = (k) => path(S.ui, k);
  const disp = (t) => (lang === "th" && S.termTh[t]) || t;
  const THAI = /[฀-๿]/;

  const idx = {};
  const total = S.groups.reduce((n, g) => n + g.records.length, 0);
  S.groups.forEach((g) => g.records.forEach((r, i) => { idx[r.id] = { rec: r, group: g, no: `${g.key}.${i + 1}` }; }));
  const state = { open: new Set(), filter: null };
  const stage = S.flow.map(() => "pending");
  const norm = (s) => s.toLowerCase();
  const matches = (r, term) => r.stack.some((s) => norm(s) === norm(term));
  const countFor = (term) => S.groups.reduce((n, g) => n + g.records.filter((r) => matches(r, term)).length, 0);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce.matches) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  function scrollToEl(el, mode) {
    if (lenis) lenis.scrollTo(el, { offset: mode === "center" ? -(innerHeight - el.offsetHeight) / 2 : -76, duration: 1.2 });
    else el.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: mode === "center" ? "center" : "start" });
  }

  /* ---------- decode text: glyph noise resolving into the real string ---------- */
  const GL = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%/+<>";
  const DG = "0123456789";
  function decode(el, text, o = {}) {
    if (!el) return;
    cancelAnimationFrame(el._d);
    if (reduce.matches || THAI.test(text)) { el.textContent = text; return; }
    const set = o.set || GL, dur = o.dur || 700, t0 = performance.now() + (o.delay || 0);
    const chars = [...text];
    if (!el.classList.contains("dec")) el._inl = getComputedStyle(el).display === "inline";
    const inl = el._inl;
    const w = el.offsetWidth;
    if (inl) el.style.display = "inline-block";
    el.style.minWidth = `${w}px`;
    el.classList.add("dec");
    const keep = o.set === DG ? (c) => !/\d/.test(c) : (c) => c === " " || /[.,·()\-–:;'"’&]/.test(c);
    const rnd = chars.map((_, i) => ((i * 7919) % 13) / 13);
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      el.textContent = chars.map((c, i) => (keep(c) || p >= (i / chars.length) * 0.7 + rnd[i] * 0.3 ? c : set[(Math.random() * set.length) | 0])).join("");
      if (p < 1) el._d = requestAnimationFrame(step);
      else { el.textContent = text; el.style.minWidth = ""; if (inl) el.style.display = ""; el.classList.remove("dec"); }
    };
    el._d = requestAnimationFrame(step);
  }

  /* ---------- static chrome ---------- */
  function applyChrome() {
    root.lang = lang;
    document.title = L(S.ui.title);
    $('meta[name="description"]').content = L(S.ui.description);
    $$("[data-t]").forEach((el) => { const v = U(el.dataset.t); if (!v) return; cancelAnimationFrame(el._d); el.classList.remove("dec"); el.style.minWidth = ""; el.style.display = ""; el.textContent = L(v); });
    $$("[data-alt]").forEach((el) => { el.alt = L(U(el.dataset.alt)); });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $("#langgroup").setAttribute("aria-label", L(S.ui.langLabel));
  }

  /* ---------- flow strip ---------- */
  function renderFlow() {
    const cells = $("#cells");
    $$(".cell", cells).forEach((c) => c.remove());
    const cursor = $("#cursor");
    S.flow.forEach((f, i) => {
      const e = idx[f.rec];
      const a = document.createElement("a");
      a.className = "cell";
      a.href = `#rec-${f.rec}`;
      a.dataset.go = f.rec;
      a.dataset.i = i;
      a.innerHTML =
        `<span class="node" aria-hidden="true"></span>` +
        `<span class="c-key">${e.no}</span>` +
        `<span class="c-name">${esc(L(f.name))}</span>` +
        `<span class="c-note">${esc(L(f.note))}</span>` +
        `<span class="c-data">${esc(L(f.line))}</span>` +
        `<span class="c-state"><span class="c-st"></span><svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></span>`;
      a.setAttribute("aria-label", `${L(f.name)}: ${e.rec.name}. ${L(U("flowOpen"))}`);
      cells.insertBefore(a, cursor);
    });
    paint();
  }

  function paint() {
    const cells = $$(".cell");
    cells.forEach((c, i) => {
      c.dataset.state = stage[i];
      $(".c-st", c).textContent = L(U(stage[i]));
    });
    let last = -1;
    stage.forEach((s, i) => { if (s !== "pending") last = i; });
    const box = $("#cells");
    if (last < 0) { box.style.setProperty("--s", "0"); return; }
    const n = cells[last].querySelector(".node");
    const pos = narrow.matches ? cells[last].offsetTop + n.offsetTop + 7 : cells[last].offsetLeft + n.offsetLeft + 7;
    box.style.setProperty("--s", String(Math.min(1, pos / (narrow.matches ? box.offsetHeight : box.offsetWidth))));
  }

  function moveCursor(i) {
    const c = $$(".cell")[i], cur = $("#cursor");
    if (!c) return;
    cur.style.width = `${c.offsetWidth + 2}px`;
    cur.style.height = `${c.offsetHeight + 2}px`;
    cur.style.transform = `translate(${c.offsetLeft - 1}px, ${c.offsetTop - 1}px)`;
    cur.classList.add("on");
  }

  function setStage(k, st) {
    if (stage[k] === st) return false;
    stage[k] = st;
    if (st === "processing") decode($$(".c-data")[k], L(S.flow[k].line), { dur: 520 });
    return true;
  }
  const flow = (window.__flow = { u: 0, states: stage });
  function thump() {
    const st = $("#stamp");
    st.classList.remove("thump"); void st.offsetWidth; st.classList.add("landed", "thump");
  }
  const unland = () => $("#stamp").classList.remove("landed", "thump");

  /* timer mode (small screens, short windows, reduced motion) */
  const clock = { step: 0, timer: 0, hero: true, tab: !document.hidden };
  function tick() {
    const n = S.flow.length;
    let wait = 850;
    if (clock.step < n * 2) {
      const k = clock.step >> 1;
      if (clock.step % 2 === 0) { setStage(k, "processing"); moveCursor(k); flow.u = k; } else { setStage(k, "posted"); }
      paint();
    } else if (clock.step === n * 2) {
      thump();
      wait = 3400;
    } else {
      stage.fill("pending");
      $("#cursor").classList.remove("on");
      unland(); flow.u = 0;
      paint();
      clock.step = -1;
      wait = 1000;
    }
    clock.step++;
    schedule(wait);
  }
  function schedule(ms) {
    clearTimeout(clock.timer);
    if (pinned || reduce.matches || !clock.hero || !clock.tab) return;
    clock.timer = setTimeout(tick, ms);
  }

  /* scrub mode (wide windows): the scrollbar is the clock */
  let pinned = false, landed = false;
  const starts = S.flow.map((_, k) => 0.04 + k * 0.15);
  function scrub(p) {
    const hero = $(".hero");
    hero.style.setProperty("--hp", p.toFixed(3));
    hero.dataset.started = p > 0.01 ? "1" : "";
    let changed = false;
    starts.forEach((s0, k) => { if (setStage(k, p >= s0 + 0.09 ? "posted" : p >= s0 ? "processing" : "pending")) changed = true; });
    let cur = 0;
    starts.forEach((s0, k) => { if (p >= s0) cur = k; });
    flow.u = clamp((p - 0.04) / 0.15, 0, 5);
    if (changed) paint();
    if (scrub.cur !== cur || changed) { moveCursor(cur); scrub.cur = cur; }
    const done = p >= 0.9;
    if (done && !landed) { landed = true; thump(); } else if (!done && landed) { landed = false; unland(); }
  }

  function setMode() {
    const want = pinQ.matches && !reduce.matches;
    root.classList.toggle("is-pinned", want);
    if (want === pinned && setMode.ran) return;
    setMode.ran = true;
    pinned = want;
    clearTimeout(clock.timer);
    if (reduce.matches) { stage.fill("posted"); flow.u = 5; $("#stamp").classList.add("landed"); paint(); return; }
    if (pinned) { stage.fill("pending"); unland(); landed = false; flow.u = 0; paint(); frame(); }
    else {
      $(".hero").style.removeProperty("--hp");
      $(".hero").dataset.started = "";
      unland(); flow.u = 0;
      stage.fill("pending"); paint(); clock.step = 0; schedule(700);
    }
  }

  /* ---------- profile ---------- */
  let intro = true;
  function renderProfile() {
    $("#profile-text").textContent = L(S.profile);
    const c = S.ui.ledgerCols;
    $("#ledger").innerHTML =
      `<thead><tr><th scope="col">${esc(L(c.metric))}</th><th scope="col" class="v">${esc(L(c.value))}</th><th scope="col">${esc(L(c.source))}</th></tr></thead><tbody>` +
      S.ledger.map((r) => {
        const e = r.source && idx[r.source];
        const src = e ? `<button type="button" data-go="${e.rec.id}"><span class="mono">${e.no}</span><span>${esc(e.rec.name)}</span></button>` : `<span class="dash" aria-hidden="true">-</span>`;
        return `<tr><td>${esc(L(r.metric))}</td><td class="v">${esc(L(r.value))}</td><td class="src">${src}</td></tr>`;
      }).join("") + `</tbody>`;
    if (intro) $$("#ledger td.v").forEach((el) => decIO.observe(el));
  }

  /* ---------- records ---------- */
  function tagBtn(term, extra = "") {
    return `<button type="button" class="tag" data-filter="${esc(term)}" aria-pressed="${state.filter && norm(state.filter) === norm(term)}">${esc(disp(term))}${extra}</button>`;
  }

  function recordHTML(g, r, i) {
    const no = `${g.key}.${i + 1}`;
    const open = state.open.has(r.id);
    const shown = r.stack.slice(0, 4), more = r.stack.length - shown.length;
    const link = r.links && r.links[0] && idx[r.links[0]];
    return `<li class="rec${open ? " open" : ""}" id="rec-${r.id}" data-id="${r.id}">
  <span class="num">${no}</span>
  <div class="rbody">
    <div class="row">
      <h4 class="r-name"><button type="button" aria-expanded="${open}" aria-controls="d-${r.id}">${esc(r.name)}</button></h4>
      <p class="r-type">${esc(L(r.type))}</p>
      <div class="r-sum"><p>${esc(L(r.summary))}</p>${link ? `<span class="r-lk"><svg class="ic" aria-hidden="true"><use href="#i-link"/></svg>${esc(L(U("linked")))} ${link.no}</span>` : ""}</div>
      <div class="r-stack">${shown.map((t) => tagBtn(t)).join("")}${more > 0 ? `<span class="tag-more">+${more}</span>` : ""}</div>
      <svg class="ic r-chev" aria-hidden="true"><use href="#i-chev"/></svg>
    </div>
    <div class="detail" id="d-${r.id}" role="region" aria-label="${esc(r.name)}"><div class="detail-in"><div class="detail-pad">
      <ol class="bul">${r.bullets.map((b, k) => `<li><span class="mono">${no}.${k + 1}</span><p>${esc(L(b))}</p></li>`).join("")}</ol>
      <dl class="meta">
        ${r.role ? `<div><dt class="cap">${esc(L(U("role1")))}</dt><dd>${esc(L(r.role))}</dd></div>` : ""}
        <div><dt class="cap">${esc(L(U("stackLabel")))}</dt><dd><div class="tags">${r.stack.map((t) => tagBtn(t)).join("")}</div></dd></div>
        ${link ? `<div><dt class="cap">${esc(L(U("linked")))}</dt><dd><button type="button" class="go" data-go="${link.rec.id}"><span class="mono">${link.no}</span><span>${esc(link.rec.name)}</span></button></dd></div>` : ""}
      </dl>
    </div></div></div>
  </div>
</li>`;
  }

  function renderRecords() {
    $("#groups").innerHTML = S.groups.map((g) => {
      const co = typeof g.company === "string" ? esc(g.company) : esc(L(g.company));
      return `<section class="grp" aria-label="${co}">
  <header class="grp-h">
    <span class="num g">${g.key}</span>
    <div class="gh-main">
      <div class="gh-top"><h3>${co}</h3>${g.dates ? `<p class="dates">${esc(L(g.dates))}</p>` : ""}</div>
      ${g.role ? `<p class="gh-role">${esc(L(g.role))}</p>` : ""}
      ${g.summary ? `<p class="gh-sum">${esc(L(g.summary))}</p>` : ""}
    </div>
  </header>
  <ol>${g.records.map((r, i) => recordHTML(g, r, i)).join("")}</ol>
</section>`;
    }).join("");
    if (intro) $$("#groups .gh-top h3").forEach((el) => decIO.observe(el));
    applyFilter();
  }

  function setOpen(id, on) {
    const li = document.getElementById(`rec-${id}`);
    if (!li) return;
    on ? state.open.add(id) : state.open.delete(id);
    li.classList.toggle("open", on);
    $(".r-name button", li).setAttribute("aria-expanded", String(on));
    syncToggleAll();
  }
  function syncToggleAll() {
    const all = state.open.size === total;
    const b = $("#toggleall");
    b.textContent = L(U(all ? "closeAll" : "openAll"));
    b.dataset.mode = all ? "close" : "open";
  }

  function setFilter(term) {
    state.filter = state.filter && term && norm(state.filter) === norm(term) ? null : term;
    applyFilter();
  }
  function applyFilter() {
    const f = state.filter;
    let n = 0;
    $$(".rec").forEach((li) => {
      const r = idx[li.dataset.id].rec;
      const hit = f ? matches(r, f) : false;
      if (hit) n++;
      li.classList.toggle("hit", hit);
      li.classList.toggle("dim", !!f && !hit);
    });
    $$("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(!!f && norm(b.dataset.filter) === norm(f))));
    $("#chip-slot").innerHTML = f
      ? `<span class="chip"><span>${esc(disp(f))}</span><button type="button" data-clear aria-label="${esc(L(U("filterClear")))}">${esc(L(U("clear")))}</button></span>`
      : `<span class="none">${esc(L(U("filterNone")))}</span>`;
    $("#count").textContent = L(U("count")).replace("{n}", f ? n : total).replace("{m}", total);
    syncToggleAll();
  }

  function go(id) {
    const li = document.getElementById(`rec-${id}`);
    if (!li) return;
    setOpen(id, true);
    scrollToEl(li, "center");
    li.classList.remove("flash"); void li.offsetWidth; li.classList.add("flash");
    setTimeout(() => li.classList.remove("flash"), 1500);
    $(".r-name button", li).focus({ preventScroll: true });
    try { history.replaceState(null, "", `#rec-${id}`); } catch (e) { /* file: urls */ }
  }

  /* ---------- capabilities + ticker ---------- */
  function renderCaps() {
    $("#stack-ledger").innerHTML = S.stackLedger.map((r) => {
      const tags = r.v.split(", ").map((t) => {
        const n = countFor(t);
        return n ? tagBtn(t, `<span class="n">${n}</span>`) : `<span class="tag plain">${esc(disp(t))}</span>`;
      }).join("");
      return `<div><dt>${esc(L(r.k))}</dt><dd><div class="tags">${tags}</div></dd></div>`;
    }).join("");
    $("#ai-ledger").innerHTML = S.aiLedger.map((r) => `<div><dt>${esc(L(r.k))}</dt><dd>${esc(L(r.v))}</dd></div>`).join("");
  }
  function renderTicker() {
    const terms = [...new Set(S.stackLedger.flatMap((r) => r.v.split(", ")))];
    const set = terms.map((t) => `<span>${esc(disp(t))}</span>`).join("");
    $("#tick").innerHTML = set + set;
  }
  let tx = 0, lastY = scrollY, vel = 0;
  function tickLoop() {
    const dy = scrollY - lastY; lastY = scrollY;
    vel += (dy - vel) * 0.12;
    if (!reduce.matches) {
      const track = $("#tick"), half = track.scrollWidth / 2;
      tx -= clamp(vel * 0.3, -22, 22);
      if (half) { if (-tx >= half) tx += half; if (tx > 0) tx -= half; }
      track.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
    }
    requestAnimationFrame(tickLoop);
  }

  /* ---------- per-frame scroll work ---------- */
  let queued = false;
  function frame() {
    queued = false;
    if (pinned) {
      const track = $(".hero-track"), hero = $(".hero");
      const total = track.offsetHeight - hero.offsetHeight;
      const top = track.getBoundingClientRect().top - $(".bar").offsetHeight;
      scrub(clamp(-top / total, 0, 1));
    }
    const recs = $("#records").getBoundingClientRect();
    if (recs.top < innerHeight && recs.bottom > 0) {
      const mid = innerHeight * 0.5;
      $$(".rec").forEach((li) => { const r = li.getBoundingClientRect(); li.classList.toggle("cur", r.top <= mid && r.bottom > mid); });
    }
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(frame); } }

  /* ---------- decode triggers ---------- */
  const seen = new WeakSet();
  const decIO = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting || seen.has(e.target)) return;
        seen.add(e.target); decIO.unobserve(e.target);
        const el = e.target;
        if (el.matches(".v")) decode(el, el.textContent, { dur: 1000, set: DG });
        else decode(el, el.dataset.t ? L(U(el.dataset.t)) : el.textContent, { dur: 750 });
      }), { threshold: 0.01, rootMargin: "0px 0px -6% 0px" })
    : { observe() {}, unobserve() {} };

  function renderAll() {
    applyChrome();
    renderFlow();
    renderProfile();
    renderRecords();
    renderCaps();
    renderTicker();
    applyFilter();
    paint();
    const cur = stage.findIndex((s) => s === "processing");
    if (cur >= 0 || pinned) moveCursor(Math.max(0, cur));
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const lg = t.closest("[data-lang]");
    if (lg) { lang = lg.dataset.lang; try { history.replaceState(null, "", (lang === "th" ? "/th/" : "/") + location.hash); } catch (e) { /* file: urls */ } renderAll(); frame(); return; }
    const g = t.closest("[data-go]");
    if (g) { e.preventDefault(); go(g.dataset.go); return; }
    const f = t.closest("[data-filter]");
    if (f) {
      setFilter(f.dataset.filter);
      if (f.closest("#capabilities")) scrollToEl($("#filter"), "top");
      return;
    }
    if (t.closest("[data-clear]")) { state.filter = null; applyFilter(); return; }
    const nb = t.closest(".r-name button");
    if (nb) { const li = nb.closest(".rec"); setOpen(li.dataset.id, !li.classList.contains("open")); return; }
    if (t.closest("#toggleall")) {
      const open = $("#toggleall").dataset.mode === "open";
      S.groups.forEach((gr) => gr.records.forEach((r) => setOpen(r.id, open)));
      return;
    }
    const a = lenis && t.closest('a[href^="#"]');
    if (a && a.getAttribute("href").length > 1) {
      const el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) { e.preventDefault(); el.id === "top" ? lenis.scrollTo(0, { duration: 1.2 }) : scrollToEl(el, "top"); }
    }
  });

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { paint(); const c = stage.findIndex((s) => s === "processing"); if (c >= 0 || pinned) moveCursor(Math.max(0, c)); frame(); });
  document.addEventListener("visibilitychange", () => { clock.tab = !document.hidden; schedule(300); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((en) => { clock.hero = en[0].isIntersecting; schedule(300); }, { threshold: 0.05 }).observe($("#strip"));
  }
  pinQ.addEventListener("change", () => { setMode(); frame(); });
  reduce.addEventListener("change", () => location.reload());

  renderAll();
  setMode();
  frame();
  requestAnimationFrame(tickLoop);
  $$(".sh h2 > span[data-t]").forEach((el) => decIO.observe(el));
  if (!reduce.matches && !narrow.matches) decode($("h1"), "Thanapon Pruektan", { dur: 1000, delay: 150 });
  intro = false;
  const h = location.hash.match(/^#rec-(.+)$/);
  if (h && idx[h[1]]) setTimeout(() => go(h[1]), 150);
})();
