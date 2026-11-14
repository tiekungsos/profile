// Static build: prerenders index.html (EN) and th/index.html (TH) from index.template.html
// by running the real app.js in headless Chrome, then writes SEO tags, sitemap, robots and llms files.
// Usage: node scripts/build.mjs   (SITE_URL=https://your-domain node scripts/build.mjs)
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = (process.env.SITE_URL || "https://profile-theta-amber-40.vercel.app").replace(/\/$/, "");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const today = new Date().toISOString().slice(0, 10);

const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(root, "content.js"), "utf8"), ctx);
const S = ctx.window.SITE;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const name = (r) => r.name;
const records = S.groups.flatMap((g) => g.records.map((r) => ({ ...r, group: g })));
const urlFor = (l) => (l === "th" ? `${SITE_URL}/th/` : `${SITE_URL}/`);

/* ---------- prerender body via headless Chrome ---------- */
function prerender(lang, template) {
  const tmp = join(root, `.ssr-${lang}.html`);
  const pre = `<script>delete window.IntersectionObserver;window.setTimeout=function(){return 0};window.requestAnimationFrame=function(){return 0};</script>`;
  const page = template
    .replace("<!--SEO-->", seo(lang) + pre)
    .replace(/<link[^>]*fonts\.g[^>]*>\n?/g, "")
    .replace(/<script type="module"[^>]*><\/script>\n?/, "");
  writeFileSync(tmp, page);
  try {
    const out = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${join(root, ".ssr-profile")}`, "--window-size=800,900", "--dump-dom", `${pathToFileURL(tmp).href}?lang=${lang}`], { maxBuffer: 64 * 1024 * 1024, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const m = out.match(/<body[^>]*>([\s\S]*)<\/body>/);
    if (!m) throw new Error("no body in dump");
    return m[1].replace(/<script[\s\S]*?<\/script>/g, "").replace(/[ \t]+$/gm, "").trim();
  } finally {
    rmSync(tmp, { force: true });
    rmSync(join(root, ".ssr-profile"), { recursive: true, force: true });
  }
}

/* ---------- SEO head ---------- */
function jsonld(lang) {
  const L = (o) => o[lang];
  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: "Thanapon Pruektan",
    jobTitle: "Senior Full Stack Developer",
    description: S.ui.description.en,
    url: SITE_URL + "/",
    image: `${SITE_URL}/assets/portrait.jpg`,
    email: `mailto:${S.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Bangkok", addressCountry: "TH" },
    sameAs: [S.linkedin, S.github],
    worksFor: [
      { "@type": "Organization", name: "3W Business and Solutions" },
      { "@type": "Organization", name: "KOS Design" }
    ],
    alumniOf: { "@type": "CollegeOrUniversity", name: "Chiang Mai University" },
    knowsAbout: ["Warehouse management systems", "SAP integration", "Enterprise e-commerce", "Magento", "Web3 payments", "Real-time systems", "AI avatars", "LLM applications", "TypeScript", "Node.js", "React", "PostgreSQL", "DevOps"],
    knowsLanguage: ["en", "th"]
  };
  const site = { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL + "/", name: "Thanapon Pruektan", inLanguage: ["en", "th"], publisher: { "@id": person["@id"] } };
  const page = {
    "@type": "ProfilePage",
    "@id": `${urlFor(lang)}#profilepage`,
    url: urlFor(lang),
    name: L(S.ui.title),
    description: L(S.ui.description),
    inLanguage: lang,
    dateModified: today,
    isPartOf: { "@id": site["@id"] },
    mainEntity: { "@id": person["@id"] },
    primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}/assets/og-image.png`, width: 1200, height: 630 }
  };
  const list = {
    "@type": "ItemList",
    "@id": `${urlFor(lang)}#projects`,
    name: lang === "th" ? "ผลงานและโปรเจกต์" : "Projects and records",
    itemListElement: records.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "CreativeWork", name: r.name, description: L(r.summary), creator: { "@id": person["@id"] }, keywords: r.stack.join(", "), url: `${urlFor(lang)}#rec-${r.id}` }
    }))
  };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [person, site, page, list] });
}

function seo(lang) {
  const title = S.ui.title[lang], desc = S.ui.description[lang], url = urlFor(lang);
  const alt = lang === "th" ? "en_US" : "th_TH";
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<meta name="author" content="Thanapon Pruektan">`,
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" hreflang="en" href="${urlFor("en")}">`,
    `<link rel="alternate" hreflang="th" href="${urlFor("th")}">`,
    `<link rel="alternate" hreflang="x-default" href="${urlFor("en")}">`,
    `<link rel="alternate" type="text/plain" href="${SITE_URL}/llms.txt" title="LLM-readable summary">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:site_name" content="Thanapon Pruektan">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:locale" content="${lang === "th" ? "th_TH" : "en_US"}">`,
    `<meta property="og:locale:alternate" content="${alt}">`,
    `<meta property="og:image" content="${SITE_URL}/assets/og-image.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Thanapon Pruektan, Senior Full Stack Developer: selected warehouse, Web3 payment and AI projects">`,
    `<meta property="profile:first_name" content="Thanapon">`,
    `<meta property="profile:last_name" content="Pruektan">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${SITE_URL}/assets/og-image.png">`,
    `<script type="application/ld+json">${jsonld(lang)}</script>`
  ].join("\n");
}

