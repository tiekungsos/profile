(() => {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;

  const param = new URLSearchParams(location.search).get("lang");
  const lang = [param, document.documentElement.lang].find((v) => v === "en" || v === "th") || "en";
  const L = (o) => o[lang];
  const path = (o, p) => p.split(".").reduce((a, k) => (a ? a[k] : undefined), o);
  const U = (k) => path(S.ui, k);
  const disp = (t) => (lang === "th" && S.termTh[t]) || t;

  const idx = {};
  const total = S.groups.reduce((n, g) => n + g.records.length, 0);
  S.groups.forEach((g) => g.records.forEach((r, i) => { idx[r.id] = { rec: r, group: g, no: `${g.key}.${i + 1}` }; }));
  const state = { open: new Set(), filter: null };
  const norm = (s) => s.toLowerCase();
  const matches = (r, term) => r.stack.some((s) => norm(s) === norm(term));
  const countFor = (term) => S.groups.reduce((n, g) => n + g.records.filter((r) => matches(r, term)).length, 0);

  function scrollToEl(el, mode) {
    el.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: mode === "center" ? "center" : "start" });
  }

  /* ---------- static chrome ---------- */
  function applyChrome() {
    root.lang = lang;
    document.title = L(S.ui.title);
    $('meta[name="description"]').content = L(S.ui.description);
    $$("[data-t]").forEach((el) => { const v = U(el.dataset.t); if (!v) return; el.textContent = L(v); });
    $$("[data-alt]").forEach((el) => { el.alt = L(U(el.dataset.alt)); });
    $$("[data-lang]").forEach((a) => a.dataset.lang === lang ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    $("#langgroup").setAttribute("aria-label", L(S.ui.langLabel));
  }

  function renderFeatured() {
    $$(".feature").forEach((el) => {
      const r = idx[el.dataset.go].rec;
      $$("[data-feature]", el).forEach((field) => {
        field.textContent = field.dataset.feature === "name" ? r.name : L(r[field.dataset.feature]);
      });
    });
  }

  /* ---------- profile ---------- */
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
    const visible = $$(".rec:not([hidden])");
    const all = visible.length > 0 && visible.every((li) => state.open.has(li.dataset.id));
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
      li.hidden = !!f && !hit;
    });
    $$(".grp").forEach((g) => { g.hidden = !$(".rec:not([hidden])", g); });
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
    if (state.filter) { state.filter = null; applyFilter(); }
    setOpen(id, true);
    scrollToEl(li, "center");
    li.classList.remove("flash"); requestAnimationFrame(() => li.classList.add("flash"));
    setTimeout(() => li.classList.remove("flash"), 1500);
    $(".r-name button", li).focus({ preventScroll: true });
    try { history.replaceState(null, "", `#rec-${id}`); } catch (e) { /* file: urls */ }
  }

  /* ---------- capabilities ---------- */
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
  function renderAll() {
    applyChrome();
    renderFeatured();
    renderProfile();
    renderRecords();
    renderCaps();
    applyFilter();
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const g = t.closest("[data-go]");
    if (g) {
      if (g.tagName === "A" && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
      e.preventDefault(); go(g.dataset.go); return;
    }
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
      $$(".rec:not([hidden])").forEach((li) => setOpen(li.dataset.id, open));
      return;
    }
  });

  renderAll();
  const h = location.hash.match(/^#rec-(.+)$/);
  if (h && idx[h[1]]) setTimeout(() => go(h[1]), 150);
})();
