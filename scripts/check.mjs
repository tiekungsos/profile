import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(root, 'content.js'), 'utf8'), ctx);
const records = ctx.window.SITE.groups.flatMap(g => g.records);
const test = `<script>
try {
  const check = (ok, label) => { if (!ok) throw Error(label); };
  const visible = () => [...document.querySelectorAll('.rec:not([hidden])')];
  const all = SITE.groups.flatMap(g => g.records);
  check(visible().length === all.length, 'all projects rendered');
  check(document.querySelectorAll('.feature').length === 3, 'selected work rendered');
  check(document.querySelector('[aria-current="page"]').dataset.lang === document.documentElement.lang, 'language navigation');
  document.querySelector('[data-filter="TypeScript"]').click();
  const expected = all.filter(r => r.stack.includes('TypeScript')).length;
  check(visible().length === expected, 'filter hides unrelated projects');
  check(document.querySelector('#count').textContent.includes(String(expected)), 'filter count');
  check([...document.querySelectorAll('.grp[hidden]')].every(g => !g.querySelector('.rec:not([hidden])')), 'empty groups hidden');
  document.querySelector('#toggleall').click();
  check(visible().every(r => r.classList.contains('open')), 'expand filtered projects');
  check(document.querySelector('#toggleall').dataset.mode === 'close', 'filtered toggle state');
  document.querySelector('#toggleall').click();
  check(visible().every(r => !r.classList.contains('open')), 'collapse filtered projects');
  document.querySelector('[data-clear]').click();
  check(visible().length === all.length, 'clear filter');
  document.querySelector('[data-filter="TypeScript"]').click();
  document.querySelector('.feature[data-go="naka-wallet"]').click();
  check(visible().length === all.length, 'selected work resets filter');
  const button = document.querySelector('#rec-naka-wallet .r-name button');
  check(button.getAttribute('aria-expanded') === 'true', 'selected work opens details');
  check(document.activeElement === button, 'selected work moves keyboard focus');
  const modified = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
  document.querySelector('.feature[data-go="bizstock"]').addEventListener('click', event => event.preventDefault(), { once: true });
  const hash = location.hash;
  document.querySelector('.feature[data-go="bizstock"]').dispatchEvent(modified);
  check(location.hash === hash, 'modified links retain native navigation');
  check(document.querySelectorAll('.name-line').length === 2, 'hero name remains accessible');
  check(document.querySelector('#name').getAttribute('aria-label') === 'Thanapon Pruektan', 'hero accessible name');
  check(!document.documentElement.classList.contains('motion-ready'), 'reduced motion disables effects');
  check(document.getAnimations().filter(animation => animation.playState === 'running').length === 0, 'reduced motion has no active animations');
  document.body.dataset.check = 'passed';
} catch (error) { document.body.dataset.check = error.message; }
</script>`;
const motionTest = `<script>
(async () => {
  try {
    const check = (ok, label) => { if (!ok) throw Error(label); };
    check(document.documentElement.classList.contains('motion-ready'), 'motion enabled');
    check(document.getAnimations().some(a => a.effect.target.closest('.name-line')), 'hero entrance runs');
    document.querySelector('#selected').scrollIntoView({ behavior: 'instant' });
    await new Promise(resolve => setTimeout(resolve, 150));
    const art = document.querySelector('.project-art');
    const box = art.getBoundingClientRect();
    art.dispatchEvent(new PointerEvent('pointermove', { clientX: box.left + box.width * .8, clientY: box.top + box.height * .3, pointerType: 'mouse' }));
    check(!matchMedia('(hover: hover) and (pointer: fine)').matches || art.style.getPropertyValue('--tilt-y') !== '', 'desktop pointer tilt');
    art.dispatchEvent(new PointerEvent('pointerleave'));
    check(art.style.getPropertyValue('--tilt-y') === '' && !art.classList.contains('is-tilting'), 'tilt resets');
    check(document.querySelector('.feature').classList.contains('in-view'), 'scroll reveal observes visible work');
    check(document.getAnimations().some(a => a.animationName === 'rack-scan'), 'warehouse animation runs');
    check(document.getAnimations().some(a => a.animationName === 'voice-wave'), 'voice animation runs');
    check(getComputedStyle(document.querySelector('.reading-progress')).transform !== 'matrix(0, 0, 0, 1, 0, 0)', 'reading progress follows scroll');
    document.body.dataset.check = 'passed';
  } catch (error) { document.body.dataset.check = error.message; }
})();
</script>`;
const temp = join(root, '.ssr-check.html');
const profile = join(root, '.ssr-check-profile');
try {
  const template = readFileSync(join(root, 'index.template.html'), 'utf8')
    .replace('<!--SEO-->', '<meta name="description" content="">')
    .replace(/<link[^>]*fonts\.g[^>]*>\n?/g, '')
    .replace('</body>', test + '</body>');
  writeFileSync(temp, template);
  for (const lang of ['en', 'th']) {
    const html = readFileSync(join(root, lang === 'en' ? 'index.html' : 'th/index.html'), 'utf8');
    assert.equal((html.match(/class="rec(?: |")/g) || []).length, records.length, `${lang}: prerendered project count`);
    for (const r of records) assert.ok(html.includes(`id="rec-${r.id}"`), `${lang}: ${r.name}`);
    assert.ok(html.includes(`<html lang="${lang}">`));
    const output = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--force-prefers-reduced-motion=reduce', `--user-data-dir=${profile}`, '--dump-dom', `${pathToFileURL(temp).href}?lang=${lang}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 30000, stdio: ['ignore', 'pipe', 'ignore'] });
    assert.match(output, /data-check="passed"/, `${lang}: browser interaction checks failed: ${output.match(/data-check="([^"]*)"/)?.[1] || 'no result'}`);
    console.log(`${lang}: prerendered content + 18 browser interaction checks passed`);
  }
  writeFileSync(temp, template.replace(test, motionTest));
  const motionOutput = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--virtual-time-budget=1200', '--window-size=1440,1000', `--user-data-dir=${profile}`, '--dump-dom', pathToFileURL(temp).href], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 30000, stdio: ['ignore', 'pipe', 'ignore'] });
  assert.match(motionOutput, /data-check="passed"/, `motion checks failed: ${motionOutput.match(/data-check="([^"]*)"/)?.[1] || 'no result'}`);
  console.log('motion: 8 entrance, scroll, artwork and pointer checks passed');
} finally {
  rmSync(temp, { force: true });
  rmSync(profile, { recursive: true, force: true });
}