/* ---------- assemble pages ---------- */
const template = readFileSync(join(root, "index.template.html"), "utf8");
const absolutize = (html) => html.replace(/\b(href|src)="(?!(?:https?:|mailto:|data:|#|\/))([^"]+)"/g, '$1="/$2"');

for (const lang of ["en", "th"]) {
  const body = prerender(lang, template);
  if ((body.match(/class="rec(?: |")/g) || []).length !== records.length) throw new Error(`${lang}: incomplete prerender`);
  const head = template.match(/<head>([\s\S]*?)<\/head>/)[1].replace("<!--SEO-->", seo(lang));
  const tail = template.match(/<\/main>[\s\S]*?<footer[\s\S]*?<\/footer>([\s\S]*?)<\/body>/);
  const scripts = (template.match(/<script src="content\.js"><\/script>[\s\S]*?(?=<\/body>)/) || [""])[0];
  const html = absolutize(`<!doctype html>\n<html lang="${lang}">\n<head>${head}</head>\n<body>\n${body}\n${scripts}</body>\n</html>\n`);
  if (lang === "en") writeFileSync(join(root, "index.html"), html);
  else { mkdirSync(join(root, "th"), { recursive: true }); writeFileSync(join(root, "th", "index.html"), html); }
  console.log(lang, "html", (html.length / 1024).toFixed(0) + " KB");
}

/* ---------- sitemap, robots ---------- */
writeFileSync(join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${["en", "th"].map((l) => `  <url>
    <loc>${urlFor(l)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${l === "en" ? "1.0" : "0.8"}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlFor("en")}"/>
    <xhtml:link rel="alternate" hreflang="th" href="${urlFor("th")}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor("en")}"/>
  </url>`).join("\n")}
</urlset>
`);

const bots = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Meta-ExternalAgent", "Amazonbot", "DuckAssistBot", "Bingbot", "Googlebot"];
writeFileSync(join(root, "robots.txt"), `# Everyone, including search and AI crawlers, may read this site.
User-agent: *
Allow: /

${bots.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")}

Sitemap: ${SITE_URL}/sitemap.xml
# LLM-readable summaries: ${SITE_URL}/llms.txt and ${SITE_URL}/llms-full.txt
`);

/* ---------- llms.txt, llms-full.txt ---------- */
const en = (o) => o.en;
const summary = `${en(S.ui.pitch)} Based in Bangkok, Thailand. Open to senior roles and consulting.`;
writeFileSync(join(root, "llms.txt"), `# Thanapon Pruektan

> Senior Full Stack Developer in Bangkok, Thailand. 8+ years building warehouse (WMS) and SAP-integrated logistics systems, enterprise e-commerce, Web3 payment gateways, real-time platforms and production AI. Open to senior roles and consulting.

${summary}

## Pages
- [Portfolio (English)](${urlFor("en")}): Profile, 15 project records with what was built, stack and capabilities.
- [Portfolio (Thai)](${urlFor("th")}): Same content in Thai.
- [Full text for LLMs](${SITE_URL}/llms-full.txt): Every record, bullet and skill in plain Markdown.
- [Résumé PDF](${SITE_URL}/${S.resume}): Two-page résumé in English.

## Contact
- Email: ${S.email}
- LinkedIn: ${S.linkedin}
- GitHub: ${S.github}

## Notes
- Project artwork is an original conceptual illustration, not client screens or data.
`);

const lines = [];
lines.push(`# Thanapon Pruektan: Senior Full Stack Developer`, ``, `> ${summary}`, ``);
lines.push(`Contact: ${S.email} | LinkedIn ${S.linkedin} | GitHub ${S.github}`, `Canonical page: ${urlFor("en")} (Thai: ${urlFor("th")})`, ``);
lines.push(`## Profile`, ``, S.profile.en, ``);
lines.push(`## Key figures (each traces to a project record below)`, ``);
for (const r of S.ledger) lines.push(`- ${r.metric.en}: ${r.value.en}${r.source ? ` (record: ${records.find((x) => x.id === r.source).name})` : ""}`);
lines.push(``, `## Records`, ``);
for (const g of S.groups) {
  const gn = typeof g.company === "string" ? g.company : g.company.en;
  lines.push(`### ${gn}${g.role ? `: ${g.role.en}` : ""}${g.dates ? ` (${g.dates.en})` : ""}`, ``);
  if (g.summary) lines.push(g.summary.en, ``);
  for (const r of g.records) {
    lines.push(`#### ${r.name}${r.role ? ` (role: ${r.role.en})` : ""}`, ``, `Type: ${r.type.en}. Stack: ${r.stack.join(", ")}.`, ``, r.summary.en, ``);
    for (const b of r.bullets) lines.push(`- ${b.en}`);
    lines.push(``);
  }
}
lines.push(`## Stack`, ``);
for (const r of S.stackLedger) lines.push(`- ${r.k.en}: ${r.v}`);
lines.push(``, `## AI and automation`, ``);
for (const r of S.aiLedger) lines.push(`- ${r.k.en}: ${r.v.en}`);
lines.push(``, `## Education`, ``, `${S.ui.eduDegree.en}, ${S.ui.eduSchool.en}`, ``);
writeFileSync(join(root, "llms-full.txt"), lines.join("\n"));
console.log("done:", SITE_URL);
